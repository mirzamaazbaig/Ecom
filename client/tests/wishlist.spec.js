/**
 * Wishlist E2E Tests
 * -------------------
 * Test Suite ID: TS_WISH
 * Following ISTQB TAE Guidelines:
 * - Functional testing of wishlist feature
 * - Integration with product and cart functionality
 */

import { test, expect, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_WISH: Wishlist Test Suite', () => {

    test.describe('Add to Wishlist', () => {

        test('TC_WISH_001: Should add product to wishlist from product details', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            // Add to wishlist
            await PageActions.addProductToWishlist(authenticatedPage);

            // Navigate to wishlist and verify
            await PageActions.goToWishlist(authenticatedPage);

            // Should show at least one item
            await expect(authenticatedPage.locator('.card').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('View Wishlist', () => {

        test('TC_WISH_002: Should display wishlist page correctly', async ({ authenticatedPage }) => {
            // Add item to wishlist first
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            // Navigate to wishlist
            await PageActions.goToWishlist(authenticatedPage);

            // Verify wishlist elements
            await expect(authenticatedPage.locator('h2:has-text("My Wishlist")')).toBeVisible();
            await expect(authenticatedPage.locator('.card').first()).toBeVisible();
            await expect(authenticatedPage.locator('text=Add to Cart').first()).toBeVisible();
            await expect(authenticatedPage.locator('text=Remove from Wishlist').first()).toBeVisible();
        });

        test('TC_WISH_003: Should show empty wishlist message', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/wishlist');

            // A freshly registered user has no wishlist items
            await expect(authenticatedPage.locator('h2:has-text("Your Wishlist is Empty")')).toBeVisible();
            await expect(authenticatedPage.locator('.card')).toHaveCount(0);
        });
    });

    test.describe('Wishlist Actions', () => {

        test('TC_WISH_004: Should add wishlist item to cart', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);
            const productName = (await authenticatedPage.locator('h2').innerText()).trim();
            await PageActions.addProductToWishlist(authenticatedPage);

            await PageActions.goToWishlist(authenticatedPage);
            await expect(authenticatedPage.locator('.card-title')).toHaveText(productName);

            // Add to cart from the wishlist itself
            await authenticatedPage.locator('.card button:has-text("Add to Cart")').click();

            await PageActions.goToCart(authenticatedPage);
            await expect(authenticatedPage.locator('.list-group-item h6', { hasText: productName })).toBeVisible();
        });

        test('TC_WISH_005: Should remove item from wishlist', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            await PageActions.goToWishlist(authenticatedPage);
            await expect(authenticatedPage.locator('.card')).toHaveCount(1);

            await authenticatedPage.click('button:has-text("Remove from Wishlist")');

            await expect(authenticatedPage.locator('h2:has-text("Your Wishlist is Empty")')).toBeVisible();
            await expect(authenticatedPage.locator('.card')).toHaveCount(0);
        });
    });

    test.describe('Wishlist Navigation', () => {

        test('TC_WISH_006: Should navigate to product from wishlist', async ({ authenticatedPage }) => {
            // Add to wishlist
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            // Go to wishlist
            await PageActions.goToWishlist(authenticatedPage);
            await authenticatedPage.waitForSelector('.card');

            // Click on product link
            await authenticatedPage.locator('.card-title a').first().click();

            // Should navigate to product details
            await expect(authenticatedPage.url()).toContain('/products/');
            await expect(authenticatedPage.locator('text=Add to Cart')).toBeVisible();
        });
    });
});
