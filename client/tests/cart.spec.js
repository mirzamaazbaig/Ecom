/**
 * Shopping Cart E2E Tests
 * ------------------------
 * Test Suite ID: TS_CART
 * Following ISTQB TAE Guidelines:
 * - Modular test design
 * - Independent test execution
 * - Clear verification points
 */

import { test, expect, TestAssertions, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_CART: Shopping Cart Test Suite', () => {

    test.describe('Add to Cart', () => {

        test('TC_CART_001: Should add product to cart from home page', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');

            // Click Add to Cart on first product
            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Verify cart (navigate to cart page)
            await PageActions.goToCart(authenticatedPage);

            // Cart should have items
            await TestAssertions.assertCartHasItems(authenticatedPage);
        });

        test('TC_CART_002: Should add product to cart from product details page', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            // Add to cart
            await PageActions.addProductToCart(authenticatedPage);

            // Navigate to cart and verify
            await PageActions.goToCart(authenticatedPage);
            await TestAssertions.assertCartHasItems(authenticatedPage);
        });

        test('TC_CART_003: Should add product with custom quantity', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            // Set quantity to 2
            await authenticatedPage.fill('input[type="number"]', '2');

            await PageActions.addProductToCart(authenticatedPage);

            // Verify
            await PageActions.goToCart(authenticatedPage);
            await expect(authenticatedPage.locator('text=Quantity: 2')).toBeVisible();
        });
    });

    test.describe('Cart Display', () => {

        test('TC_CART_004: Should display cart items correctly', async ({ authenticatedPage }) => {
            // Add item first
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Go to cart
            await PageActions.goToCart(authenticatedPage);

            // Verify cart elements
            await expect(authenticatedPage.locator('h2:has-text("Shopping Cart")')).toBeVisible();
            await expect(authenticatedPage.locator('text=Summary')).toBeVisible();
            await expect(authenticatedPage.locator('text=Total Items')).toBeVisible();
            await expect(authenticatedPage.locator('text=Total (USD)')).toBeVisible();
            await expect(authenticatedPage.locator('button:has-text("Checkout")')).toBeVisible();
        });

        test('TC_CART_005: Should show empty cart message when cart is empty', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/cart');

            // Verify empty cart state
            await expect(authenticatedPage.locator('text=Your Cart is Empty')).toBeVisible();
            await expect(authenticatedPage.locator('text=Browse Products')).toBeVisible();
        });
    });

    test.describe('Remove from Cart', () => {

        test('TC_CART_006: Should remove item from cart', async ({ authenticatedPage }) => {
            // Add item
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');
            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Go to cart
            await PageActions.goToCart(authenticatedPage);
            await TestAssertions.assertCartHasItems(authenticatedPage);

            // Remove item
            await authenticatedPage.click('button:has-text("Remove")');

            // Verify cart is empty
            await expect(authenticatedPage.locator('text=Your Cart is Empty')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Cart Calculations', () => {

        test('TC_CART_007: Should calculate total correctly', async ({ authenticatedPage }) => {
            // Add item
            await authenticatedPage.goto('/');
            await authenticatedPage.waitForSelector('.card');

            // Get product price before adding
            const priceText = await authenticatedPage.locator('.card-text.fw-bold').first().innerText();
            const price = parseFloat(priceText.replace('$', ''));

            await authenticatedPage.locator('.card .btn-primary').first().click();

            // Go to cart and verify total
            await PageActions.goToCart(authenticatedPage);

            const totalText = await authenticatedPage.locator('.list-group-item:has-text("Total (USD)") strong').innerText();
            const total = parseFloat(totalText.replace('$', ''));

            expect(total).toBe(price);
        });
    });
});
