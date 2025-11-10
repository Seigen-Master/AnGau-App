const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * A callable Cloud Function for an admin to change a user's password.
 *
 * @param {object} data - The data passed to the function.
 * @param {string} data.uid - The UID of the user whose password is to be changed.
 * @param {string} data.newPassword - The new password for the user.
 * @param {object} context - The context of the function call.
 * @param {object} context.auth - The authentication information of the calling user.
 * @param {object} context.auth.token - The decoded ID token of the calling user.
 * @param {string} context.auth.token.role - The custom claim "role" of the user.
 *
 * @returns {Promise<object>} A promise that resolves with a success message or rejects with an error.
 */
exports.changePassword = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Authorization Check
  if (context.auth?.token?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This function can only be called by an admin user."
    );
  }

  // 2. Input Validation
  const { uid, newPassword } = data;
  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      'The function must be called with "uid" and "newPassword" arguments.'
    );
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The new password must be a string of at least 6 characters."
    );
  }

  // 3. Main Logic
  try {
    // Use the Firebase Admin SDK to update the user's password.
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    // 4. Return Success Response
    return {
      success: true,
      message: `Password for user ${uid} has been updated successfully.`,
    };
  } catch (error) {
    // 5. Error Handling
    console.error(`Error changing password for user ${uid}:`, error);

    // Provide a more specific error message if the user is not found.
    if (error.code === "auth/user-not-found") {
      throw new functions.https.HttpsError("not-found", "The specified user UID was not found.");
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while trying to change the password."
    );
  }
});
