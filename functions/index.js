// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');


exports.sendGroupCreatedNotification = functions.database.ref('/group/{groupId}').onCreate(event => {

}
);


exports.sendChatNotifications = functions.database.ref('/group/{groupId}/lastMessage').onWrite(event => { 

}
);

// cleans up the tokens that are no longer valid.
function cleanupTokens(response, tokens) {
  const tokensDelete = [];
  response.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error('Failure sending Notification to ', tokens[index], error);
      if (error.code === 'messaging/invalid-registration-tokens' ||
        error.code === 'messaging/registration-token-not-registered') {
        const deleteTask = admin.firestore().collection('fcmTokens').doc(tokens[index]).delete();
        tokensDelete.push(deleteTask);
      }
    }
  });
  return Promise.all(tokensDelete);
}
