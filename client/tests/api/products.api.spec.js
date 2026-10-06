/**
 * Product catalogue API tests: GET /products, GET /products/:id
 * Test Suite ID: TS_API_PROD
 * Relies on the seeded catalogue (8 products, 3 in Electronics).
 */
import { test, expect } from './support.js';

test.describe('TS_API_PROD: Product catalogue API', () => {

    test('TC_API_PROD_001: list returns products with the documented fields and types', async ({ anon }) => {
        const res = await anon.get('products');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');

        const products = await res.json();
        expect(products.length).toBeGreaterThan(0);
        for (const p of products) {
            expect(p).toMatchObject({
                id: expect.any(Number),
                name: expect.any(String),
                price: expect.stringMatching(/^\d+\.\d{2}$/), // DECIMAL is serialised as a string by pg
                stock: expect.any(Number),
                category_name: expect.any(String),
                avg_rating: expect.any(Number),
                review_count: expect.any(Number),
            });
        }
    });

    test('TC_API_PROD_002: limit restricts the number of results', async ({ anon }) => {
        const res = await anon.get('products', { params: { limit: 2 } });
        expect(res.status()).toBe(200);
        expect(await res.json()).toHaveLength(2);
    });

    test('TC_API_PROD_003: offset pages through results without overlap', async ({ anon }) => {
        const first = await (await anon.get('products', { params: { limit: 3, offset: 0, sort_by: 'name', order: 'ASC' } })).json();
        const second = await (await anon.get('products', { params: { limit: 3, offset: 3, sort_by: 'name', order: 'ASC' } })).json();

        expect(second.length).toBeGreaterThan(0);
        const firstIds = new Set(first.map(p => p.id));
        expect(second.some(p => firstIds.has(p.id))).toBe(false);
    });

    test('TC_API_PROD_004: category filter returns only that category', async ({ anon }) => {
        const products = await (await anon.get('products', { params: { category_id: 1 } })).json();
        expect(products.length).toBeGreaterThan(0);
        for (const p of products) {
            expect(p.category_id).toBe(1);
            expect(p.category_name).toBe('Electronics');
        }
    });

    test('TC_API_PROD_005: max_price filter excludes more expensive products', async ({ anon }) => {
        const products = await (await anon.get('products', { params: { max_price: 30 } })).json();
        expect(products.length).toBeGreaterThan(0);
        for (const p of products) {
            expect(Number(p.price)).toBeLessThanOrEqual(30);
        }
    });

    test('TC_API_PROD_006: sorting by price ascending and descending', async ({ anon }) => {
        const asc = (await (await anon.get('products', { params: { sort_by: 'price', order: 'ASC' } })).json()).map(p => Number(p.price));
        const desc = (await (await anon.get('products', { params: { sort_by: 'price', order: 'DESC' } })).json()).map(p => Number(p.price));

        expect(asc).toEqual([...asc].sort((a, b) => a - b));
        expect(desc).toEqual([...desc].sort((a, b) => b - a));
        expect(asc.length).toBeGreaterThan(1);
    });

    test('TC_API_PROD_007: search is case-insensitive and matches name or description', async ({ anon }) => {
        const products = await (await anon.get('products', { params: { search: 't-shirt' } })).json();
        expect(products.length).toBeGreaterThan(0);
        for (const p of products) {
            expect(`${p.name} ${p.description}`.toLowerCase()).toContain('t-shirt');
        }
    });

    test('TC_API_PROD_008: search with no match returns an empty list', async ({ anon }) => {
        const res = await anon.get('products', { params: { search: 'zzz-no-such-product-zzz' } });
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    test('TC_API_PROD_009: SQL metacharacters in search are treated as data', async ({ anon }) => {
        const res = await anon.get('products', { params: { search: "' OR 1=1; DROP TABLE products; --" } });
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([]);

        // Catalogue is intact
        expect((await (await anon.get('products')).json()).length).toBeGreaterThan(0);
    });

    test('TC_API_PROD_010: an unsupported sort_by value falls back safely instead of reaching SQL', async ({ anon }) => {
        const res = await anon.get('products', { params: { sort_by: 'password_hash; --' } });
        expect(res.status()).toBe(200);
        expect((await res.json()).length).toBeGreaterThan(0);
    });

    test('TC_API_PROD_011: get by id returns the same product as the list', async ({ anon }) => {
        const [fromList] = await (await anon.get('products', { params: { limit: 1 } })).json();
        const res = await anon.get(`products/${fromList.id}`);

        expect(res.status()).toBe(200);
        const product = await res.json();
        expect(product).toMatchObject({ id: fromList.id, name: fromList.name, price: fromList.price });
    });

    test('TC_API_PROD_012: unknown id returns 404 with a message', async ({ anon }) => {
        const res = await anon.get('products/99999999');
        expect(res.status()).toBe(404);
        expect((await res.json()).message).toBe('Product not found');
    });

    test('TC_API_PROD_013: a non-numeric or out-of-range id is a 400, not a server error', async ({ anon }) => {
        for (const id of ['abc', '1.5', '-1', '0', '99999999999', '1;DROP TABLE products']) {
            const res = await anon.get(`products/${encodeURIComponent(id)}`);
            expect(res.status(), `GET products/${id}`).toBe(400);
        }
    });

    test('TC_API_PROD_014: admin endpoints validate the id before touching the database', async ({ admin }) => {
        expect((await admin.api.put('products/abc', { data: { price: 1 } })).status()).toBe(400);
        expect((await admin.api.delete('products/abc')).status()).toBe(400);
    });
});
