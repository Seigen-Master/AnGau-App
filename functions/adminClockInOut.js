const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");

// Ensure Firebase is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * A callable function for admins to manually clock in or out a caregiver for a specific schedule.
 * @param {object} request The request object from the client.
 * @param {object} request.auth The authenticated user's context.
 * @param {object} request.data The data payload from the client.
 * @param {string} request.data.scheduleId The ID of the schedule to modify.
 * @param {'clockIn'|'clockOut'} request.data.action The action to perform.
 */
exports.adminClockInOut = async (request) => {
  // 1. Authentication & Authorization Check
  if (!request.auth || !request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
  }

  // 2. Input Validation
  const { scheduleId, action } = request.data;
  const adminId = request.auth.uid;

  if (!scheduleId || !action || !['clockIn', 'clockOut'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Missing or invalid required fields: scheduleId and action.');
  }

  const scheduleRef = db.collection('schedules').doc(scheduleId);

  // 3. Core Logic within a Transaction
  return db.runTransaction(async (transaction) => {
    const scheduleDoc = await transaction.get(scheduleRef);
    if (!scheduleDoc.exists) {
      throw new HttpsError('not-found', 'Schedule not found.');
    }

    const scheduleData = scheduleDoc.data();
    const now = new Date();
    let updateData = {};

    if (action === 'clockIn') {
      if (scheduleData.clockIn) {
        throw new HttpsError('failed-precondition', 'This shift has already been clocked in.');
      }
      updateData = { 
        status: 'active', 
        clockIn: now, 
        notes: (scheduleData.notes || '') + ` [Admin Clock-In by ${adminId}]` 
      };
    } else { // clockOut action
      if (scheduleData.clockOut) {
        throw new HttpsError('failed-precondition', 'This shift has already been clocked out.');
      }
      if (!scheduleData.clockIn) {
        throw new HttpsError('failed-precondition', 'Cannot clock out before clocking in.');
      }
      
      const clockInTime = scheduleData.clockIn.toDate();
      const durationMs = now.getTime() - clockInTime.getTime();
      const durationHours = Math.max(0, durationMs / (1000 * 60 * 60)); // Ensure non-negative

      updateData = { 
        status: 'completed', 
        clockOut: now,
        totalHours: durationHours,
        notes: (scheduleData.notes || '') + ` [Admin Clock-Out by ${adminId}]` 
      };
    }

    transaction.update(scheduleRef, updateData);
    return { success: true, message: `Successfully performed ${action}.`, newStatus: updateData.status };
  });
};