/**
 * Wishlist and review API tests.
 * Test Suite ID: TS_API_WISH / TS_API_REV
 */
import { test, expect, makeUser, makeProduct, sql } from './support.js';

test.describe('TS_API_WISH: Wishlist API', () => {

    test('TC_API_WISH_001: anonymous users get 401', async ({ anon }) => {
        expect((await anon.get('wishlist')).status()).toBe(401);
        expect((await anon.post('wishlist', { data: { product_id: 1 } })).status()).toBe(401);
        expect((await anon.delete('wishlist/1')).status()).toBe(401);
    });

    test('TC_API_WISH_002: a new user has an empty wishlist', async ({ user }) => {
        const res = await user.api.get('wishlist');
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    test('TC_API_WISH_003: adding a product returns 201 and lists it with name and price', async ({ user }) => {
        const add = await user.api.post('wishlist', { data: { product_id: 1 } });
        expect(add.status()).toBe(201);

        const items = await (await user.api.get('wishlist')).json();
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ product_id: 1, name: expect.any(String), price: expect.any(String) });
    });

    test('TC_API_WISH_004: adding the same product twice is idempotent', async ({ user }) => {
        await user.api.post('wishlist', { data: { product_id: 1 } });
        const again = await user.api.post('wishlist', { data: { product_id: 1 } });

        expect(again.status()).toBe(200);
        expect((await again.json()).message).toBe('Item already in wishlist');
        expect(await (await user.api.get('wishlist')).json()).toHaveLength(1);
    });

    test('TC_API_WISH_005: removing a product empties the wishlist', async ({ user }) => {
        await user.api.post('wishlist', { data: { product_id: 1 } });

        const res = await user.api.delete('wishlist/1');
        expect(res.status()).toBe(200);
        expect(await (await user.api.get('wishlist')).json()).toEqual([]);
    });

    test('TC_API_WISH_006: wishlists are private to each user', async ({ playwright, user }) => {
        const other = await makeUser(playwright);
        try {
            await user.api.post('wishlist', { data: { product_id: 1 } });
            expect(await (await other.api.get('wishlist')).json()).toEqual([]);

            // Removing for the other user does not touch this user's item
            await other.api.delete('wishlist/1');
            expect(await (await user.api.get('wishlist')).json()).toHaveLength(1);
        } finally {
            await other.api.dispose();
        }
    });

    test('TC_API_WISH_007: wishlisting an unknown product returns 404 and stores nothing', async ({ user }) => {
        const res = await user.api.post('wishlist', { data: { product_id: 99999999 } });

        expect(res.status()).toBe(404);
        expect(await (await user.api.get('wishlist')).json()).toEqual([]);
    });

    test('TC_API_WISH_008: an invalid product id is rejected with 400', async ({ user }) => {
        for (const data of [{}, { product_id: 'abc' }, { product_id: -1 }, { product_id: 1.5 }]) {
            const res = await user.api.post('wishlist', { data });
            expect(res.status(), JSON.stringify(data)).toBe(400);
        }
        expect((await user.api.delete('wishlist/abc')).status()).toBe(400);
    });
});

test.describe('TS_API_REV: Reviews API', () => {

    test('TC_API_REV_001: reviews can be read without logging in', async ({ anon }) => {
        const res = await anon.get('reviews/1');
        expect(res.status()).toBe(200);
        expect(Array.isArray(await res.json())).toBe(true);
    });

    test('TC_API_REV_002: posting a review requires a session', async ({ anon }) => {
        const res = await anon.post('reviews', { data: { product_id: 1, rating: 5, comment: 'x' } });
        expect(res.status()).toBe(401);
    });

    test('TC_API_REV_003: a posted review is returned for the product with the author email', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api);
        try {
            const res = await user.api.post('reviews', { data: { product_id: product.id, rating: 4, comment: 'Solid' } });
            expect(res.status()).toBe(201);

            const reviews = await (await anon.get(`reviews/${product.id}`)).json();
            expect(reviews).toHaveLength(1);
            expect(reviews[0]).toMatchObject({ rating: 4, comment: 'Solid', email: user.email, user_id: user.id });
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_REV_004: average rating and review count on the product list reflect all reviews', async ({ playwright, user, admin, anon }) => {
        const second = await makeUser(playwright);
        const product = await makeProduct(admin.api);
        try {
            await user.api.post('reviews', { data: { product_id: product.id, rating: 5, comment: 'a' } });
            await second.api.post('reviews', { data: { product_id: product.id, rating: 2, comment: 'b' } });

            const list = await (await anon.get('products', { params: { search: product.name } })).json();
            expect(list).toHaveLength(1);
            expect(list[0].review_count).toBe(2);
            expect(list[0].avg_rating).toBeCloseTo(3.5, 5);
        } finally {
            await admin.api.delete(`products/${product.id}`);
            await second.api.dispose();
        }
    });

    test('TC_API_REV_005: ratings outside 1-5 are not stored', async ({ user, admin }) => {
        const product = await makeProduct(admin.api);
        try {
            for (const rating of [0, 6, -1]) {
                const res = await user.api.post('reviews', { data: { product_id: product.id, rating, comment: 'bad' } });
                expect(res.ok(), `rating ${rating}`).toBe(false);
            }
            const rows = await sql('SELECT 1 FROM reviews WHERE product_id = $1', [product.id]);
            expect(rows).toHaveLength(0);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_REV_006: an invalid rating is rejected with 400', async ({ user }) => {
        for (const rating of [99, 0, 6, -1, 4.5, '5', null, undefined]) {
            const res = await user.api.post('reviews', { data: { product_id: 1, rating, comment: 'x' } });
            expect(res.status(), `rating ${rating}`).toBe(400);
        }
    });

    test('TC_API_REV_007: reviewing an unknown product returns 404', async ({ user }) => {
        const res = await user.api.post('reviews', { data: { product_id: 99999999, rating: 5, comment: 'x' } });
        expect(res.status()).toBe(404);
    });

    test('TC_API_REV_008: an invalid product id is rejected with 400 when posting and when reading', async ({ user, anon }) => {
        expect((await user.api.post('reviews', { data: { product_id: 'abc', rating: 5 } })).status()).toBe(400);
        expect((await anon.get('reviews/abc')).status()).toBe(400);
    });
});
