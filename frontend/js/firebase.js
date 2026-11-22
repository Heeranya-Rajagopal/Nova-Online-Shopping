import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDsgHfdlSfQ2MiErkK-EvFnZ87D4ycaeok",
    authDomain: "nova-online-shopping.firebaseapp.com",
    projectId: "nova-online-shopping",
    storageBucket: "nova-online-shopping.firebasestorage.app",
    messagingSenderId: "139282195966",
    appId: "1:139282195966:web:73e3e8338b88237e148caf",
    measurementId: "G-89C48X2F5C"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("NOVA connected to Firebase!");