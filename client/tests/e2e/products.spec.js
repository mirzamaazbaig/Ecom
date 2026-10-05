/**
 * Product Browsing E2E Tests
 * ---------------------------
 * Test Suite ID: TS_PROD
 * Following ISTQB TAE Guidelines:
 * - Test case isolation
 * - Data-driven testing approach
 * - Clear test objectives and expected results
 */

import { test, expect, API_URL, TestData, TestAssertions, PageActions } from '../fixtures/test-fixtures.js';

test.describe('TS_PROD: Product Browsing Test Suite', () => {

    test.describe('Home Page & Product Listing', () => {

        test('TC_PROD_001: Should display home page with products', async ({ page }) => {
            await page.goto('/');

            // Verify products are loaded

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
            await expect(page.locator('button:has-text("Wishlist")')).toBeVisible();
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

        test('TC_PROD_007: Should filter products by category', async ({ authenticatedPage, request }) => {
            await authenticatedPage.goto('/');
            const cards = authenticatedPage.locator('.card');
            await expect(cards.first()).toBeVisible();
            const totalCount = await cards.count();

            // Ground truth from the API (category 1 = Electronics)
            const expected = await (await request.get(`${API_URL}/products?category_id=1`)).json();
            expect(expected.length).toBeGreaterThan(0);
            expect(expected.length).toBeLessThan(totalCount);

            await PageActions.filterByCategory(authenticatedPage, 'Electronics');

            // UI shows exactly the Electronics products
            await expect(cards).toHaveCount(expected.length);
            const titles = await authenticatedPage.locator('.card-title').allInnerTexts();
            expect([...titles].sort()).toEqual(expected.map(p => p.name).sort());
        });

        test('TC_PROD_008: Should show all products when selecting All Departments', async ({ page }) => {
            await page.goto('/');
            const cards = page.locator('.card');
            await expect(cards.first()).toBeVisible();
            const totalCount = await cards.count();

            await PageActions.filterByCategory(page, 'Electronics');
            await expect(cards).not.toHaveCount(totalCount);

            await page.click('li:has-text("All Departments")');
            await expect(cards).toHaveCount(totalCount);
        });
    });

    test.describe('Product Sorting', () => {

        test('TC_PROD_009: Should sort products by price low to high', async ({ page }) => {
            await page.goto('/');
            await expect(page.locator('.card').first()).toBeVisible();

            await PageActions.sortProducts(page, 'price');

            const readPrices = async () => {
                const texts = await page.locator('.card .card-text.fw-bold').allInnerTexts();
                return texts.map(t => parseFloat(t.replace('$', '')));
            };

            // Poll until the re-fetched list is in ascending order (no fixed sleeps)
            await expect.poll(async () => {
                const prices = await readPrices();
                return prices.length > 1 && prices.every((v, i) => i === 0 || prices[i - 1] <= v);
            }).toBe(true);
        });

        test('TC_PROD_010: Should request newest arrivals and keep all products listed', async ({ page }) => {
            await page.goto('/');
            const cards = page.locator('.card');
            await expect(cards.first()).toBeVisible();
            const totalCount = await cards.count();

            // Seeded products share one created_at, so order cannot be asserted;
            // verify the right query is sent and nothing is lost.
            const [response] = await Promise.all([
                page.waitForResponse(r => r.url().includes('sort_by=created_at')),
                PageActions.sortProducts(page, 'created_at'),
            ]);
            expect(response.ok()).toBe(true);
            await expect(cards).toHaveCount(totalCount);
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

            await expect(page.locator('text=No products found')).toBeVisible();
            await expect(page.locator('.card')).toHaveCount(0);
        });
    });
});
