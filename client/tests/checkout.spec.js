/**
 * Checkout & Orders E2E Tests
 * ----------------------------
 * Test Suite ID: TS_ORDER
 * Following ISTQB TAE Guidelines:
 * - End-to-end transaction testing
 * - Critical path verification
 * - State transition testing
 */

import { test, expect, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_ORDER: Checkout & Orders Test Suite', () => {

    test.describe('Checkout Process', () => {

        test('TC_ORDER_001: Should complete checkout successfully', async ({ authenticatedPage }) => {
            // Add item to cart
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Go to cart
            await PageActions.goToCart(authenticatedPage);
            await expect(authenticatedPage.locator('.list-group-item').first()).toBeVisible();

            // Click checkout
            await authenticatedPage.click('button:has-text("Checkout")');

            // Should redirect to orders page
            await PageActions.goToOrders(authenticatedPage);
            await expect(authenticatedPage.locator('h2:has-text("My Orders")')).toBeVisible();
        });

        test('TC_ORDER_002: Should show checkout button only when cart has items', async ({ authenticatedPage }) => {
            // Empty cart state
            await authenticatedPage.goto('/cart');

            // No checkout button when cart is empty
            await expect(authenticatedPage.locator('text=Your Cart is Empty')).toBeVisible();
            await expect(authenticatedPage.locator('button:has-text("Checkout")')).not.toBeVisible();
        });

        test('TC_ORDER_003: Should clear cart after successful checkout', async ({ authenticatedPage }) => {
            // Add item
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Checkout
            await PageActions.goToCart(authenticatedPage);
            await authenticatedPage.click('button:has-text("Checkout")');
            await expect(authenticatedPage).toHaveURL(/\/my-orders/, { timeout: 15000 });

            // Go back to cart - should be empty
            await PageActions.goToCart(authenticatedPage);
            await expect(authenticatedPage.locator('text=Your Cart is Empty')).toBeVisible();
        });
    });

    test.describe('Order History', () => {

        test('TC_ORDER_004: Should display orders page', async ({ authenticatedPage }) => {
            // First complete a checkout
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            await PageActions.goToCart(authenticatedPage);
            await authenticatedPage.click('button:has-text("Checkout")');

            // Verify orders page
            await PageActions.goToOrders(authenticatedPage);
            await expect(authenticatedPage.locator('h2:has-text("My Orders")')).toBeVisible();
        });

        test('TC_ORDER_005: Should show order details', async ({ authenticatedPage }) => {
            // Complete checkout
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            await PageActions.goToCart(authenticatedPage);
            await authenticatedPage.click('button:has-text("Checkout")');
            await PageActions.goToOrders(authenticatedPage);

            // Verify order is listed with relevant information
            // Orders should be visible (table or card)
            // Orders should be visible (accordion items)
            await expect(
                authenticatedPage.locator('.accordion-item')
            ).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Protected Routes', () => {

        test('TC_ORDER_006: Should redirect unauthenticated user to login', async ({ page }) => {
            // Try to access orders without login
            await page.goto('/my-orders');

            // Should redirect to login
            await expect(page).toHaveURL('/login', { timeout: 10000 });
        });

        test('TC_ORDER_007: Should allow unauthenticated user to view cart', async ({ page }) => {
            // Go directly to cart
            await page.goto('/cart');

            // Should be able to access cart without login
            await expect(page).toHaveURL('/cart', { timeout: 10000 });

            // Should show empty cart message
            await expect(page.locator('text=Your Cart is Empty')).toBeVisible();
        });
    });
});
