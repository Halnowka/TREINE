// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYcHeqRVQI-C8gTxkBzjJCA681LVylEDA",
  authDomain: "calistenia-98d6b.firebaseapp.com",
  projectId: "calistenia-98d6b",
  storageBucket: "calistenia-98d6b.firebasestorage.app",
  messagingSenderId: "896374149513",
  appId: "1:896374149513:web:d77ced259231bf0b019158",
  measurementId: "G-0HZ3YCX05N"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app); // Analytics can be initialized if needed
const db = getFirestore(app);

export { app, db };
