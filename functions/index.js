'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/**
* Triggers when a user sends a new message and sends a notification.
* Sender add a flag to `messages/{messageId}`.
* Users save their device notification tokens to `/groups/{groupId}/members/{membersId}/deviceTokens`.
*/

exports.sendChatNotification = functions.database.ref('messages/{messageId}').onWrite(
    async (change,context) =>{
        const senderUid = context.params.senderUid;
        const groupUid = context.params.groupUid;
        const snapshot = change.after;


        // Get the list of device notification tokens.
        const getDeviceTokensPromise = admin.database()
            .ref(`/groups/${groupUid}/members/{membersId}/deviceTokens`).once('value');

        // Get the sender profile.
        const getSenderProfilePromise = admin.auth().getUser(senderUid);
        const getGroupPromise = admin.database()
            .ref(`/groups/${groupUid}`).once('value');

        // The snapshot to the group members tokens.
        let tokensSnapshot;

        // The array containing all the group members tokens.
        let tokens;

        const results = await Promise.all([getDeviceTokensPromise, getSenderProfilePromise, getGroupPromise]);
        tokensSnapshot = results[0];
        const sender = results[1];
        const group = results[2];

        // Check if there are any device tokens.
        if (!tokensSnapshot.hasChildren()) {
            return console.log('There are no notification tokens to send to.');
        }
        console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
        console.log('Fetched Senders profile', sender);

        // Notification details.
            const payload = {
                data: {
                    title: group.name,
                    image: group.photoURL,
                    type: 'group_chat',
                    group_id: group.groupId,
                    body: message,
                    sender: sender.uid,
                    sender_name: sender.name,
                    sender_image: sender.photoURL
                }
            };

        // Listing all tokens as an array.
        tokens = Object.keys(tokensSnapshot.val());
        // Send notifications to all tokens.
        const response = await admin.messaging().sendToTopic(groupUid,payload);


        // For each message check if there was an error.
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                }
            }else
            {
                console.log('Notification sent successfully:',response);
            }
        });
        return Promise.all(tokensToRemove);
    });

