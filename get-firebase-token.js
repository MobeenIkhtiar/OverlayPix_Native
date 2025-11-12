// Run this script to get your Firebase token for Postman testing
// Usage: node get-firebase-token.js

const admin = require('firebase-admin');

// You'll need to add your Firebase service account key here
// Download it from Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Replace with your user's UID
const uid = 'YOUR_USER_UID_HERE';

admin.auth().createCustomToken(uid)
  .then((customToken) => {
    console.log('Custom Token:', customToken);
    console.log('\nUse this token in Postman Authorization header:');
    console.log(`Bearer ${customToken}`);
  })
  .catch((error) => {
    console.log('Error creating custom token:', error);
  });
