// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Function to get Firebase configuration
const getFirebaseConfig = () => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Validate required environment variables
  if (!config.apiKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY\n' +
      'Please check your .env.local file and ensure all Firebase configuration variables are set.\n' +
      'Copy .env.example to .env.local and fill in your Firebase project credentials.'
    );
  }
  if (!config.authDomain) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
      'Please check your .env.local file and ensure all Firebase configuration variables are set.\n' +
      'Copy .env.example to .env.local and fill in your Firebase project credentials.'
    );
  }
  if (!config.projectId) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID\n' +
      'Please check your .env.local file and ensure all Firebase configuration variables are set.\n' +
      'Copy .env.example to .env.local and fill in your Firebase project credentials.'
    );
  }

  return config;
};

// Initialize Firebase - for static exports, env vars are available at runtime
const config = getFirebaseConfig();
const app = !getApps().length ? initializeApp(config) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
