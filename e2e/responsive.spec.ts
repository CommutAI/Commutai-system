import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'iPad', viewport: { width: 768, height: 1024 } },
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
];

test.describe('Responsive Design Tests', () => {
  devices.forEach((device) => {
    test(`should render correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device.viewport);
      await page.goto('http://localhost:3000');
      
      // Check that page loads
      await expect(page).toHaveTitle(/CommutAI/);
      
      // Check that input fields are visible and properly sized
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      const box = await emailInput.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      
      // On mobile, inputs should be full width
      if (device.viewport.width < 768) {
        expect(box?.width).toBeGreaterThan(300);
      }
    });
  });

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    const emailInputPortrait = page.locator('input[type="email"]');
    await expect(emailInputPortrait).toBeVisible();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    const emailInputLandscape = page.locator('input[type="email"]');
    await expect(emailInputLandscape).toBeVisible();
  });

  test('should have proper touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Check that buttons have adequate touch targets (minimum 44x44)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    const box = await submitButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});
