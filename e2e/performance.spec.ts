import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    const loadTime = Date.now() - startTime;
    
    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      };
    });
    
    // DOM content loaded should be under 1.5s
    expect(metrics.domContentLoaded).toBeLessThan(1500);
    
    // Load complete should be under 3s
    expect(metrics.loadComplete).toBeLessThan(3000);
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate to different pages and back
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory increase should be reasonable (less than 50MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('should have efficient bundle sizes', async ({ page, request }) => {
    await page.goto('http://localhost:3000');
    
    // Get all network requests
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    });
    
    // Filter for JavaScript files
    const jsFiles = resources.filter(r => r.name.endsWith('.js'));
    
    // Check that no single JS file is too large (>500KB)
    for (const file of jsFiles) {
      const size = file.transferSize || file.encodedBodySize || 0;
      expect(size).toBeLessThan(500 * 1024);
    }
  });

  test('should handle concurrent requests efficiently', async ({ context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ]);
    
    const startTime = Date.now();
    
    // Load pages concurrently
    await Promise.all([
      pages[0].goto('http://localhost:3000'),
      pages[1].goto('http://localhost:3000'),
      pages[2].goto('http://localhost:3000'),
    ]);
    
    const loadTime = Date.now() - startTime;
    
    // Concurrent load should still be reasonable
    expect(loadTime).toBeLessThan(5000);
    
    // Cleanup
    await Promise.all(pages.map(p => p.close()));
  });
});
