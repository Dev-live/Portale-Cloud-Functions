// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');


exports.sendNotification = functions.database.ref('/messages/{userId}/{messageId}').onWrite(event => {
    //get the userId of the person receiving the notification because we need to get their token
    const receiverId = event.params.userId;
    console.log("receiverId: ", receiverId);

    //get the user id of the person who sent the message
    const senderId = event.data.child('user_id').val();
    console.log("senderId: ", senderId);

    //get the message
    const message = event.data.child('message').val();
    console.log("message: ", message);

    //get the message id. We'll be sending this in the payload
    const messageId = event.params.messageId;
    console.log("messageId: ", messageId);

    //get the message id. We'll be sending this in the payload
    const image = event.params.imageUrl;
    console.log("imageUrl: ", image);

    //query the users node and get the name of the user who sent the message
    return admin.database().ref("/users/" + senderId).once('value').then(snap => {
        const senderName = snap.child("name").val();
        console.log("senderName: ", senderName);

        //get the token of the user receiving the message
        return admin.database().ref("/users/" + receiverId).once('value').then(snap => {
            const token = snap.child("messaging_token").val();
            console.log("token: ", token);

            //we have everything we need
            //Build the message payload and send the message
            console.log("Construction the notification message.");
            const payload = {
                data: {
                    data_type: "direct_message",
                    title: "New Message from " + senderName,
                    message: message,
                    message_id: messageId,
                    image: image,
                }
            };

            let promise =  admin.messaging().sendToDevice(token, payload)

                promise.then(function(response) {
                    console.log("Successfully sent message:", response);
                })
                .catch(function(error) {
                    console.log("Error sending message:", error);
                });
            promise.then(r => cleanupTokens(r,token));
            return promise
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
