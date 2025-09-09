import { test, expect, Page } from '@playwright/test';

// Test data setup helpers
export async function createTestUser(page: Page, email: string, name: string, role: 'member' | 'admin' = 'member') {
  // This would normally interact with Firebase Auth emulator
  // For now, we'll mock the authentication process in the browser
  return await page.evaluate(async ({ email, name, role }) => {
    // Store mock user data in localStorage to simulate authentication
    const mockUser = {
      uid: `test-${Date.now()}-${Math.random()}`,
      email,
      displayName: name,
      emailVerified: true
    };
    
    const mockUserData = {
      id: mockUser.uid,
      name,
      email,
      role,
      onboardingCompleted: true,
      preferences: {
        contactMethod: 'email',
        signupReminders: true,
        appointmentReminders: true,
        changeNotifications: true,
        reminderDaysBefore: 1,
      },
      stats: {
        totalSignups: 0,
        completedDinners: 0,
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    localStorage.setItem('mockUserData', JSON.stringify(mockUserData));
    
    return { mockUser, mockUserData };
  }, { email, name, role });
}

export async function seedTestData(page: Page) {
  // Create test companionships and missionaries directly in the browser
  return await page.evaluate(async () => {
    const testData = {
      missionaries: [
        {
          id: 'missionary-1',
          name: 'Elder Smith',
          email: 'elder.smith@missionary.org',
          dinnerPreferences: ['Italian', 'Vegetarian'],
          allergies: ['Nuts'],
          notes: 'Vegetarian, prefers simple meals',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'missionary-2', 
          name: 'Elder Johnson',
          email: 'elder.johnson@missionary.org',
          dinnerPreferences: ['Mexican', 'Home cooking'],
          allergies: ['Shellfish'],
          notes: 'Loves spicy food',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      companionships: [
        {
          id: 'companionship-1',
          area: 'North Ward Area',
          address: '123 Main St, City, ST 12345',
          phone: '(555) 123-4567',
          missionaryIds: ['missionary-1', 'missionary-2'],
          daysOfWeek: [1, 2, 3, 4, 5, 6], // Mon-Sat
          notes: 'Test companionship for e2e tests',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]
    };
    
    localStorage.setItem('testData', JSON.stringify(testData));
    return testData;
  });
}

export async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(selector, { timeout });
  return page.locator(selector);
}

export async function loginAsAdmin(page: Page) {
  await createTestUser(page, 'admin@test.com', 'Test Admin', 'admin');
}

export async function loginAsMember(page: Page) {
  await createTestUser(page, 'member@test.com', 'Test Member', 'member');
}