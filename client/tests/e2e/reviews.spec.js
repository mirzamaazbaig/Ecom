/**
 * Product Reviews E2E Tests
 * --------------------------
 * Test Suite ID: TS_REV
 */
import { test, expect, API_URL } from '../fixtures/test-fixtures.js';

const REVIEW_REQUIRES_LOGIN = 'Failed to submit review. You might need to login.';

/** Opens the details page of the first listed product. */
async function openFirstProduct(app) {
    await app.home.goto();
    const name = await app.home.firstProductName();
    await app.home.openDetails(name);
    return name;
}

const uniqueComment = label => `${label} ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

test.describe('TS_REV: Product Reviews Test Suite', () => {

    test.describe('View Reviews', () => {

        test('TC_REV_001: Should display reviews section on product page', async ({ app }) => {
            await openFirstProduct(app);

            await expect(app.product.reviewsHeading).toBeVisible();
            await expect(app.product.writeReviewHeading).toBeVisible();
        });

        test('TC_REV_002: Should display existing reviews, or say there are none', async ({ app, adminSession, playwright }) => {
            const api = adminSession.api;
            const createProduct = async name => (await (await api.post('products', {
                data: { name: `${name} ${Date.now()}`, price: 5, stock: 1, categoryId: 1 },
            })).json());
            const reviewed = await createProduct('Reviewed Product');
            const unreviewed = await createProduct('Unreviewed Product');
            const author = await playwright.request.newContext({ baseURL: `${API_URL}/` });
            try {
                const user = { email: `rev_${Date.now()}@example.com`, password: 'TestPass123!' };
                expect((await author.post('auth/register', { data: user })).status()).toBe(201);
                const comment = uniqueComment('Seeded review');
                expect((await author.post('reviews', { data: { product_id: reviewed.id, rating: 3, comment } })).status()).toBe(201);

                await app.product.goto(reviewed.id);
                await expect(app.product.reviewCards).toHaveCount(1);
                await expect(app.product.reviewCard(comment)).toContainText('★★★☆☆');
                await expect(app.product.noReviews).toHaveCount(0);

                await app.product.goto(unreviewed.id);
                await expect(app.product.noReviews).toBeVisible();
                await expect(app.product.reviewCards).toHaveCount(0);
            } finally {
                await api.delete(`products/${reviewed.id}`);
                await api.delete(`products/${unreviewed.id}`);
                await author.dispose();
            }
        });

        test('TC_REV_003: Should display review rating as stars', async ({ shopper }) => {
            await openFirstProduct(shopper);
            const comment = uniqueComment('Stars display');

            await shopper.product.submitReview({ rating: 5, comment });

            const card = shopper.product.reviewCard(comment);
            await expect(card).toBeVisible();
            await expect(card.locator('.text-warning')).toHaveText('★★★★★');
        });
    });

    test.describe('Submit Review', () => {

        test('TC_REV_004: Should submit a review successfully', async ({ shopper }) => {
            await openFirstProduct(shopper);
            const comment = uniqueComment('Submitted review');

            await shopper.product.submitReview({ rating: 4, comment });

            const card = shopper.product.reviewCard(comment);
            await expect(card).toBeVisible();
            await expect(card.locator('.text-warning')).toHaveText('★★★★☆');
            await expect(shopper.product.commentBox).toHaveValue('');
            expect(shopper.dialogs).toContain('Review submitted!');
        });

        test('TC_REV_005: Should allow selecting different ratings', async ({ shopper }) => {
            await openFirstProduct(shopper);

            for (const rating of ['5', '4', '3', '2', '1']) {
                await shopper.product.ratingSelect.selectOption(rating);
                await expect(shopper.product.ratingSelect).toHaveValue(rating);
            }
        });

        test('TC_REV_006: Should require comment text', async ({ shopper }) => {
            await openFirstProduct(shopper);
            const reviewRequests = [];
            shopper.page.on('request', r => {
                if (r.method() === 'POST' && r.url().endsWith('/reviews')) reviewRequests.push(r.url());
            });

            await shopper.product.submitReviewButton.click();

            // The browser blocks the submit and puts the cursor in the field that is missing
            await expect(shopper.product.commentBox).toBeFocused();
            expect(await shopper.product.commentBox.evaluate(el => el.validity.valueMissing)).toBe(true);
            expect(reviewRequests).toEqual([]);
            expect(shopper.dialogs).toEqual([]);
        });
    });

    test.describe('Review Form Validation', () => {

        test('TC_REV_007: Should show rating options from 1 to 5', async ({ app }) => {
            await openFirstProduct(app);

            // evaluateAll does not wait: read the options by polling until the form has rendered (WebKit is slower than Chromium here)
            await expect.poll(async () => {
                const values = await app.product.ratingSelect.locator('option').evaluateAll(options => options.map(o => o.value));
                return values.sort();
            }).toEqual(['1', '2', '3', '4', '5']);
        });

        test('TC_REV_008: Should default to 5-star rating', async ({ app }) => {
            await openFirstProduct(app);

            await expect(app.product.ratingSelect).toHaveValue('5');
        });
    });

    test.describe('Review Authentication', () => {

        test('TC_REV_009: Should show error when unauthenticated user tries to review', async ({ app }) => {
            await openFirstProduct(app);
            const comment = uniqueComment('Anonymous attempt');

            await app.product.submitReview({ rating: 4, comment });

            await expect.poll(() => app.dialogs).toContain(REVIEW_REQUIRES_LOGIN);
            await expect(app.product.reviewCard(comment)).toHaveCount(0);
        });
    });
});
