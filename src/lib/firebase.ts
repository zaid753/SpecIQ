/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDo1pwLLdjuxqvK28z7HdiekjpG2qu8tFw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "speclq.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "speclq",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "speclq.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "498463441244",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:498463441244:web:f419c9e2e6082022780199",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FLEV5CBPEH",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://speclq-default-rtdb.firebaseio.com",
};

// Validate config
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value && key !== 'measurementId' && key !== 'databaseURL') {
    console.warn(`Firebase config missing: ${key}. Check your .env file.`);
  }
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Analytics is only supported in certain environments (browser)
let analyticsInstance: any = null;
isSupported().then(yes => {
  if (yes) analyticsInstance = getAnalytics(app);
});

export const analytics = () => analyticsInstance;
