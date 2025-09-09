import { test, expect } from '@playwright/test';
import { loginAsAdmin, seedTestData, waitForElement } from './helpers';

test.describe('Admin User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment with emulator connection
    await page.goto('/');
    await seedTestData(page);
  });

  test('admin can access dashboard and seed data', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Wait for dashboard to load and verify admin access
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Check that admin dashboard elements are present
    await expect(page.getByText('Manage missionary dinner coordination')).toBeVisible();
    
    // Try to seed the database
    const seedBtn = page.getByText('Seed Test Data');
    if (await seedBtn.isVisible()) {
      await seedBtn.click();
      
      // Wait for success message
      await expect(page.getByText('Database seeded successfully')).toBeVisible({ timeout: 15000 });
    }
    
    // Verify navigation cards are present
    await expect(page.getByText('Dinner Calendar')).toBeVisible();
    await expect(page.getByText('Missionaries')).toBeVisible();
    await expect(page.getByText('Companionships')).toBeVisible();
  });

  test('admin can navigate to companionships management', async ({ page }) => {
    // Login as admin  
    await loginAsAdmin(page);
    
    // Navigate to admin dashboard first
    await page.goto('/admin');
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Click on Companionships navigation card
    await page.getByText('Companionships').click();
    
    // Should navigate to companionships page
    await expect(page.url()).toContain('/admin/companionships');
    
    // Basic page load verification
    await page.waitForLoadState('networkidle');
  });

  test('admin can navigate to missionaries management', async ({ page }) => {
    // Login as admin  
    await loginAsAdmin(page);
    
    // Navigate to admin dashboard first
    await page.goto('/admin');
    await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Click on Missionaries navigation card
    await page.getByText('Missionaries').click();
    
    // Should navigate to missionaries page
    await expect(page.url()).toContain('/admin/missionaries');
    
    // Basic page load verification
    await page.waitForLoadState('networkidle');
  });
});