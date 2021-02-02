const firebase = require("firebase");
const admin = require("firebase-admin");
const config = require("./config");

const firebaseConnect = async () => {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(config);

    var serviceAccount = require("./firenet-3a33d-firebase-adminsdk-4fqas-ee7f7607be.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase initialised".cyan.bold);
  }
};

module.exports = firebaseConnect;
