/**
 * Product Browsing E2E Tests
 * ---------------------------
 * Test Suite ID: TS_PROD
 * What the page shows is checked against what the API returns where that gives a stronger assertion.
 */
import { test, expect, API_URL } from '../fixtures/test-fixtures.js';

const PRICE_FORMAT = /^\$\d+\.\d{2}$/;

test.describe('TS_PROD: Product Browsing Test Suite', () => {

    test.describe('Home Page & Product Listing', () => {

        test('TC_PROD_001: Should display home page with products', async ({ app }) => {
            await app.home.goto();

            const firstCard = app.home.cards.first();
            await expect(firstCard.locator('.card-title')).toBeVisible();
            await expect(firstCard.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
            await expect(firstCard.getByRole('link', { name: 'View Details' })).toBeVisible();
        });

        test('TC_PROD_002: Should display product prices correctly', async ({ app }) => {
            await app.home.goto();

            const prices = await app.home.prices.allInnerTexts();
            expect(prices.length).toBeGreaterThan(0);
            for (const price of prices) {
                expect(price).toMatch(PRICE_FORMAT);
            }
        });

        test('TC_PROD_003: Should display product ratings', async ({ app }) => {
            await app.home.goto();

            const ratings = await app.home.ratings.allInnerTexts();
            expect(ratings.length).toBe(await app.home.cards.count());
            for (const rating of ratings) {
                expect(rating).toMatch(/^[★☆]{5}$/);
            }
        });
    });

    test.describe('Product Details Navigation', () => {

        test('TC_PROD_004: Should navigate to product details via View Details button', async ({ app }) => {
            await app.home.goto();
            const name = await app.home.seededProductName();

            await app.home.openDetails(name);

            await expect(app.product.name).toHaveText(name);
            await app.product.expectLoaded();
            await expect(app.product.wishlistButton).toBeVisible();
        });

        test('TC_PROD_005: Should navigate to product details via product name link', async ({ app }) => {
            await app.home.goto();
            const name = await app.home.seededProductName();

            await app.home.openDetailsViaTitle(name);

            await expect(app.product.name).toHaveText(name);
            await app.product.expectLoaded();
        });

        test('TC_PROD_006: Should display product details correctly', async ({ app }) => {
            await app.home.goto();
            const name = await app.home.seededProductName();
            const price = await app.home.priceOf(name);

            await app.home.openDetails(name);

            await expect(app.product.name).toHaveText(name);
            expect(await app.product.priceValue()).toBe(price);
            await expect(app.page.getByText('Category:')).toBeVisible();
            await expect(app.page.getByText('Stock:')).toBeVisible();
            await expect(app.product.reviewsHeading).toBeVisible();
        });
    });

    test.describe('Category Filtering', () => {

        test('TC_PROD_007: Should filter products by category', async ({ app, request }) => {
            await app.home.goto();
            const totalCount = await app.home.cards.count();

            // Ground truth from the API (category 1 = Electronics)
            const expected = await (await request.get(`${API_URL}/products?category_id=1`)).json();
            expect(expected.length).toBeGreaterThan(0);
            expect(expected.length).toBeLessThan(totalCount);

            await app.home.filterByCategory('Electronics');

            await expect(app.home.cards).toHaveCount(expected.length);
            expect([...(await app.home.productNames())].sort()).toEqual(expected.map(p => p.name).sort());
        });

        test('TC_PROD_008: Should show all products when selecting All Departments', async ({ app }) => {
            await app.home.goto();
            const totalCount = await app.home.cards.count();

            await app.home.filterByCategory('Electronics');
            await expect(app.home.cards).not.toHaveCount(totalCount);

            await app.home.filterByCategory('All Departments');
            await expect(app.home.cards).toHaveCount(totalCount);
        });
    });

    test.describe('Product Sorting', () => {

        test('TC_PROD_009: Should sort products by price low to high', async ({ app }) => {
            await app.home.goto();

            await app.home.sortBy('Price: Low to High');

            // Poll until the re-fetched list is in ascending order (no fixed sleeps)
            await expect.poll(async () => {
                const prices = (await app.home.prices.allInnerTexts()).map(t => parseFloat(t.replace('$', '')));
                return prices.length > 1 && prices.every((v, i) => i === 0 || prices[i - 1] <= v);
            }).toBe(true);
        });

        test('TC_PROD_010: Should request newest arrivals and keep all products listed', async ({ app }) => {
            await app.home.goto();
            const totalCount = await app.home.cards.count();

            // Seeded products share one created_at, so order cannot be asserted;
            // verify the right query is sent and nothing is lost.
            const [response] = await Promise.all([
                app.page.waitForResponse(r => r.url().includes('sort_by=created_at')),
                app.home.sortBy('Newest Arrivals'),
            ]);
            expect(response.ok()).toBe(true);
            await expect(app.home.cards).toHaveCount(totalCount);
        });
    });

    test.describe('Product Search', () => {

        test('TC_PROD_011: Should search for products and display results', async ({ app }) => {
            await app.home.goto();

            await app.nav.search('T-Shirt');

            await expect(app.home.resultsHeading).toHaveText('Results for "T-Shirt"');
        });

        test('TC_PROD_012: Should show matching products in search results', async ({ app }) => {
            await app.home.goto();

            await app.nav.search('T-Shirt');

            // The old cards stay on screen until the filtered list arrives, so wait for it instead of reading at once
            await expect.poll(async () => {
                const names = await app.home.productNames();
                return names.length > 0 && names.every(name => name.toLowerCase().includes('shirt'));
            }).toBe(true);
        });

        test('TC_PROD_013: Should handle empty search results gracefully', async ({ app }) => {
            await app.home.goto();

            await app.nav.search('XyzNonexistentProduct12345');

            await expect(app.home.noProducts).toBeVisible();
            await expect(app.home.cards).toHaveCount(0);
        });
    });

    test.describe('Product without an image', () => {

        test('TC_PROD_014: The details page of a product without an image does not load an image from an outside website', async ({ app, adminSession }) => {
            const api = adminSession.api;
            const product = await (await api.post('products', {
                data: { name: `No Image ${Date.now()}`, price: 5, stock: 1, categoryId: 1 },
            })).json();
            try {
                const appHost = new URL(app.page.url() === 'about:blank' ? 'http://localhost:5173' : app.page.url()).host;
                const outsideImages = [];
                app.page.on('request', request => {
                    const { host, protocol } = new URL(request.url());
                    if (request.resourceType() === 'image' && protocol.startsWith('http') && host !== appHost && host !== new URL(API_URL).host) {
                        outsideImages.push(request.url());
                    }
                });

                await app.product.goto(product.id);

                // A missing image used to be replaced by one fetched from via.placeholder.com; when that site was slow the page never finished loading
                await expect(app.page.locator('img.card-img-top')).toHaveAttribute('src', /^data:image\//);
                expect(outsideImages).toEqual([]);
            } finally {
                await api.delete(`products/${product.id}`);
            }
        });
    });
});
