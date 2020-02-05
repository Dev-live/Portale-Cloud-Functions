// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNewTripNotification = functions.database
  .ref("/{uid}/shared_trips/")
  .onWrite(event => {
    const uuid = event.params.uid;

    console.log("User to send notification", uuid);

    var ref = admin.database().ref(`Users/${uuid}/token`);
    return ref.once(
      "value",
      function(snapshot) {
        const payload = {
          notification: {
            title: "You have been invited to a trip.",
            body: "Tap here to check it out!"
          }
        };

        admin.messaging().sendToDevice(snapshot.val(), payload);
      },
      function(errorObject) {
        console.log("The read failed: " + errorObject.code);
      }
    );
  });
