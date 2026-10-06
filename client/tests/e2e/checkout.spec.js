/**
 * Checkout & Orders E2E Tests
 * ----------------------------
 * Test Suite ID: TS_ORDER
 */
import { test, expect } from '../fixtures/test-fixtures.js';
import { sql } from '../support/db.js';

/** Puts the first listed product in the cart and opens the cart; returns the product's name and price. */
async function fillCart(shopper) {
    await shopper.home.goto();
    const name = await shopper.home.firstProductName();
    const price = await shopper.home.priceOf(name);
    await shopper.home.addToCart(name);
    await shopper.nav.expectCartCount(1);
    await shopper.nav.openCart();
    return { name, price };
}

test.describe('TS_ORDER: Checkout & Orders Test Suite', () => {

    // Orders consume the seeded stock and the server now enforces it, so top it up for repeated runs
    test.beforeAll(async () => {
        await sql('UPDATE products SET stock = GREATEST(stock, 100)');
    });

    test.describe('Checkout Process', () => {

        test('TC_ORDER_001: Should complete checkout successfully', async ({ shopper }) => {
            const { name } = await fillCart(shopper);

            await shopper.cart.checkout();

            await expect(shopper.orders.heading).toBeVisible();
            await expect(shopper.orders.orders).toHaveCount(1);
            await expect(shopper.orders.expandedOrderBody()).toContainText(name);
            expect(shopper.dialogs.join(' ')).toContain('Order placed successfully');
        });

        test('TC_ORDER_002: Should show checkout button only when cart has items', async ({ shopper }) => {
            await shopper.cart.goto();

            await expect(shopper.cart.emptyHeading).toBeVisible();
            await expect(shopper.cart.checkoutButton).toHaveCount(0);
        });

        test('TC_ORDER_003: Should clear cart after successful checkout', async ({ shopper }) => {
            await fillCart(shopper);
            await shopper.cart.checkout();

            await shopper.nav.openCart();

            await expect(shopper.cart.emptyHeading).toBeVisible();
            await expect(shopper.nav.cartBadge).toHaveCount(0);
        });
    });

    test.describe('Order History', () => {

        test('TC_ORDER_004: Should display orders page', async ({ shopper }) => {
            await fillCart(shopper);
            await shopper.cart.checkout();

            await shopper.orders.goto();

            await expect(shopper.orders.heading).toBeVisible();
            await expect(shopper.orders.orders).toHaveCount(1);
        });

        test('TC_ORDER_005: Should show order details', async ({ shopper }) => {
            const { name, price } = await fillCart(shopper);
            await shopper.cart.checkout();

            const order = shopper.orders.orders.first();
            await expect(order).toContainText(/Order #\d+/);
            await expect(order).toContainText('PENDING');
            await expect(order).toContainText(`$${price.toFixed(2)}`);
            await expect(shopper.orders.expandedOrderBody()).toContainText(name);
        });
    });

    test.describe('Protected Routes', () => {

        test('TC_ORDER_006: Should redirect unauthenticated user to login', async ({ app }) => {
            await app.page.goto('/my-orders');

            await expect(app.page).toHaveURL('/login');
        });

        test('TC_ORDER_007: Should redirect unauthenticated user from cart to login on checkout attempt', async ({ app }) => {
            await app.page.goto('/cart');

            await expect(app.page).toHaveURL('/login');
        });
    });
});
