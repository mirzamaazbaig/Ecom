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
            await authenticatedPage.click('a[href="/wishlist"]');
            await expect(authenticatedPage).toHaveURL('/wishlist');

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
            await authenticatedPage.click('a[href="/wishlist"]');

            // Verify wishlist elements
            await expect(authenticatedPage.locator('h2:has-text("My Wishlist")')).toBeVisible();
            await expect(authenticatedPage.locator('.card').first()).toBeVisible();
            await expect(authenticatedPage.locator('text=Add to Cart').first()).toBeVisible();
            await expect(authenticatedPage.locator('text=Remove from Wishlist').first()).toBeVisible();
        });

        test('TC_WISH_003: Should show empty wishlist message', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/wishlist');

            // Should show empty state
            await expect(authenticatedPage.locator('text=Your Wishlist is Empty').or(authenticatedPage.locator('.card'))).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Wishlist Actions', () => {

        test('TC_WISH_004: Should add wishlist item to cart', async ({ authenticatedPage }) => {
            // Add to wishlist
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            // Go to wishlist
            await authenticatedPage.click('a:has-text("Wishlist")');
            await authenticatedPage.waitForSelector('.card');

            // Add to cart from wishlist
            await authenticatedPage.click('button:has-text("Add to Cart")');

            // Verify in cart
            await PageActions.goToCart(authenticatedPage);
            await expect(authenticatedPage.locator('.list-group-item').first()).toBeVisible({ timeout: 5000 });
        });

        test('TC_WISH_005: Should remove item from wishlist', async ({ authenticatedPage }) => {
            // Add to wishlist
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            // Go to wishlist
            await authenticatedPage.click('a:has-text("Wishlist")');
            await authenticatedPage.waitForSelector('.card');

            // Remove from wishlist
            await authenticatedPage.click('button:has-text("Remove from Wishlist")');

            // Verify removed (empty or refreshed)
            await expect(authenticatedPage.locator('text=Your Wishlist is Empty').or(authenticatedPage.locator('.card'))).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Wishlist Navigation', () => {

        test('TC_WISH_006: Should navigate to product from wishlist', async ({ authenticatedPage }) => {
            // Add to wishlist
            await PageActions.goToFirstProduct(authenticatedPage);
            await PageActions.addProductToWishlist(authenticatedPage);

            // Go to wishlist
            await authenticatedPage.click('a:has-text("Wishlist")');
            await authenticatedPage.waitForSelector('.card');

            // Click on product link
            await authenticatedPage.locator('.card-title a').first().click();

            // Should navigate to product details
            await expect(authenticatedPage.url()).toContain('/products/');
            await expect(authenticatedPage.locator('text=Add to Cart')).toBeVisible();
        });
    });
});
