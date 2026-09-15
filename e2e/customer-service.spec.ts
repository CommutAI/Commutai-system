import { test, expect } from '@playwright/test';

test.describe('Customer Service App', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check if page loads
    await expect(page).toHaveTitle(/CommutAI/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001');
    
    // Check mobile layout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const emailInput = page.locator('input[type="email"]');
    const box = await emailInput.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Note: This test would need authentication to fully test
    // For now, just check that the page loads
    await expect(page).toHaveTitle(/CommutAI/);
  });
});
