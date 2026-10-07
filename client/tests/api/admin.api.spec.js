/**
 * Authorisation and admin product management.
 * Test Suite ID: TS_API_ADMIN
 * Covers role-based access control on write endpoints and the product CRUD lifecycle.
 */
import { test, expect, makeProduct, sql } from './support.js';

test.describe('TS_API_ADMIN: Role-based access and product management', () => {

    test.describe('Access control', () => {

        test('TC_API_ADMIN_001: anonymous requests to admin endpoints return 401', async ({ anon }) => {
            expect((await anon.post('products', { data: { name: 'x', price: 1 } })).status()).toBe(401);
            expect((await anon.put('products/1', { data: { price: 1 } })).status()).toBe(401);
            expect((await anon.delete('products/1')).status()).toBe(401);
            expect((await anon.get('orders')).status()).toBe(401);
        });

        test('TC_API_ADMIN_002: a customer gets 403 on admin endpoints', async ({ user }) => {
            expect((await user.api.post('products', { data: { name: 'x', price: 1 } })).status()).toBe(403);
            expect((await user.api.put('products/1', { data: { price: 1 } })).status()).toBe(403);
            expect((await user.api.delete('products/1')).status()).toBe(403);
            expect((await user.api.get('orders')).status()).toBe(403);
        });

        test('TC_API_ADMIN_003: a customer cannot change a product even if the id exists', async ({ user, anon }) => {
            const before = await (await anon.get('products/1')).json();
            await user.api.put('products/1', { data: { price: 0.01 } });
            const after = await (await anon.get('products/1')).json();
            expect(after.price).toBe(before.price);
        });

        test('TC_API_ADMIN_004: admin can list all orders', async ({ admin }) => {
            const res = await admin.api.get('orders');
            expect(res.status()).toBe(200);
            expect(Array.isArray(await res.json())).toBe(true);
        });
    });

    test.describe('Product lifecycle', () => {

        test('TC_API_ADMIN_005: admin creates a product that is then visible to everyone', async ({ admin, anon }) => {
            const created = await makeProduct(admin.api, { name: `Lifecycle ${Date.now()}`, price: 42.5, stock: 7 });
            try {
                expect(created).toMatchObject({ price: '42.50', stock: 7, category_id: 1 });

                const fetched = await anon.get(`products/${created.id}`);
                expect(fetched.status()).toBe(200);
                expect((await fetched.json()).name).toBe(created.name);
            } finally {
                await admin.api.delete(`products/${created.id}`);
            }
        });

        test('TC_API_ADMIN_006: admin updates only the supplied fields', async ({ admin, anon }) => {
            const created = await makeProduct(admin.api, { price: 10, stock: 5 });
            try {
                const res = await admin.api.put(`products/${created.id}`, { data: { price: 12.34 } });
                expect(res.status()).toBe(200);

                const product = await (await anon.get(`products/${created.id}`)).json();
                expect(product.price).toBe('12.34');
                expect(product.name).toBe(created.name);   // untouched
                expect(product.stock).toBe(5);             // untouched
            } finally {
                await admin.api.delete(`products/${created.id}`);
            }
        });

        test('TC_API_ADMIN_007: admin deletes a product and it is gone', async ({ admin, anon }) => {
            const created = await makeProduct(admin.api);

            const res = await admin.api.delete(`products/${created.id}`);
            expect(res.status()).toBe(200);
            expect((await anon.get(`products/${created.id}`)).status()).toBe(404);
        });

        test('TC_API_ADMIN_008: updating or deleting an unknown product returns 404', async ({ admin }) => {
            expect((await admin.api.put('products/99999999', { data: { price: 1 } })).status()).toBe(404);
            expect((await admin.api.delete('products/99999999')).status()).toBe(404);
        });

        test('TC_API_ADMIN_009: a product that customers have ordered cannot be deleted (409, not a server error)', async ({ admin, user, anon }) => {
            const product = await makeProduct(admin.api, { stock: 5 });
            try {
                const order = await user.api.post('orders', { data: { items: [{ productId: product.id, quantity: 1, price: 1 }] } });
                expect(order.status()).toBe(201);

                const res = await admin.api.delete(`products/${product.id}`);

                expect(res.status()).toBe(409);
                expect((await res.json()).message).toBe('Product has been ordered and cannot be deleted');
                expect((await anon.get(`products/${product.id}`)).status()).toBe(200);
            } finally {
                await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
                await admin.api.delete(`products/${product.id}`);
            }
        });
    });
});
