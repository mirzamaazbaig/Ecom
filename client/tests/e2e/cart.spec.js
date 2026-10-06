/**
 * Shopping Cart E2E Tests
 * ------------------------
 * Test Suite ID: TS_CART
 */
import { test, expect } from '../fixtures/test-fixtures.js';

test.describe('TS_CART: Shopping Cart Test Suite', () => {

    test.describe('Add to Cart', () => {

        test('TC_CART_001: Should add product to cart from home page', async ({ shopper }) => {
            await shopper.home.goto();
            const name = await shopper.home.firstProductName();

            await shopper.home.addToCart(name);
            await shopper.nav.expectCartCount(1);
            await shopper.nav.openCart();

            await expect(shopper.cart.itemNames).toHaveText([name]);
        });

        test('TC_CART_002: Should add product to cart from product details page', async ({ shopper }) => {
            await shopper.home.goto();
            const name = await shopper.home.firstProductName();
            await shopper.home.openDetails(name);

            await shopper.product.addToCart();
            await shopper.nav.openCart();

            await expect(shopper.cart.itemNames).toHaveText([name]);
            expect(shopper.dialogs.join(' ')).toContain(name);
        });

        test('TC_CART_003: Should add product with custom quantity', async ({ shopper }) => {
            await shopper.home.goto();
            const name = await shopper.home.firstProductName();
            await shopper.home.openDetails(name);

            await shopper.product.setQuantity(2);
            await shopper.product.addToCart();
            await shopper.nav.openCart();

            await expect(shopper.cart.item(name)).toContainText('Quantity: 2');
        });
    });

    test.describe('Cart Display', () => {

        test('TC_CART_004: Should display cart items correctly', async ({ shopper }) => {
            await shopper.home.goto();
            await shopper.home.addToCart(await shopper.home.firstProductName());
            await shopper.nav.expectCartCount(1);
            await shopper.nav.openCart();

            await expect(shopper.cart.heading).toBeVisible();
            await expect(shopper.cart.summary).toBeVisible();
            await expect(shopper.cart.totalItems).toBeVisible();
            await expect(shopper.cart.totalLabel).toBeVisible();
            await expect(shopper.cart.checkoutButton).toBeVisible();
        });

        test('TC_CART_005: Should show empty cart message when cart is empty', async ({ shopper }) => {
            await shopper.cart.goto();

            await expect(shopper.cart.emptyHeading).toBeVisible();
            await expect(shopper.cart.browseButton).toBeVisible();
        });
    });

    test.describe('Remove from Cart', () => {

        test('TC_CART_006: Should remove item from cart', async ({ shopper }) => {
            await shopper.home.goto();
            const name = await shopper.home.firstProductName();
            await shopper.home.addToCart(name);
            await shopper.nav.expectCartCount(1);
            await shopper.nav.openCart();
            await expect(shopper.cart.item(name)).toBeVisible();

            await shopper.cart.remove(name);

            await expect(shopper.cart.emptyHeading).toBeVisible();
        });
    });

    test.describe('Cart Calculations', () => {

        test('TC_CART_007: Should calculate total correctly', async ({ shopper }) => {
            await shopper.home.goto();
            const name = await shopper.home.firstProductName();
            const price = await shopper.home.priceOf(name);

            await shopper.home.addToCart(name);
            await shopper.nav.expectCartCount(1);
            await shopper.nav.openCart();

            expect(await shopper.cart.total()).toBe(price);
        });
    });
});
