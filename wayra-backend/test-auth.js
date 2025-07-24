// Test script to debug Firebase authentication issues
const admin = require('firebase-admin');

async function testFirebaseAuth() {
  console.log('🔥 Testing Firebase Admin SDK configuration...');
  
  try {
    // Check if Firebase Admin is initialized
    const app = admin.app();
    console.log('✅ Firebase Admin SDK is initialized');
    console.log('📋 Project ID:', app.options.projectId);
    
    // Test auth service
    const auth = admin.auth();
    console.log('✅ Firebase Auth service is available');
    
    // Try to get a user (this will fail but shows if auth is working)
    try {
      await auth.getUser('test-uid');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('✅ Firebase Auth is working (user-not-found is expected)');
      } else {
        console.log('❌ Firebase Auth error:', error.code, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase Admin SDK error:', error);
  }
}

// Run the test
testFirebaseAuth();
