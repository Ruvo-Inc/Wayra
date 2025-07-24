import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Debug environment variables first
if (typeof window !== 'undefined') {
  console.log('Environment Variables Debug:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'Missing',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Present' : 'Missing',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Present' : 'Missing',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Present' : 'Missing',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Present' : 'Missing',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Present' : 'Missing',
  });
}

// Get Firebase config from environment variables with fallback
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBrDfhnV4pvOASU7Ek84qoctCsSjPyckAo',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wayra-22.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wayra-22',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'wayra-22.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '424430120938',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:424430120938:web:857e781488789a30aa8c93',
};

// Debug Firebase configuration
if (typeof window !== 'undefined') {
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? 'Present' : 'Missing',
    authDomain: firebaseConfig.authDomain ? 'Present' : 'Missing',
    projectId: firebaseConfig.projectId ? 'Present' : 'Missing',
    storageBucket: firebaseConfig.storageBucket ? 'Present' : 'Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Present' : 'Missing',
    appId: firebaseConfig.appId ? 'Present' : 'Missing',
  });
  console.log('Firebase Config Values:', firebaseConfig);
}

// Check if Firebase is properly configured
const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
console.log('Firebase Configuration Status:', isConfigured);

// Firebase config is already defined above

// Initialize Firebase only if not already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication and get a reference to the service
// Only initialize if Firebase config is available
export const auth = isConfigured ? getAuth(app) : null;

// Initialize Cloud Firestore and get a reference to the service
export const db = isConfigured ? getFirestore(app) : null;

// Export config availability for components to check
export const isFirebaseConfigured = isConfigured;

export default app;
