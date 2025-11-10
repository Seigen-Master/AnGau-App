
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { adminClockInOut } = require("./adminClockInOut");

admin.initializeApp();
const db = admin.firestore();

const functionOptions = {
    concurrency: 1,
    timeoutSeconds: 60,
    memory: "256MiB",
};

// Helper function to set custom claims
const setUserClaims = async (userId, role) => {
    let customClaims = {};
    if (role === 'admin') {
        customClaims = { admin: true };
    } else if (role === 'caregiver') {
        customClaims = { caregiver: true };
    }

    try {
        await admin.auth().setCustomUserClaims(userId, customClaims);
        console.log(`Successfully set custom claims for user ${userId}:`, customClaims);
    } catch (error) {
        console.error(`Error setting custom claims for user ${userId}:`, error);
    }
};

exports.onUserCreate = onDocumentCreated({ ...functionOptions, document: "users/{userId}" }, (event) => {
    const userData = event.data.data();
    const userId = event.params.userId;
    const role = userData.role;
    console.log(`New user created: ${userId}, assigning role: ${role}`);
    return setUserClaims(userId, role);
});

exports.onUserUpdate = onDocumentUpdated({ ...functionOptions, document: "users/{userId}" }, (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const userId = event.params.userId;

    if (beforeData.role !== afterData.role) {
        console.log(`User role changed for ${userId} from ${beforeData.role} to ${afterData.role}`);
        return setUserClaims(userId, afterData.role);
    }
    return null;
});


exports.getAdmin = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to call this function.");
  }

  const usersCollection = await db.collection("users").where("role", "==", "admin").limit(1).get();
  if (usersCollection.empty) {
    throw new HttpsError("not-found", "No admin user found.");
  }

  const adminDoc = usersCollection.docs[0];
  const adminUser = { uid: adminDoc.id, ...adminDoc.data() };
  
  return adminUser;
});

exports.expireSchedules = onSchedule({ ...functionOptions, schedule: "every 5 minutes" }, async (context) => {
    console.log("Running expireSchedules scheduled function.");
    const now = new Date();
    const schedulesRef = db.collection('schedules');

    try {
        const pendingSchedulesSnapshot = await schedulesRef
            .where('status', '==', 'pending')
            .get();

        const batch = db.batch();
        let expiredCount = 0;

        pendingSchedulesSnapshot.docs.forEach(doc => {
            const schedule = doc.data();
            const scheduleStartTime = schedule.startTimestamp.toDate();
            const twentyMinsAfterStart = new Date(scheduleStartTime.getTime() + (20 * 60 * 1000));

            if (now > twentyMinsAfterStart) {
                batch.update(doc.ref, { status: 'expired' });
                expiredCount++;
                console.log(`Schedule ${doc.id} for patient ${schedule.patientName} has expired.`);
            }
        });

        if (expiredCount > 0) {
            await batch.commit();
            console.log(`Successfully expired ${expiredCount} schedules.`);
        } else {
            console.log("No pending schedules found to expire.");
        }
    } catch (error) {
        console.error("Error in expireSchedules:", error);
    }
    return null;
});

exports.autoClockOutOverdueActiveShifts = onSchedule({ ...functionOptions, schedule: "every 1 minutes" }, async (context) => {
    console.log("Running autoClockOutOverdueActiveShifts scheduled function.");
    const now = new Date();
    const schedulesRef = db.collection('schedules');

    try {
        const activeSchedulesSnapshot = await schedulesRef
            .where('status', '==', 'active')
            .get();

        const batch = db.batch();
        let autoClockOutCount = 0;

        activeSchedulesSnapshot.docs.forEach(doc => {
            const schedule = doc.data();
            const scheduleEndTime = schedule.endTimestamp.toDate();
            const tenMinsAfterEnd = new Date(scheduleEndTime.getTime() + (10 * 60 * 1000));

            if (now > tenMinsAfterEnd && !schedule.clockOut) {
                batch.update(doc.ref, {
                    status: 'completed',
                    clockOut: admin.firestore.Timestamp.fromDate(scheduleEndTime),
                    notes: (schedule.notes || '') + ' [System Auto-Clock-Out: Shift ended and not clocked out within 10 minutes. Overdue time not counted.]'
                });
                autoClockOutCount++;
                console.log(`Schedule ${doc.id} for patient ${schedule.patientName} auto-clocked out due to overdue shift.`);
            }
        });

        if (autoClockOutCount > 0) {
            await batch.commit();
            console.log(`Successfully auto-clocked out ${autoClockOutCount} overdue shifts.`);
        } else {
            console.log("No overdue active schedules found for auto-clock-out.");
        }
    } catch (error) {
        console.error("Error in autoClockOutOverdueActiveShifts:", error);
    }
    return null;
});


exports.createCaregiver = onCall(functionOptions, async (request) => {
    if (!request.auth || !request.auth.token.admin) {
        throw new HttpsError('permission-denied', 'You must be an admin to manage users.');
    }

    const { email, password, name, phone } = request.data;
    if (!email || !password || !name) {
        throw new HttpsError('invalid-argument', 'Missing required fields for creating a caregiver.');
    }
    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName: name, emailVerified: true });
        const userData = {
            uid: userRecord.uid,
            name,
            displayName: name,
            email,
            phone: phone || null,
            status: 'active',
            role: 'caregiver',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('users').doc(userRecord.uid).set(userData);
        return { result: `Successfully created caregiver ${name}.` };
    } catch (error) {
        console.error("Error creating caregiver:", error);
        throw new HttpsError('internal', error.message, error.code);
    }
});

exports.changePassword = onCall(functionOptions, async (request) => {
  console.log("changePassword function invoked.");
  if (!request.auth || !request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'You must be an admin to change passwords.');
  }

  const { uid, newPassword } = request.data;

  if (!uid || !newPassword) {
    throw new HttpsError('invalid-argument', 'Missing required fields: uid and newPassword.');
  }

  if (newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    return { result: `Successfully changed password for user ${uid}.` };
  } catch (error) {
    console.error("Error changing password:", error);
    throw new HttpsError('internal', error.message, error.code);
  }
});

exports.caregiverClockInOut = onCall(functionOptions, async (request) => {
    if (!request.auth) {
        throw new HttpsError('permission-denied', 'You must be logged in to perform this action.');
    }

    const { scheduleId, action } = request.data;
    if (!scheduleId || !action || !['clockIn', 'clockOut'].includes(action)) {
        throw new HttpsError('invalid-argument', 'Invalid arguments provided.');
    }

    const scheduleRef = db.collection('schedules').doc(scheduleId);

    try {
        const scheduleDoc = await scheduleRef.get();
        if (!scheduleDoc.exists) {
            throw new HttpsError('not-found', 'Schedule not found.');
        }

        const scheduleData = scheduleDoc.data();
        if (scheduleData.caregiverId !== request.auth.uid) {
            throw new HttpsError('permission-denied', 'You are not assigned to this schedule.');
        }

        const now = admin.firestore.FieldValue.serverTimestamp();
        let updateData = {};

        if (action === 'clockIn') {
            if (scheduleData.status === 'active' || scheduleData.clockIn) {
                throw new HttpsError('failed-precondition', 'Already clocked in.');
            }
            updateData = { status: 'active', clockIn: now };
        } else { // clockOut
            if (scheduleData.status === 'completed' || scheduleData.clockOut) {
                throw new HttpsError('failed-precondition', 'Already clocked out.');
            }
            if (!scheduleData.clockIn || !(scheduleData.clockIn instanceof admin.firestore.Timestamp)) {
                throw new HttpsError('failed-precondition', 'Cannot clock out before clocking in or clock-in time is invalid.');
            }
            
            const clockInTime = scheduleData.clockIn.toDate();
            const clockOutTime = new Date(); // Current time
            const durationMs = clockOutTime.getTime() - clockInTime.getTime();
            const totalHours = Math.round((durationMs / 3600000) * 100) / 100;

            updateData = { status: 'completed', clockOut: now, totalHours };
        }

        await scheduleRef.update(updateData);
        return { result: `Successfully performed ${action}.` };

    } catch (error) {
        console.error(`Error during ${action} for schedule ${scheduleId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An internal error occurred while trying to ${action}.`);
    }
});


exports.adminClockInOut = onCall(functionOptions, adminClockInOut);

exports.unassignPatientOnShiftCompletion = onDocumentWritten({ ...functionOptions, document: "schedules/{scheduleId}" }, async (event) => {
    if (!event.data.before.exists || !event.data.after.exists) {
        return null;
    }
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== after.status && ['completed', 'cancelled', 'expired'].includes(after.status)) {
        const { caregiverId, patientId } = after;
        if (!caregiverId || !patientId) return null;

        try {
            const relevantSchedulesSnapshot = await db.collection('schedules')
                .where('caregiverId', '==', caregiverId)
                .where('patientId', '==', patientId)
                .where('status', 'in', ['pending', 'active'])
                .where('startTimestamp', '>=', admin.firestore.Timestamp.now())
                .get();

            if (relevantSchedulesSnapshot.empty) {
                const caregiverRef = admin.firestore().collection('users').doc(caregiverId);
                await caregiverRef.update({
                    assignedPatientIds: admin.firestore.FieldValue.arrayRemove(patientId)
                });
                console.log(`Successfully unassigned patient ${patientId} from caregiver ${caregiverId}.`);
            } else {
                console.log(`Patient ${patientId} remains assigned to caregiver ${caregiverId}.`);
            }
        } catch (error) {
            console.error(`Failed to unassign patient ${patientId} from caregiver ${caregiverId}:`, error);
        }
    }
    return null;
});

exports.onScheduleChangeUnassignPatient = onSchedule({ ...functionOptions, schedule: "every 24 hours" }, async (context) => {
    console.log("Running cleanUpCaregiverAssignments scheduled function.");

    try {
        const caregiversSnapshot = await db.collection('users').where('role', '==', 'caregiver').get();

        for (const doc of caregiversSnapshot.docs) {
            const caregiver = doc.data();
            const caregiverId = doc.id;
            const assignedPatientIds = caregiver.assignedPatientIds || [];
            const patientsToKeep = [];
            
            for (const patientId of assignedPatientIds) {
                const relevantSchedulesSnapshot = await db.collection('schedules')
                    .where('caregiverId', '==', caregiverId)
                    .where('patientId', '==', patientId)
                    .where('status', 'in', ['pending', 'active'])
                    .where('startTimestamp', '>=', admin.firestore.Timestamp.now())
                    .limit(1) 
                    .get();
                
                if (!relevantSchedulesSnapshot.empty) {
                    patientsToKeep.push(patientId);
                } else {
                    console.log(`Patient ${patientId} will be unassigned from caregiver ${caregiverId}.`);
                }
            }

            if (assignedPatientIds.length !== patientsToKeep.length) {
                await db.collection('users').doc(caregiverId).update({
                    assignedPatientIds: patientsToKeep
                });
                console.log(`Updated assigned patients for caregiver ${caregiverId}.`);
            }
        }
    } catch (error) {
        console.error("Error in cleanUpCaregiverAssignments:", error);
    }
    return null;
});

exports.handleApprovedRequest = onDocumentWritten({ ...functionOptions, document: "requests/{requestId}" }, async (event) => {
    const after = event.data.after.data();
    const before = event.data.before.data();

    if (before.status !== 'approved' && after.status === 'approved') {
        const { scheduleId, type, caregiverId } = after;
        const scheduleRef = db.collection('schedules').doc(scheduleId);

        if (type === 'cancellation') {
            await scheduleRef.update({ status: 'cancelled' });
            const caregiverRef = db.collection('users').doc(caregiverId);
            await caregiverRef.update({
                cancellationBonus: admin.firestore.FieldValue.increment(1.5)
            });
        }
    }
});

exports.onNewMessage = onDocumentWritten({ ...functionOptions, document: "conversations/{conversationId}/messages/{messageId}" }, async (event) => {
    if (!event.data.after.exists) {
        return;
    }

    const message = event.data.after.data();
    const { conversationId } = event.params;

    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
        console.log(`Conversation ${conversationId} not found.`);
        return;
    }
    const conversation = conversationDoc.data();

    const recipientId = conversation.participants.find(p => p !== message.senderId);
    if (!recipientId) {
        console.log("Recipient not found in conversation.");
        return;
    }
    
    const senderDoc = await db.collection('users').doc(message.senderId).get();
    const senderName = senderDoc.exists ? senderDoc.data().name : 'Unknown Sender';

    const notificationsRef = db.collection('notifications');
    const q = notificationsRef
        .where('recipientId', '==', recipientId)
        .where('resourceId', '==', conversationId)
        .where('type', '==', 'message');

    const existingNotifsSnapshot = await q.get();

    if (!existingNotifsSnapshot.empty) {
        const batch = db.batch();
        const docsToUpdate = existingNotifsSnapshot.docs;
        
        const latestNotifRef = docsToUpdate[0].ref;
        batch.update(latestNotifRef, {
            content: message.content,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            senderName,
            read: false,
        });

        for (let i = 1; i < docsToUpdate.length; i++) {
            batch.delete(docsToUpdate[i].ref);
        }

        await batch.commit();

    } else {
        const newNotification = {
            recipientId,
            senderId: message.senderId,
            senderName,
            type: 'message',
            resourceId: conversationId,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            content: message.content,
        };
        await notificationsRef.add(newNotification);
    }
});

exports.onRequestChange = onDocumentWritten({ ...functionOptions, document: "requests/{requestId}" }, async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!before && after) {
        const admins = await db.collection('users').where('role', '==', 'admin').get();
        const notificationPromises = [];

        admins.forEach(adminDoc => {
            const notification = {
                recipientId: adminDoc.id,
                senderId: after.caregiverId,
                senderName: after.caregiverName,
                type: `${after.type}_request`,
                resourceId: event.params.requestId,
                read: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            notificationPromises.push(db.collection('notifications').add(notification));
        });
        
        await Promise.all(notificationPromises);
    }

    if (before && after && before.status === 'pending' && (after.status === 'approved' || after.status === 'denied')) {
        const caregiverNotification = {
            recipientId: after.caregiverId,
            senderId: 'admin',
            senderName: 'Admin',
            type: `request_${after.status}`,
            resourceId: event.params.requestId,
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            content: `Your ${after.type.replace('_', ' ')} request for patient ${after.patientName} has been ${after.status}.`
        };
        
        await db.collection('notifications').add(caregiverNotification);
    }
});

exports.getConversations = onCall(functionOptions, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');
    const { uid } = request.auth;
    const snapshot = await db.collection('conversations').where('participants', 'array-contains', uid).get();
    const promises = snapshot.docs.map(async doc => {
        const conversation = { id: doc.id, ...doc.data() };
        const otherId = conversation.participants.find(p => p !== uid);
        if (!otherId) return null;
        const userDoc = await db.collection('users').doc(otherId).get();
        if (!userDoc.exists) return null;
        return { ...conversation, participantName: userDoc.data().name, participantProfilePicture: userDoc.data().profilePictureUrl };
    });
    const results = await Promise.all(promises);
    return results.filter(Boolean);
});

exports.sendMessage = onCall(functionOptions, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const { uid } = request.auth;
    const { conversationId, text, imageUrl } = request.data;

    console.log(`sendMessage called with conversationId: ${conversationId}`);

    if (!conversationId || (!text && !imageUrl)) throw new HttpsError('invalid-argument', 'Missing fields.');

    const message = { senderId: uid, timestamp: admin.firestore.FieldValue.serverTimestamp() };
    if (text) message.text = text;
    if (imageUrl) message.imageUrl = imageUrl;

    await db.collection('conversations').doc(conversationId).collection('messages').add(message);
    await db.collection('conversations').doc(conversationId).update({ lastMessage: text || '[Image]', timestamp: message.timestamp });

    return { success: true };
});

exports.createConversation = onCall(functionOptions, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to create a conversation.');
    }

    const { uid } = request.auth;
    const { participantIds } = request.data;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        throw new HttpsError('invalid-argument', 'The function must be called with an array of participant IDs.');
    }

    const allParticipantIds = [...new Set([...participantIds, uid])].sort();

    if (allParticipantIds.length < 2) {
         throw new HttpsError('invalid-argument', 'A conversation requires at least two participants.');
    }

    const conversationId = allParticipantIds.join('_');
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (conversationDoc.exists) {
        console.log(`Conversation ${conversationId} already exists.`);
        return { id: conversationDoc.id, ...conversationDoc.data(), existed: true };
    }

    console.log(`Creating new conversation: ${conversationId}`);
    const conversationData = {
        participants: allParticipantIds,
        lastMessage: '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await conversationRef.set(conversationData);

    return { id: conversationRef.id, ...conversationData, existed: false };
});

exports.getAllUsers = onCall(functionOptions, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');
    const usersRef = db.collection('users');
    let snapshot;
    if (request.auth.token.admin) {
        snapshot = await usersRef.get();
    } else {
        snapshot = await usersRef.where('role', '==', 'admin').get();
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            uid: doc.id // Ensure uid is always the document ID, overriding any stale/missing data.
        };
    });
});
