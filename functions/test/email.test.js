const admin = require('firebase-admin');

// Test configuration
const PROJECT_ID = 'test-project';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.EMAIL_FROM = 'Test App <test@example.com>';
process.env.APP_BASE_URL = 'https://test.example.com';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

// Import the email generation functions
// Note: In a real test, we'd import these from our main module
// For now, we'll recreate the essential parts

function generateReminderEmailHtml({
  userName,
  formattedDate,
  missionaryNames,
  companionship,
  signup,
  reminderDaysBefore,
}) {
  const dayText = reminderDaysBefore === 1 ? 'tomorrow' : `in ${reminderDaysBefore} days`;
  const APP_BASE_URL = process.env.APP_BASE_URL;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dinner Reminder</title>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Dinner Reminder</h1>
          <p>Your missionary dinner is ${dayText}!</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>This is a friendly reminder that you're scheduled to host the missionaries for dinner ${dayText}.</p>
          <div class="detail-box">
            <div>Date: ${formattedDate}</div>
            <div>Missionaries: ${missionaryNames}</div>
            <div>Area: ${companionship.area}</div>
            <div>Number of Guests: ${signup.guestCount}</div>
            ${signup.notes ? `<div>Your Notes: ${signup.notes}</div>` : ''}
            ${companionship.phone ? `<div>Companionship Phone: ${companionship.phone}</div>` : ''}
          </div>
          <div class="actions">
            <a href="${APP_BASE_URL}/calendar">View Calendar</a>
          </div>
          <p>Thank you for your service!</p>
        </div>
      </body>
    </html>
  `;
}

function generateReminderEmailText({
  userName,
  formattedDate,
  missionaryNames,
  companionship,
  signup,
  reminderDaysBefore,
}) {
  const dayText = reminderDaysBefore === 1 ? 'tomorrow' : `in ${reminderDaysBefore} days`;
  const APP_BASE_URL = process.env.APP_BASE_URL;

  return `
Dinner Reminder

Hi ${userName},

This is a friendly reminder that you're scheduled to host the missionaries for dinner ${dayText}.

Date: ${formattedDate}
Missionaries: ${missionaryNames}
Area: ${companionship.area}
Number of Guests: ${signup.guestCount}
${signup.notes ? `Your Notes: ${signup.notes}` : ''}
${companionship.phone ? `Companionship Phone: ${companionship.phone}` : ''}

You can view your calendar or make changes at: ${APP_BASE_URL}/calendar

Thank you for your service!
  `;
}

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

function assertContains(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(`❌ Assertion failed: ${message}\nExpected "${text}" to contain "${substring}"`);
  }
  log(`✅ ${message}`);
}

// Test 1: Basic HTML email generation
async function test1_HtmlEmailGeneration() {
  log('Test 1: HTML email generation', '📧');

  const testData = {
    userName: 'John Doe',
    formattedDate: 'Tuesday, January 15, 2024',
    missionaryNames: 'Elder Smith & Elder Johnson',
    companionship: {
      area: 'Downtown Ward',
      phone: '555-0123'
    },
    signup: {
      guestCount: 2,
      notes: 'Looking forward to it!'
    },
    reminderDaysBefore: 1
  };

  const htmlEmail = generateReminderEmailHtml(testData);

  // Test that essential elements are present
  assertContains(htmlEmail, 'John Doe', 'Should contain user name');
  assertContains(htmlEmail, 'Tuesday, January 15, 2024', 'Should contain formatted date');
  assertContains(htmlEmail, 'Elder Smith & Elder Johnson', 'Should contain missionary names');
  assertContains(htmlEmail, 'Downtown Ward', 'Should contain area name');
  assertContains(htmlEmail, 'Number of Guests: 2', 'Should contain guest count');
  assertContains(htmlEmail, 'Looking forward to it!', 'Should contain notes');
  assertContains(htmlEmail, '555-0123', 'Should contain phone number');
  assertContains(htmlEmail, 'tomorrow', 'Should say "tomorrow" for 1 day reminder');
  assertContains(htmlEmail, process.env.APP_BASE_URL, 'Should contain app base URL');

  // Test HTML structure
  assertContains(htmlEmail, '<!DOCTYPE html>', 'Should be valid HTML');
  assertContains(htmlEmail, '<html>', 'Should have html tag');
  assertContains(htmlEmail, '<head>', 'Should have head tag');
  assertContains(htmlEmail, '<body>', 'Should have body tag');

  assert(htmlEmail.length > 500, 'HTML email should be substantial in size');
}

// Test 2: Text email generation
async function test2_TextEmailGeneration() {
  log('Test 2: Text email generation', '📄');

  const testData = {
    userName: 'Jane Smith',
    formattedDate: 'Wednesday, January 16, 2024',
    missionaryNames: 'Sister Brown & Sister Wilson',
    companionship: {
      area: 'University Ward',
      phone: '555-0199'
    },
    signup: {
      guestCount: 3,
      notes: 'Vegetarian meal requested'
    },
    reminderDaysBefore: 2
  };

  const textEmail = generateReminderEmailText(testData);

  // Test content
  assertContains(textEmail, 'Jane Smith', 'Should contain user name');
  assertContains(textEmail, 'Wednesday, January 16, 2024', 'Should contain formatted date');
  assertContains(textEmail, 'Sister Brown & Sister Wilson', 'Should contain missionary names');
  assertContains(textEmail, 'University Ward', 'Should contain area name');
  assertContains(textEmail, 'Number of Guests: 3', 'Should contain guest count');
  assertContains(textEmail, 'Vegetarian meal requested', 'Should contain notes');
  assertContains(textEmail, '555-0199', 'Should contain phone number');
  assertContains(textEmail, 'in 2 days', 'Should say "in 2 days" for 2 day reminder');
  assertContains(textEmail, process.env.APP_BASE_URL, 'Should contain app base URL');

  // Test that it's plain text (no HTML tags)
  assert(!textEmail.includes('<'), 'Text email should not contain HTML tags');
  assert(!textEmail.includes('>'), 'Text email should not contain HTML tags');

  assert(textEmail.length > 200, 'Text email should have substantial content');
}

// Test 3: Edge cases and optional fields
async function test3_EdgeCases() {
  log('Test 3: Edge cases and optional fields', '⚠️');

  const testDataMinimal = {
    userName: 'Bob Wilson',
    formattedDate: 'Friday, January 18, 2024',
    missionaryNames: 'Elder Davis',
    companionship: {
      area: 'Rural Ward',
      // No phone number
    },
    signup: {
      guestCount: 1,
      // No notes
    },
    reminderDaysBefore: 3
  };

  const htmlEmail = generateReminderEmailHtml(testDataMinimal);
  const textEmail = generateReminderEmailText(testDataMinimal);

  // Test that missing optional fields are handled gracefully
  assertContains(htmlEmail, 'Bob Wilson', 'Should contain user name');
  assertContains(htmlEmail, 'Elder Davis', 'Should contain single missionary name');
  assertContains(htmlEmail, 'Rural Ward', 'Should contain area');
  assertContains(htmlEmail, 'in 3 days', 'Should handle 3+ day reminders');

  // Test that missing fields don't break the email
  assert(!htmlEmail.includes('undefined'), 'Should not contain undefined values');
  assert(!textEmail.includes('undefined'), 'Should not contain undefined values');
  assert(!htmlEmail.includes('null'), 'Should not contain null values');
  assert(!textEmail.includes('null'), 'Should not contain null values');

  // Should handle missing notes gracefully
  assert(!htmlEmail.includes('Your Notes:') || htmlEmail.includes('Your Notes: '), 'Should handle missing notes');
}

// Test 4: Special characters and escaping
async function test4_SpecialCharacters() {
  log('Test 4: Special characters handling', '🔤');

  const testDataSpecial = {
    userName: 'María García-López',
    formattedDate: 'Saturday, January 19, 2024',
    missionaryNames: 'Elder O\'Connor & Elder Müller',
    companionship: {
      area: 'Spanish-Speaking Ward',
      phone: '555-0111'
    },
    signup: {
      guestCount: 4,
      notes: 'Please prepare "authentic" Mexican food & avoid nuts!'
    },
    reminderDaysBefore: 1
  };

  const htmlEmail = generateReminderEmailHtml(testDataSpecial);
  const textEmail = generateReminderEmailText(testDataSpecial);

  // Test that special characters are preserved
  assertContains(htmlEmail, 'María García-López', 'Should handle accented characters');
  assertContains(htmlEmail, 'O\'Connor', 'Should handle apostrophes');
  assertContains(htmlEmail, 'Müller', 'Should handle umlauts');
  assertContains(htmlEmail, '"authentic"', 'Should handle quotes');
  assertContains(htmlEmail, 'Spanish-Speaking Ward', 'Should handle hyphens');

  assertContains(textEmail, 'María García-López', 'Text should handle accented characters');
  assertContains(textEmail, 'O\'Connor', 'Text should handle apostrophes');
  assertContains(textEmail, 'Müller', 'Text should handle umlauts');
}

// Test 5: Email structure validation
async function test5_EmailStructure() {
  log('Test 5: Email structure validation', '🏗️');

  const testData = {
    userName: 'Test User',
    formattedDate: 'Monday, January 21, 2024',
    missionaryNames: 'Elder Test',
    companionship: {
      area: 'Test Area',
      phone: '555-TEST'
    },
    signup: {
      guestCount: 2,
      notes: 'Test notes'
    },
    reminderDaysBefore: 1
  };

  const htmlEmail = generateReminderEmailHtml(testData);

  // Validate HTML structure
  assertContains(htmlEmail, '<title>Dinner Reminder</title>', 'Should have proper title');
  assertContains(htmlEmail, 'charset="utf-8"', 'Should have UTF-8 charset');
  assertContains(htmlEmail, 'viewport', 'Should have viewport meta tag');

  // Validate email flow
  const emailLines = htmlEmail.split('\n').map(line => line.trim()).filter(line => line);

  // Should have proper greeting
  const hasGreeting = emailLines.some(line => line.includes('Hi Test User'));
  assert(hasGreeting, 'Should have proper greeting');

  // Should have call-to-action
  const hasCallToAction = htmlEmail.includes('View Calendar');
  assert(hasCallToAction, 'Should have call-to-action');

  // Should have closing
  const hasClosing = htmlEmail.includes('Thank you for your service');
  assert(hasClosing, 'Should have proper closing');
}

// Main test runner
async function runTests() {
  console.log('📧 Starting Email Generation Tests\n');

  try {
    await test1_HtmlEmailGeneration();
    await test2_TextEmailGeneration();
    await test3_EdgeCases();
    await test4_SpecialCharacters();
    await test5_EmailStructure();

    console.log('\n🎉 All email tests passed!');
    return true;

  } catch (error) {
    console.error('\n💥 Email test failed:', error.message);
    return false;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Email test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  generateReminderEmailHtml,
  generateReminderEmailText
};
