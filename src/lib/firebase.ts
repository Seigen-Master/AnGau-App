// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADTROil5PYK81WZS_hYD_yVTD2FH2RrLQ",
  authDomain: "angau-app.firebaseapp.com",
  projectId: "angau-app",
  storageBucket: "angau-app.firebasestorage.app",
  messagingSenderId: "419631690334",
  appId: "1:419631690334:web:0783019c454b294e77bacf"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// Initialize and export Firestore
export const db = getFirestore(app);
// Initialize and export Auth
export const auth = getAuth(app);
// Initialize and export Functions, explicitly setting the region
export const functions = getFunctions(app, 'us-central1');
// Initialize and export Storage
export const storage = getStorage(app);
