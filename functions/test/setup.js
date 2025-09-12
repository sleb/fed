const admin = require('firebase-admin');

// Test project configuration
const PROJECT_ID = 'test-project';
const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

// Initialize Firebase Admin for testing
function initializeTestEnvironment() {
  // Set emulator environment variables
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
  process.env.FUNCTIONS_EMULATOR = 'true';
  process.env.EMAIL_FROM = 'Test App <test@example.com>';
  process.env.APP_BASE_URL = 'https://test.example.com';

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }

  return admin.firestore();
}

// Clear all test data
async function clearTestData(db) {
  const collections = ['users', 'signups', 'companionships', 'missionaries', 'sentReminders', 'adminNotifications'];

  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }
}

// Create test user
async function createTestUser(db, overrides = {}) {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-0123',
    role: 'member',
    onboardingCompleted: true,
    preferences: {
      emailNotifications: true,
      signupReminders: true,
      appointmentReminders: true,
      changeNotifications: true,
      reminderDaysBefore: 1,
    },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    ...overrides,
  };

  const userRef = await db.collection('users').add(userData);
  return { id: userRef.id, ...userData };
}

// Create test missionary
async function createTestMissionary(db, overrides = {}) {
  const missionaryData = {
    name: 'Elder Smith',
    email: 'elder.smith@missionary.org',
    dinnerPreferences: ['No spicy food'],
    allergies: ['Nuts'],
    notes: 'Loves pasta',
    isActive: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    ...overrides,
  };

  const missionaryRef = await db.collection('missionaries').add(missionaryData);
  return { id: missionaryRef.id, ...missionaryData };
}

// Create test companionship
async function createTestCompanionship(db, missionaryIds = [], overrides = {}) {
  const companionshipData = {
    area: 'Test Ward Area',
    address: '123 Test Street',
    apartmentNumber: 'Apt 1',
    phone: '555-0199',
    missionaryIds: missionaryIds,
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    notes: 'Test companionship notes',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    ...overrides,
  };

  const companionshipRef = await db.collection('companionships').add(companionshipData);
  return { id: companionshipRef.id, ...companionshipData };
}

// Create test signup
async function createTestSignup(db, userId, companionshipId, dinnerDate, overrides = {}) {
  const signupData = {
    userId,
    userName: 'Test User',
    userEmail: 'test@example.com',
    userPhone: '555-0123',
    companionshipId,
    dinnerDate: admin.firestore.Timestamp.fromDate(dinnerDate),
    dayOfWeek: dinnerDate.toLocaleDateString('en-US', { weekday: 'long' }),
    guestCount: 2,
    status: 'confirmed',
    contactPreference: 'email',
    reminderSent: false,
    notes: 'Looking forward to dinner!',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    ...overrides,
  };

  const signupRef = await db.collection('signups').add(signupData);
  return { id: signupRef.id, ...signupData };
}

// Create sent reminder record
async function createSentReminder(db, signupId, userId, overrides = {}) {
  const reminderData = {
    signupId,
    userId,
    reminderType: 'signup_reminder',
    sentAt: admin.firestore.Timestamp.now(),
    emailStatus: 'sent',
    ...overrides,
  };

  const reminderRef = await db.collection('sentReminders').add(reminderData);
  return { id: reminderRef.id, ...reminderData };
}

// Helper to create a date N days from now
function createDateInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Helper to wait for a condition with timeout
async function waitFor(conditionFn, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// Test assertion helpers
function assertEquals(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertFalse(condition, message = '') {
  if (condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

module.exports = {
  PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  FUNCTIONS_EMULATOR_HOST,
  initializeTestEnvironment,
  clearTestData,
  createTestUser,
  createTestMissionary,
  createTestCompanionship,
  createTestSignup,
  createSentReminder,
  createDateInDays,
  waitFor,
  assertEquals,
  assertTrue,
  assertFalse,
};
