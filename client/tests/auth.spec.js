import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    test('should register a new user successfully', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', password);
        // Assuming there is a submit button with type="submit" or specific text
        await page.click('button[type="submit"]');

        // Should redirect to login or home, check for URL or success message
        // Based on typical flows, might redirect to login
        await expect(page).toHaveURL(/\/login/);
        // Or check for "Registration successful" if it stays on page
    });

    test('should login with the registered user', async ({ page }) => {
        // Navigate to login
        await page.goto('/login');

        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Should redirect to home or show user info
        await expect(page).toHaveURL('/');
        // Check for "Logout" button to confirm logged in state
        await expect(page.locator('text=Logout')).toBeVisible();
    });
});
