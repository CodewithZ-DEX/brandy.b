// Firebase Web SDK (v11.6.0) via official Google CDN ESM
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/**
 * Paste your Firebase Web App configuration from:
 * Firebase Console -> Project Settings -> Your Apps -> Web App
 */
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const ADMIN_EMAIL = "creativepawan89@gmail.com";

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  !firebaseConfig.apiKey.startsWith("YOUR_") &&
  !firebaseConfig.projectId.startsWith("YOUR_");

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
