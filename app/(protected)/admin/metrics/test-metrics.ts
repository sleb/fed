// Simple test script to validate metrics service
// Run with: npx ts-node test-metrics.ts (after setting up Firebase emulator)

import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Mock Firebase config for testing
const firebaseConfig = {
  projectId: 'demo-missionary-dinners',
  apiKey: 'demo-key',
  authDomain: 'demo-missionary-dinners.firebaseapp.com',
  storageBucket: 'demo-missionary-dinners.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
};

// Initialize Firebase with emulator
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator (make sure emulator is running)
if (process.env.NODE_ENV !== 'production') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulator connection failed or already connected:', error);
  }
}

// Mock the Firebase config module
jest.mock('@/lib/firebase/config', () => ({
  db: db
}));

// Test the metrics service
async function testMetrics() {
  console.log('🧪 Testing Admin Metrics Service...');

  try {
    // Import after mocking
    const { MetricsService } = await import('./lib/metricsService');

    console.log('📊 Calculating metrics...');
    const metrics = await MetricsService.calculateMetrics();

    console.log('✅ Metrics calculated successfully!');
    console.log('📈 Results:');
    console.log(`- Total Users: ${metrics.overview.totalActiveUsers}`);
    console.log(`- Total Missionaries: ${metrics.overview.totalActiveMissionaries}`);
    console.log(`- Total Companionships: ${metrics.overview.totalActiveCompanionships}`);
    console.log(`- Signups This Week: ${metrics.overview.signupsThisWeek}`);
    console.log(`- Participation Rate: ${metrics.overview.participationRate}%`);
    console.log(`- Companionships Stats: ${metrics.companionshipStats.length} entries`);
    console.log(`- Member Participation: ${metrics.memberParticipation.length} entries`);
    console.log(`- Signup Trends: ${metrics.signupTrends.length} weeks`);
    console.log(`- Timing Patterns: ${metrics.timingPatterns.length} buckets`);

    if (metrics.companionshipStats.length > 0) {
      console.log('\n🏠 Top Companionships by Meals This Week:');
      metrics.companionshipStats.slice(0, 3).forEach((comp, i) => {
        console.log(`  ${i + 1}. ${comp.companionshipArea}: ${comp.mealsThisWeek} meals`);
      });
    }

    if (metrics.memberParticipation.length > 0) {
      console.log('\n👥 Top Contributors:');
      metrics.memberParticipation.slice(0, 3).forEach((member, i) => {
        console.log(`  ${i + 1}. ${member.userName}: ${member.totalSignups} signups`);
      });
    }

    return metrics;

  } catch (error) {
    console.error('❌ Metrics test failed:', error);
    throw error;
  }
}

// Test formatting utilities
function testFormatters() {
  console.log('\n🔧 Testing Formatter Utilities...');

  const { MetricsService } = require('./lib/metricsService');

  // Test number formatting
  console.log('Number formatting:');
  console.log(`1234 -> ${MetricsService.formatNumber(1234)}`);
  console.log(`1234567 -> ${MetricsService.formatNumber(1234567)}`);
  console.log(`42 -> ${MetricsService.formatNumber(42)}`);

  // Test trend status
  console.log('\nTrend status:');
  console.log(`+15% -> ${JSON.stringify(MetricsService.getTrendStatus(15))}`);
  console.log(`-8% -> ${JSON.stringify(MetricsService.getTrendStatus(-8))}`);
  console.log(`0% -> ${JSON.stringify(MetricsService.getTrendStatus(0))}`);

  // Test date range formatting
  const start = new Date('2024-01-01');
  const end = new Date('2024-01-07');
  console.log(`Date range: ${MetricsService.formatDateRange(start, end)}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  async function runTests() {
    try {
      testFormatters();

      console.log('\n🚀 Starting metrics calculation test...');
      console.log('Make sure Firebase emulator is running: npm run emulators');

      await testMetrics();

      console.log('\n✅ All tests passed!');

    } catch (error) {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    }
  }

  runTests();
}

export { testFormatters, testMetrics };

