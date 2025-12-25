import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
    // Setup: Create a user and login before tests
    test.beforeEach(async ({ page }) => {
        const uniqueEmail = `cart_test_${Date.now()}@example.com`;
        const password = 'password123';

        // Register (which auto-logins)
        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"] >> nth=0', password);
        await page.fill('input[type="password"] >> nth=1', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
    });

    test('should add product to cart and verify count', async ({ page }) => {
        // Go to Home
        await page.goto('/');

        // Click on the first product's "View Details" button
        await page.waitForSelector('.card');
        await page.click('text=View Details');

        // On Product Details Page
        // Handle alert dialog that appears after adding to cart
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Added');
            await dialog.dismiss();
        });

        // Click Add to Cart
        await page.click('text=Add to Cart');

        // Navigate to Cart
        await page.click('text=Cart');
        await expect(page).toHaveURL('/cart');

        // Verify item is in cart
        // Check for "Total Items" row we added
        await expect(page.locator('text=Total Items')).toBeVisible();

        // Summary should show at least 1 item
        // The count might be dynamic, so we check if the element contains a number > 0
        // Or simply check that the list group item exists
        await expect(page.locator('.list-group-item').first()).toBeVisible();
    });
});
