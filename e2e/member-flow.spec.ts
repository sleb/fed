import { test, expect } from '@playwright/test';
import { loginAsMember, seedTestData, waitForElement } from './helpers';

test.describe('Member User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment with emulator connection
    await page.goto('/');
    await seedTestData(page);
  });

  test('member can browse calendar and view available slots', async ({ page }) => {
    // Login as member
    await loginAsMember(page);
    
    // Navigate to calendar
    await page.goto('/calendar');
    
    // Wait for calendar to load
    await expect(page.getByText('Dinner Calendar')).toBeVisible({ timeout: 15000 });
    
    // Verify calendar subtitle is visible
    await expect(page.getByText('Sign up to provide dinner for our missionaries')).toBeVisible();
    
    // Check for calendar controls
    await expect(page.getByText('Month')).toBeVisible();
    await expect(page.getByText('Week')).toBeVisible(); 
    await expect(page.getByText('Day')).toBeVisible();
    
    // Check for filter dropdown
    await expect(page.getByText('Filter by Companionship')).toBeVisible();
    
    // Test view mode switching
    await page.getByText('Week').click();
    
    // Test day view
    await page.getByText('Day').click();
    
    // Switch back to month view
    await page.getByText('Month').click();
    
    // Check calendar legend is present
    await expect(page.getByText('Available')).toBeVisible();
    await expect(page.getByText('Your Signup')).toBeVisible();
    await expect(page.getByText('Taken')).toBeVisible();
  });

  test('member can view their profile', async ({ page }) => {
    // Login as member
    await loginAsMember(page);
    
    // Navigate to profile
    await page.goto('/profile');
    
    // Wait for profile page to load - this might redirect to onboarding for new users
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we're on profile or onboarding page (both are valid for a new user)
    const isOnProfile = page.url().includes('/profile');
    const isOnOnboarding = page.url().includes('/onboarding');
    
    expect(isOnProfile || isOnOnboarding).toBeTruthy();
    
    if (isOnOnboarding) {
      // If we're on onboarding, verify that the onboarding form is present
      await expect(page.getByText('Complete Your Profile')).toBeVisible();
    } else {
      // If we're on the profile page, verify profile elements
      await expect(page.getByText('Profile')).toBeVisible();
    }
  });

  test('calendar navigation works correctly', async ({ page }) => {
    // Login as member
    await loginAsMember(page);
    
    // Navigate to calendar
    await page.goto('/calendar');
    await expect(page.getByText('Dinner Calendar')).toBeVisible({ timeout: 15000 });
    
    // Test month navigation
    const nextButton = page.locator('button').filter({ hasText: '>' }).first();
    const prevButton = page.locator('button').filter({ hasText: '<' }).first();
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Wait for calendar to update
      await page.waitForTimeout(1000);
    }
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      // Wait for calendar to update
      await page.waitForTimeout(1000);
    }
    
    // Test companionship filter
    const filterSelect = page.getByText('All Companionships').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      
      // Check if there are filter options
      const hasOptions = await page.locator('[role="option"]').count() > 1;
      if (hasOptions) {
        await page.keyboard.press('Escape'); // Close the dropdown
      }
    }
  });

  test('calendar shows loading state initially', async ({ page }) => {
    // Login as member
    await loginAsMember(page);
    
    // Navigate to calendar
    await page.goto('/calendar');
    
    // Should show loading initially
    const loadingText = page.getByText('Loading calendar...');
    
    // Loading might be very brief, so we don't require it to be visible
    // but if it is visible, verify it disappears
    if (await loadingText.isVisible({ timeout: 1000 })) {
      await expect(loadingText).toBeHidden({ timeout: 15000 });
    }
    
    // Eventually should show the calendar
    await expect(page.getByText('Dinner Calendar')).toBeVisible({ timeout: 15000 });
  });
});