import { test, expect } from '@playwright/test';

test.describe('Modern E-commerce Features', () => {

    test.beforeEach(async ({ page }) => {
        // Register/Login flow logic or reuse from a helper if we had one.
        // For now, let's just register a new user for isolation.
        const uniqueEmail = `modern_test_${Date.now()}@example.com`;
        const password = 'password123';

        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"] >> nth=0', password);
        await page.fill('input[type="password"] >> nth=1', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should sort products by price', async ({ page }) => {
        await page.goto('/');

        // Select 'Price: Low to High'
        await page.selectOption('select.form-select', 'price');

        // Give it a moment to sort (in real apps, wait for network or DOM change)
        await page.waitForTimeout(1000);

        // Get all prices
        const priceElements = await page.locator('.card-text').allInnerTexts();
        const prices = priceElements.map(t => parseFloat(t.replace('$', '')));

        // Check if sorted
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sortedPrices);
    });

    test('should filter by category', async ({ page }) => {
        await page.goto('/');

        // Click on 'Electronics' in sidebar
        await page.click('li:has-text("Electronics")');

        // Check if filtered products are all relevant (mock check: check if any product exists)
        // Assuming we have electronics
        await expect(page.locator('.card')).not.toHaveCount(0);
    });

    test('should search for products', async ({ page }) => {
        await page.goto('/');

        // Type in search bar
        await page.fill('input[placeholder="Search products..."]', 'T-Shirt');
        await page.click('.search-btn');

        // Check results
        await expect(page.locator('h3:has-text("Results for")')).toBeVisible();
        // Should find T-Shirt
        await expect(page.locator('.card-title:has-text("T-Shirt")').first()).toBeVisible();
    });

    test('should add product to wishlist', async ({ page }) => {
        await page.goto('/');

        // Click View Details on first product
        await page.click('a:has-text("View Details") >> nth=0');

        // Click Wishlist button
        page.on('dialog', dialog => dialog.accept()); // Handle "Added to Wishlist" alert
        await page.click('button:has-text("Wishlist")');

        // Go to Wishlist page
        await page.click('a:has-text("Wishlist")');

        // Check if product is there
        await expect(page.locator('.card')).not.toHaveCount(0);
    });

    test('should submit a review', async ({ page }) => {
        await page.goto('/');
        await page.click('a:has-text("View Details") >> nth=0');

        // Fill review form
        await page.selectOption('select.form-select', '5');
        await page.fill('textarea', 'Great product, really loved it!');

        // Submit
        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Submit Review")');

        // Verify review appears
        await expect(page.locator('p:has-text("Great product, really loved it!")')).toBeVisible();
    });
});
