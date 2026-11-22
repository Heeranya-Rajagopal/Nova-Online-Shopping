
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

// Load the private Firebase service account
const serviceAccount = require(
    path.resolve(__dirname, "../../nova-private/serviceAccountKey.json")
);

// Initialize Firebase only once
const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount)
    });

// Connect to Firebase services
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

console.log("NOVA Firebase Admin connected successfully!");

module.exports = { db, auth, FieldValue };
