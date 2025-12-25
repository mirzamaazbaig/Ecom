import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    test('should register a new user successfully', async ({ page }) => {
        const uniqueEmail = `testuser_reg_${Date.now()}@example.com`;
        const password = 'password123';

        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', password);
        await page.fill('input[type="password"] >> nth=1', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
    });

    test('should login with the registered user', async ({ page }) => {
        const uniqueEmail = `testuser_login_${Date.now()}@example.com`;
        const password = 'password123';

        // Register first
        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', password);
        await page.fill('input[type="password"] >> nth=1', password);
        // Need to target confirm password correctly.
        // Register.jsx: <div className="mb-3"><label>Confirm Password</label><input type="password" ...
        // Use placeholder if available? No placeholder in code.
        // Use label selector.

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/'); // Auto logged in?

        // Logout to test login
        await page.click('text=Logout');

        // Now Login
        await page.goto('/login');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Logout')).toBeVisible();
    });
});
