/**
 * Wishlist E2E Tests
 * -------------------
 * Test Suite ID: TS_WISH
 */
import { test, expect } from '../fixtures/test-fixtures.js';

/** Opens the first listed product, wishlists it and returns its name. */
async function wishlistFirstProduct(shopper) {
    await shopper.home.goto();
    const name = await shopper.home.firstProductName();
    await shopper.home.openDetails(name);
    await shopper.product.addToWishlist();
    await expect.poll(() => shopper.dialogs).toContain('Added to Wishlist!');
    return name;
}

test.describe('TS_WISH: Wishlist Test Suite', () => {

    test.describe('Add to Wishlist', () => {

        test('TC_WISH_001: Should add product to wishlist from product details', async ({ shopper }) => {
            const name = await wishlistFirstProduct(shopper);

            await shopper.nav.openWishlist();

            await expect(shopper.wishlist.titles).toHaveText([name]);
        });
    });

    test.describe('View Wishlist', () => {

        test('TC_WISH_002: Should display wishlist page correctly', async ({ shopper }) => {
            const name = await wishlistFirstProduct(shopper);
            await shopper.nav.openWishlist();

            await expect(shopper.wishlist.heading).toBeVisible();
            const card = shopper.wishlist.card(name);
            await expect(card).toBeVisible();
            await expect(card.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
            await expect(card.getByRole('button', { name: 'Remove from Wishlist' })).toBeVisible();
        });

        test('TC_WISH_003: Should show empty wishlist message', async ({ shopper }) => {
            await shopper.wishlist.goto();

            // A freshly registered user has no wishlist items
            await expect(shopper.wishlist.emptyHeading).toBeVisible();
            await expect(shopper.wishlist.cards).toHaveCount(0);
        });
    });

    test.describe('Wishlist Actions', () => {

        test('TC_WISH_004: Should add wishlist item to cart', async ({ shopper }) => {
            const name = await wishlistFirstProduct(shopper);
            await shopper.nav.openWishlist();
            await expect(shopper.wishlist.titles).toHaveText([name]);

            await shopper.wishlist.addToCart(name);
            await shopper.nav.expectCartCount(1);
            await shopper.nav.openCart();

            await expect(shopper.cart.itemNames).toHaveText([name]);
        });

        test('TC_WISH_005: Should remove item from wishlist', async ({ shopper }) => {
            const name = await wishlistFirstProduct(shopper);
            await shopper.nav.openWishlist();
            await expect(shopper.wishlist.cards).toHaveCount(1);

            await shopper.wishlist.remove(name);

            await expect(shopper.wishlist.emptyHeading).toBeVisible();
            await expect(shopper.wishlist.cards).toHaveCount(0);
        });
    });

    test.describe('Wishlist Navigation', () => {

        test('TC_WISH_006: Should navigate to product from wishlist', async ({ shopper }) => {
            const name = await wishlistFirstProduct(shopper);
            await shopper.nav.openWishlist();

            await shopper.wishlist.openProduct(name);

            await expect(shopper.product.name).toHaveText(name);
            await shopper.product.expectLoaded();
        });
    });
});
