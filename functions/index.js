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
  response.resultsvar obj = {dev: '/dev.json', test: '/test.json', prod: '/prod.json'};
  var configs = {};
  async.forEachOf(obj, function (value, key, callback) {
    fs.readFile(__dirname + value, 'utf8', function (err, data) {
      if (err) return callback(err);
      try {
        configs[key] = JSON.parse(data);
      } catch (e) {
        return callback(e);
    }
    callback();
    });
  }, function (err) {
    if (err) console.error(err.message);
    // configs is now a map of JSON data
    doSomethingWith(configs);
  });
}
