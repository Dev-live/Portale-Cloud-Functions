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
exports.sendNotification = functions.database
    .ref("/message/{userId}/{pushId}")
    .onWrite(event => {
      const snapshot = event.data;
      const userId = event.params.userId;
      if (snapshot.previous.val()) {
        return;
      }
      if (snapshot.val().name !== "ADMIN") {
        return;
      }
      const text = snapshot.val().text;
      const payload = {
        notification: {
          title: `New message by ${snapshot.val().name}`,
          body: text
            ? text.length <= 100 ? text : text.substring(0, 97) + "..."
            : ""
        }
      };
      return admin
        .database()
        .ref(`data/${userId}/customerData`)
        .once('value')
        .then(data => {
          console.log('inside', data.val().notificationKey);
          if (data.val().notificationKey) {
            return admin.messaging().sendToDevice(data.val().notificationKey, payload);
          }
        });
    });

exports.sendMessageNotification = functions.database.ref('conversations/{conversationID}/messages/{messageID}').onWrite(event => {
    if (event.data.previous.exists()) {
        return;
    }

    firebase.database().ref('messages').child(event.params.messageID).once('value').then(function(snap) {
        var messageData = snap.val();

        var topic = 'notifications_' + messageData.receiverKey;
        var payload = {
            notification: {
                title: "You got a new Message",
                body: messageData.content,
            }
        };

        admin.messaging().sendToTopic(topic, payload)
            .then(function(response) {
                console.log("Successfully sent message:", response);
            })
            .catch(function(error) {
                console.log("Error sending message:", error);
            });
    });
});

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
