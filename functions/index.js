'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/**
 * Triggers when a user sends a new message and sends a notification.
 * Sender add a flag to `messages/{messageId}`.
 * Users save their device notification tokens to `/groups/{groupId}/members/{membersId}/deviceTokens`.
 */
exports.sendChatNotification = functions.database.ref('/group/{groupId}/lastMessage').onWrite(
    async (change,context) =>{
        const afterData = change.after.val(); // data after the write
        const senderId = afterData.sender_id;
        const groupId = context.params.groupId;
        const message = afterData.message;
        console.log("*****************Group************:", message);

        // Get the group details.
        // Get a reference to the /users/userId node
        const group = await admin.database().ref(`users/${senderId}`).once("value");
        const group_name = await group.child("name").val();
        const group_image = await group.child("image_url").val();
        const group_type = await group.child("group").val();

        if (true === group_type){
            var chat_type = "group_chat"
        }else {
            chat_type = "one_on_one_chat"
        }

        console.log('Notification Type >', chat_type);
        console.log("*****************Group************:", group.toJSON());

        // Get the sender profile.
        // Get a reference to the /users/userId node
        const sender = await admin.database().ref(`users/${senderId}`).once("value");
        const sender_name = await sender.child("name").val();
        const sender_image = await sender.child("image_url").val();

        console.log("*****************User************:", sender.toJSON());

        // Notification details.

        const payload = {
            data : {
                sender : senderId || 'Anonymous',
                type:   chat_type || 'Undefined',
                sender_name : sender_name || 'Anonymous',
                sender_image : sender_image || 'https://firebasestorage.googleapis.com/v0/b/sfn-backend-220407.appspot.com/o/skateboards%2Fimages%2F531%20_20190222130000.jpg?alt=media&token=5542460d-3009-47c2-b298-044f89947cf0',
                image : group_image || 'https://firebasestorage.googleapis.com/v0/b/sfn-backend-220407.appspot.com/o/skateboards%2Fimages%2F531%20_20190222130000.jpg?alt=media&token=5542460d-3009-47c2-b298-044f89947cf0g' ,
                body : message,
                group_name:group_name,
                group_id : groupId
            }
        };

        //Create an options object that contains the time to live for the notification and the priority
        const options = {
            priority: "high",
            timeToLive: 60 * 60 * 24
        };

        // Send notifications to all tokens.
        return await admin.messaging().sendToTopic("/topics/" + groupId,payload,options)
            // eslint-disable-next-line promise/always-return
            .then(response => {
                console.log("Successfully sent message:", response);
            })
            .catch(error => {
                console.log("Error sending message:", error);
            });

    });
