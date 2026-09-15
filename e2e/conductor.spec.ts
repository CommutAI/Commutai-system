import { test, expect } from '@playwright/test';

test.describe('Conductor App', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if page loads
    await expect(page).toHaveTitle(/CommutAI/);
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation on empty form submit', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Try to submit without filling form
    await page.click('button[type="submit"]');
    
    // Check for validation
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Check mobile layout
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const emailInput = page.locator('input[type="email"]');
    const box = await emailInput.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});
