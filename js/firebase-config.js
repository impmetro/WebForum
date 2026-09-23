/**
 * Firebase configuration
 *
 * 1. Go to https://console.firebase.google.com/
 * 2. Create / select a project
 * 3. Enable Authentication → Email/Password
 * 4. Create a Cloud Firestore database
 * 5. Project Settings → Your apps → Add web app
 * 6. Paste your config object below
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
