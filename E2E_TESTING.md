# E2E Testing Guide

This project now includes end-to-end (e2e) tests using Playwright to test the major user flows for both admin and member users.

## Test Files

- `e2e/basic-flow.spec.ts` - Basic smoke tests for app functionality
- `e2e/admin-flow.spec.ts` - Admin user flow tests (dashboard access, navigation)
- `e2e/member-flow.spec.ts` - Member user flow tests (calendar browsing, profile access)
- `e2e/helpers.ts` - Test helper functions for authentication and setup

## Running Tests

### Prerequisites

1. Node.js 18+ installed
2. Firebase emulators (optional, for full functionality)

### Basic Commands

```bash
# Install dependencies (if not already done)
npm install

# Run all e2e tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test admin-flow.spec.ts

# Run tests with specific reporter
npx playwright test --reporter=line
```

### With Firebase Emulators

For full functionality including real-time Firestore subscriptions:

```bash
# Terminal 1: Start Firebase emulators
npm run emulators:start

# Terminal 2: Run tests
npm run test:e2e
```

### Test Configuration

The tests are configured in `playwright.config.ts` with:

- Chromium browser using system installation
- 60-second timeout per test
- Screenshots on failure
- Automatic dev server startup
- Line reporter for cleaner output

### Test Structure

#### Basic Flow Tests
- Landing page loads correctly
- Admin page requires authentication
- Calendar page loads (with or without auth)

#### Admin Flow Tests
- Admin can access dashboard
- Admin can seed test data
- Admin can navigate to companionships management
- Admin can navigate to missionaries management

#### Member Flow Tests  
- Member can browse calendar and view available slots
- Member can view their profile (or onboarding)
- Calendar navigation works correctly
- Calendar shows loading states properly

### Test Data

Tests use mock authentication stored in localStorage to simulate logged-in users. The helper functions in `e2e/helpers.ts` provide:

- `loginAsAdmin()` - Creates mock admin user
- `loginAsMember()` - Creates mock member user  
- `seedTestData()` - Seeds test missionaries and companionships
- `waitForElement()` - Helper for waiting for UI elements

### Firebase Integration

The tests are designed to work with Firebase emulators for real-time functionality testing. When emulators are not running, tests focus on UI behavior and navigation.

### Environment Configuration

Tests use the environment configuration in `.env.local` which includes mock Firebase settings for development/testing.

## Test Coverage

The current tests provide coverage for:

✅ **Admin User Flow**
- Dashboard access and navigation
- Data seeding functionality  
- Navigation to management pages

✅ **Member User Flow**
- Calendar browsing and navigation
- Profile/onboarding access
- View mode switching

✅ **Basic App Functionality**
- Page loading and routing
- Authentication requirements
- Error handling

### Future Enhancements

Potential areas for test expansion:
- Real-time subscription testing with Firebase emulators
- Form submission and data persistence
- Notification preference testing
- Mobile-specific UI testing
- Accessibility testing
- Performance testing

## Troubleshooting

### Common Issues

**Port conflicts**: If you get port 3000 in use errors, stop any running dev servers first.

**Firebase errors**: Ensure `.env.local` has valid Firebase configuration or run with emulators.

**Browser not found**: The tests use the system Chromium browser at `/usr/bin/chromium-browser`.

**Timeout issues**: Increase timeout in `playwright.config.ts` if tests are timing out on slower systems.

### Debug Mode

```bash
# Run tests in debug mode with browser visible
npx playwright test --debug

# Generate test report
npx playwright show-report
```

This e2e testing setup provides a solid foundation for testing the missionary dinner coordination system's major user flows and can be expanded as the application grows.