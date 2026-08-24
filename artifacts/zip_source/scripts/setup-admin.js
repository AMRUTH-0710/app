#!/usr/bin/env node

/**
 * ============================================================================
 * ONE-TIME FIREBASE ADMIN SETUP SCRIPT
 * ============================================================================
 * 
 * This script creates or updates a single designated Admin user in Firebase Auth
 * and attaches the custom claim `{ admin: true }`.
 * 
 * SECURITY DIRECTIVE:
 * - Admin privileges CANNOT be assigned or granted through client-side code.
 * - This script must be executed server-side via the Node.js Firebase Admin SDK.
 * 
 * HOW TO RUN:
 * ----------------------------------------------------------------------------
 * 1. Place your Firebase Service Account JSON key in the project root:
 *    ./serviceAccountKey.json
 *    OR set the environment variable:
 *    export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
 * 
 * 2. Run the script with the desired admin email and password:
 *    node scripts/setup-admin.js admin@frenzy.edu frenzy2024
 *    OR
 *    npm run setup-admin -- admin@frenzy.edu frenzy2024
 * 
 * 3. Once run, only this account will receive { admin: true } in its ID token,
 *    granting exclusive access to the Admin Whitelist Portal and Gate Scanner.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import admin from 'firebase-admin';

// Helper to prompt for CLI input if arguments were not provided
function promptInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function initializeFirebaseAdmin() {
  // If already initialized, return instance
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // 1. Check for ./serviceAccountKey.json in root
  const defaultKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS 
    ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : null;

  let serviceAccount = null;

  if (envKeyPath && fs.existsSync(envKeyPath)) {
    console.log(`🔑 Loading Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS: ${envKeyPath}`);
    serviceAccount = JSON.parse(fs.readFileSync(envKeyPath, 'utf8'));
  } else if (fs.existsSync(defaultKeyPath)) {
    console.log(`🔑 Loading Firebase credentials from: ${defaultKeyPath}`);
    serviceAccount = JSON.parse(fs.readFileSync(defaultKeyPath, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log(`🔑 Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT_KEY env variable`);
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }

  // Fallback to default application credentials if running in GCP environment
  console.log(`ℹ️  No local serviceAccountKey.json found. Attempting Application Default Credentials...`);
  try {
    return admin.initializeApp();
  } catch (err) {
    console.error('\n❌ ERROR: Firebase credentials not found!');
    console.error('----------------------------------------------------------------------');
    console.error('Please download your Firebase Service Account Key from:');
    console.error('  Firebase Console > Project Settings > Service accounts > Generate new private key');
    console.error('And save it as:');
    console.error(`  ${defaultKeyPath}`);
    console.error('----------------------------------------------------------------------\n');
    throw err;
  }
}

async function main() {
  console.log('======================================================================');
  console.log('⚡ FRESHER FRENZY — FIREBASE ADMIN ACCESS CONTROL INITIALIZER');
  console.log('======================================================================\n');

  let email = process.argv[2] || process.env.ADMIN_EMAIL;
  let password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!email) {
    email = await promptInput('Enter Admin Email Address (e.g. admin@frenzy.edu): ');
  }

  if (!email) {
    console.error('❌ Error: Email address is required.');
    process.exit(1);
  }

  if (!password) {
    password = await promptInput('Enter Admin Password (min 6 characters): ');
  }

  if (!password || password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    await initializeFirebaseAdmin();
    console.log('✅ Connected to Firebase Admin SDK.\n');

    let userRecord;
    let isNewUser = false;

    try {
      // Check if user already exists
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`🔍 Found existing user with email: ${email} (UID: ${userRecord.uid})`);
      
      // Update password if specified
      if (password) {
        await admin.auth().updateUser(userRecord.uid, {
          password: password,
          emailVerified: true
        });
        console.log(`🔄 Updated password for existing user.`);
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create new user
        console.log(`✨ Creating new Admin user: ${email}...`);
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          emailVerified: true,
          displayName: 'Fresher Frenzy Event Admin'
        });
        isNewUser = true;
        console.log(`✅ Created user with UID: ${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    // Assign custom claim { admin: true }
    console.log(`🛡️  Setting custom claim { admin: true } on user ${userRecord.uid}...`);
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true
    });

    // Verify claims
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('\n======================================================================');
    console.log('🎉 SUCCESS: DESIGNATED ADMIN ACCOUNT CONFIGURED!');
    console.log('======================================================================');
    console.log(`  UID:           ${updatedUser.uid}`);
    console.log(`  Email:         ${updatedUser.email}`);
    console.log(`  Custom Claims: ${JSON.stringify(updatedUser.customClaims, null, 2)}`);
    console.log('======================================================================\n');
    console.log('📌 IMPORTANT NEXT STEPS:');
    console.log('1. Log in via the app with these credentials.');
    console.log('2. The client application inspects the token custom claim `admin: true`.');
    console.log('3. Access to /admin and /gate-scanner is now restricted exclusively to this account.');
    console.log('4. Standard users without `{ admin: true }` will be rejected by Firestore Security Rules.');
    console.log('======================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Admin setup failed:', err.message);
    process.exit(1);
  }
}

main();
