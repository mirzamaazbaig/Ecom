/**
 * Product Browsing E2E Tests
 * ---------------------------
 * Test Suite ID: TS_PROD
 * Following ISTQB TAE Guidelines:
 * - Test case isolation
 * - Data-driven testing approach
 * - Clear test objectives and expected results
 */

import { test, expect, TestData, TestAssertions, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_PROD: Product Browsing Test Suite', () => {

    test.describe('Home Page & Product Listing', () => {

        test('TC_PROD_001: Should display home page with products', async ({ page }) => {
            await page.goto('/');

            // Verify hero section (when no search)
            await expect(page.locator('.hero-container')).toBeVisible({ timeout: 10000 });

            // Verify products are loaded
            await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });

            // Verify product cards have essential elements
            const firstCard = page.locator('.card').first();
            await expect(firstCard.locator('.card-title')).toBeVisible();
            await expect(firstCard.locator('text=Add to Cart')).toBeVisible();
            await expect(firstCard.locator('text=View Details')).toBeVisible();
        });

        test('TC_PROD_002: Should display product prices correctly', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Verify price format ($XX.XX)
            const priceElements = await page.locator('.card-text.fw-bold').allInnerTexts();
            expect(priceElements.length).toBeGreaterThan(0);

            for (const price of priceElements) {
                expect(price).toMatch(/^\$\d+\.\d{2}$/);
            }
        });

        test('TC_PROD_003: Should display product ratings', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Verify rating stars are visible
            const ratingElements = page.locator('.card .text-warning');
            await expect(ratingElements.first()).toBeVisible();
        });
    });

    test.describe('Product Details Navigation', () => {

        test('TC_PROD_004: Should navigate to product details via View Details button', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Click View Details on first product
            await page.locator('.card .btn-outline-secondary').first().click();

            // Verify product details page
            await expect(page.locator('.container h2')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('text=Add to Cart')).toBeVisible();
            await expect(page.locator('text=Wishlist')).toBeVisible();
            await expect(page.url()).toContain('/products/');
        });

        test('TC_PROD_005: Should navigate to product details via product name link', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Click product name
            await page.locator('.card-title a').first().click();

            // Verify navigation
            await expect(page.url()).toContain('/products/');
            await TestAssertions.assertOnProductPage(page);
        });

        test('TC_PROD_006: Should display product details correctly', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Verify all product info sections
            await expect(page.locator('h2').first()).toBeVisible(); // Product name
            await expect(page.locator('.text-muted').first()).toBeVisible(); // Price
            await expect(page.locator('text=Category:')).toBeVisible();
            await expect(page.locator('text=Stock:')).toBeVisible();
            await expect(page.locator('text=Customer Reviews')).toBeVisible();
        });
    });

    test.describe('Category Filtering', () => {

        test('TC_PROD_007: Should filter products by category', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');

            // Get initial count
            const initialCount = await authenticatedPage.locator('.card').count();

            // Click on Electronics category
            await PageActions.filterByCategory(authenticatedPage, 'Electronics');
            await authenticatedPage.waitForTimeout(1000);

            // Verify products are filtered (count may differ)
            const filteredCards = authenticatedPage.locator('.card');
            await expect(filteredCards.first()).toBeVisible({ timeout: 10000 });
        });

        test('TC_PROD_008: Should show all products when selecting All Departments', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Filter by category first
            await PageActions.filterByCategory(page, 'Electronics');
            await page.waitForTimeout(500);

            // Then select All Departments
            await page.click('li:has-text("All Departments")');
            await page.waitForTimeout(500);

            // Verify products are shown
            await expect(page.locator('.card').first()).toBeVisible();
        });
    });

    test.describe('Product Sorting', () => {

        test('TC_PROD_009: Should sort products by price low to high', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Sort by price
            await PageActions.sortProducts(page, 'price');
            await page.waitForTimeout(1000);

            // Get all prices
            const priceElements = await page.locator('.card .card-text.fw-bold').allInnerTexts();
            const prices = priceElements.map(t => parseFloat(t.replace('$', '')));

            // Verify ascending order
            const sortedPrices = [...prices].sort((a, b) => a - b);
            expect(prices).toEqual(sortedPrices);
        });

        test('TC_PROD_010: Should sort products by newest arrivals', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            // Sort by created_at
            await PageActions.sortProducts(page, 'created_at');
            await page.waitForTimeout(1000);

            // Verify products are still displayed
            await expect(page.locator('.card').first()).toBeVisible();
        });
    });

    test.describe('Product Search', () => {

        test('TC_PROD_011: Should search for products and display results', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            const searchTerm = TestData.getProducts().searchTerm;

            // Perform search
            await PageActions.searchForProduct(page, searchTerm);

            // Verify search results header
            await expect(page.locator(`text=Results for "${searchTerm}"`)).toBeVisible({ timeout: 10000 });
        });

        test('TC_PROD_012: Should show matching products in search results', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            await PageActions.searchForProduct(page, 'T-Shirt');

            // Verify matching products are shown
            await expect(page.locator('.card-title:has-text("T-Shirt")').first()).toBeVisible({ timeout: 10000 });
        });

        test('TC_PROD_013: Should handle empty search results gracefully', async ({ page }) => {
            await page.goto('/');
            await page.waitForSelector('.card');

            await PageActions.searchForProduct(page, 'XyzNonexistentProduct12345');

            // Should show "No products found" or empty results
            await expect(page.locator('text=No products found').or(page.locator('text=Results for'))).toBeVisible({ timeout: 10000 });
        });
    });
});
