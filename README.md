# Portale Cloud Functions
 FCM notification functions
```
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
```