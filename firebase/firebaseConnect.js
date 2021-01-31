const firebase = require("firebase");
const admin = require("firebase-admin");
const config = require("./config");

const firebaseConnect = async () => {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
    firebase.analytics();

    var serviceAccount = require("firebase-adminsdk-4fqas@firenet-3a33d.iam.gserviceaccount.com");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
};

module.exports = firebaseConnect;
