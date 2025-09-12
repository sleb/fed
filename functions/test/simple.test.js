const admin = require('firebase-admin');

// Test configuration
const PROJECT_ID = 'test-project';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.EMAIL_FROM = 'Test App <test@example.com>';
process.env.APP_BASE_URL = 'https://test.example.com';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: PROJECT_ID,
});

const db = admin.firestore();

// Test utilities
function log(message, emoji = '🔍') {
  console.log(`${emoji} ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  log(`✅ ${message}`);
}

// Clear all test data
async function clearData() {
  const collections = ['users', 'signups', 'companionships', 'sentReminders'];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    if (!snapshot.empty) {
      await batch.commit();
    }
  }
}

// Core reminder finding logic (extracted from our function)
async function findSignupsNeedingReminders() {
  const today = new Date();

  // Get all signups with future dinner dates
  const signupsQuery = await db
    .collection('signups')
    .where('dinnerDate', '>', admin.firestore.Timestamp.fromDate(today))
    .get();

  const remindersToSend = [];

  for (const signupDoc of signupsQuery.docs) {
    const signup = { id: signupDoc.id, ...signupDoc.data() };

    // Get user preferences
    const userDoc = await db.collection('users').doc(signup.userId).get();
    if (!userDoc.exists) continue;

    const userData = userDoc.data();
    if (!userData?.preferences?.signupReminders) continue;

    // Calculate reminder date
    const dinnerDate = signup.dinnerDate.toDate();
    const reminderDaysBefore = userData.preferences.reminderDaysBefore || 1;
    const reminderDate = new Date(dinnerDate);
    reminderDate.setDate(dinnerDate.getDate() - reminderDaysBefore);

    // Check if reminder should be sent today
    const isReminderDay = reminderDate.toDateString() === today.toDateString();
    if (!isReminderDay) continue;

    // Check if we already sent a reminder for this signup
    const existingReminderQuery = await db
      .collection('sentReminders')
      .where('signupId', '==', signup.id)
      .where('reminderType', '==', 'signup_reminder')
      .limit(1)
      .get();

    if (!existingReminderQuery.empty) continue;

    remindersToSend.push({
      signup,
      user: userData,
      reminderDaysBefore,
    });
  }

  return remindersToSend;
}

// Test 1: Basic reminder detection
async function test1_BasicReminderDetection() {
  log('Test 1: Basic reminder detection', '🧪');

  // Create test user with reminders enabled
  const userRef = await db.collection('users').add({
    name: 'John Doe',
    email: 'john@test.com',
    preferences: {
      signupReminders: true,
      reminderDaysBefore: 1,
    },
  });

  // Create signup for tomorrow (should need reminder today)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const signupRef = await db.collection('signups').add({
    userId: userRef.id,
    userName: 'John Doe',
    userEmail: 'john@test.com',
    companionshipId: 'test-companionship',
    dinnerDate: admin.firestore.Timestamp.fromDate(tomorrow),
    guestCount: 2,
    status: 'confirmed',
  });

  // Test the logic
  const reminders = await findSignupsNeedingReminders();

  assert(reminders.length === 1, 'Should find 1 reminder to send');
  assert(reminders[0].signup.id === signupRef.id, 'Should find the correct signup');
  assert(reminders[0].user.name === 'John Doe', 'Should include user data');
}

// Test 2: User preference handling
async function test2_UserPreferences() {
  log('Test 2: User preference handling', '🧪');

  // User with reminders disabled
  const user1Ref = await db.collection('users').add({
    name: 'User No Reminders',
    preferences: { signupReminders: false, reminderDaysBefore: 1 },
  });

  // User with reminders enabled
  const user2Ref = await db.collection('users').add({
    name: 'User With Reminders',
    preferences: { signupReminders: true, reminderDaysBefore: 1 },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create signups for both users
  await db.collection('signups').add({
    userId: user1Ref.id,
    userName: 'User No Reminders',
    userEmail: 'user1@test.com',
    companionshipId: 'test',
    dinnerDate: admin.firestore.Timestamp.fromDate(tomorrow),
    guestCount: 2,
    status: 'confirmed',
  });

  await db.collection('signups').add({
    userId: user2Ref.id,
    userName: 'User With Reminders',
    userEmail: 'user2@test.com',
    companionshipId: 'test',
    dinnerDate: admin.firestore.Timestamp.fromDate(tomorrow),
    guestCount: 2,
    status: 'confirmed',
  });

  const reminders = await findSignupsNeedingReminders();

  assert(reminders.length === 1, 'Should only find reminder for user with reminders enabled');
  assert(reminders[0].user.name === 'User With Reminders', 'Should be the user with reminders enabled');
}

// Test 3: Custom timing
async function test3_CustomTiming() {
  log('Test 3: Custom timing (2 days before)', '🧪');

  const userRef = await db.collection('users').add({
    name: 'Early Reminder User',
    preferences: {
      signupReminders: true,
      reminderDaysBefore: 2, // 2 days advance notice
    },
  });

  // Create signup for 2 days from now
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  await db.collection('signups').add({
    userId: userRef.id,
    userName: 'Early Reminder User',
    userEmail: 'early@test.com',
    companionshipId: 'test',
    dinnerDate: admin.firestore.Timestamp.fromDate(twoDaysFromNow),
    guestCount: 2,
    status: 'confirmed',
  });

  const reminders = await findSignupsNeedingReminders();

  assert(reminders.length === 1, 'Should find reminder for 2-day advance notice');
  assert(reminders[0].reminderDaysBefore === 2, 'Should have correct reminder timing');
}

// Test 4: Duplicate prevention
async function test4_DuplicatePrevention() {
  log('Test 4: Duplicate prevention', '🧪');

  const userRef = await db.collection('users').add({
    name: 'Duplicate Test User',
    preferences: { signupReminders: true, reminderDaysBefore: 1 },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const signupRef = await db.collection('signups').add({
    userId: userRef.id,
    userName: 'Duplicate Test User',
    userEmail: 'duplicate@test.com',
    companionshipId: 'test',
    dinnerDate: admin.firestore.Timestamp.fromDate(tomorrow),
    guestCount: 2,
    status: 'confirmed',
  });

  // First call should find the reminder
  let reminders = await findSignupsNeedingReminders();
  assert(reminders.length === 1, 'Should find reminder on first call');

  // Create a "sent reminder" record
  await db.collection('sentReminders').add({
    signupId: signupRef.id,
    userId: userRef.id,
    reminderType: 'signup_reminder',
    sentAt: admin.firestore.Timestamp.now(),
    emailStatus: 'sent',
  });

  // Second call should not find any reminders
  reminders = await findSignupsNeedingReminders();
  assert(reminders.length === 0, 'Should not find reminder after it has been sent');
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Simple Reminder Tests\n');

  try {
    await clearData();
    log('Cleared test data', '🧹');

    await test1_BasicReminderDetection();
    await clearData();

    await test2_UserPreferences();
    await clearData();

    await test3_CustomTiming();
    await clearData();

    await test4_DuplicatePrevention();
    await clearData();

    console.log('\n🎉 All tests passed!');
    return true;

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    return false;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, findSignupsNeedingReminders };
