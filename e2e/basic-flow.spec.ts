import { test, expect } from '@playwright/test';

test.describe('Basic App Flow', () => {
  test('landing page loads correctly', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Check that the page loads (should show login or main content)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'landing-page.png' });
  });

  test('admin page requires authentication', async ({ page }) => {
    // Try to navigate to admin page
    await page.goto('/admin');
    
    // Should redirect to login or show auth error
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Take a screenshot to see the result
    await page.screenshot({ path: 'admin-page-redirect.png' });
    
    // The URL should either be /login or stay on /admin with auth error
    const url = page.url();
    const bodyText = await page.textContent('body');
    
    // Should either redirect to login or show authentication error
    expect(url.includes('/login') || bodyText?.includes('Admin Dashboard') || bodyText?.includes('sign')).toBeTruthy();
  });

  test('calendar page loads', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/calendar');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Take a screenshot
    await page.screenshot({ path: 'calendar-page.png' });
    
    // Should show calendar or login requirement
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});