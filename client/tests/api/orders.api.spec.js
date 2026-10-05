/**
 * Order API tests: POST /orders, GET /orders/my-orders
 * Test Suite ID: TS_API_ORDER
 *
 * Every test that touches stock creates its own product through the admin API,
 * so assertions are exact and tests can run in parallel.
 */
import { test, expect, makeUser, makeProduct, sql } from './support.js';

const orderOf = (product, quantity, price = Number(product.price)) => ({
    totalAmount: Number((price * quantity).toFixed(2)),
    items: [{ productId: product.id, quantity, price }],
});

const stockOf = async (api, id) => (await (await api.get(`products/${id}`)).json()).stock;

test.describe('TS_API_ORDER: Orders API', () => {

    test('TC_API_ORDER_001: anonymous users cannot place or list orders', async ({ anon }) => {
        expect((await anon.post('orders', { data: { items: [{ productId: 1, quantity: 1, price: 1 }] } })).status()).toBe(401);
        expect((await anon.get('orders/my-orders')).status()).toBe(401);
    });

    test('TC_API_ORDER_002: an empty cart is rejected with 400', async ({ user }) => {
        for (const body of [{ items: [] }, {}]) {
            const res = await user.api.post('orders', { data: body });
            expect(res.status()).toBe(400);
            expect((await res.json()).message).toBe('Cart is empty');
        }
    });

    test('TC_API_ORDER_003: a valid order returns 201 with a pending order', async ({ user, admin }) => {
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            const res = await user.api.post('orders', { data: orderOf(product, 2) });

            expect(res.status()).toBe(201);
            const { order } = await res.json();
            expect(order).toMatchObject({ id: expect.any(Number), status: 'pending' });
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_004: the order is persisted and shown in order history with its line items', async ({ user, admin }) => {
        const product = await makeProduct(admin.api, { stock: 10, price: 25 });
        try {
            await user.api.post('orders', { data: orderOf(product, 3) });

            const orders = await (await user.api.get('orders/my-orders')).json();
            expect(orders).toHaveLength(1);
            expect(Number(orders[0].total_amount)).toBe(75);
            expect(orders[0].items).toEqual([
                expect.objectContaining({ product_id: product.id, quantity: 3, name: product.name }),
            ]);
            expect(Number(orders[0].items[0].price)).toBe(25);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_005: ordering reduces stock by exactly the ordered quantity', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            await user.api.post('orders', { data: orderOf(product, 4) });
            expect(await stockOf(anon, product.id)).toBe(6);

            await user.api.post('orders', { data: orderOf(product, 1) });
            expect(await stockOf(anon, product.id)).toBe(5);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_006: database rows match the order (order, items, price at purchase)', async ({ user, admin }) => {
        const product = await makeProduct(admin.api, { stock: 10, price: 19.99 });
        try {
            const { order } = await (await user.api.post('orders', { data: orderOf(product, 2) })).json();

            const [dbOrder] = await sql('SELECT user_id, total_amount, status FROM orders WHERE id = $1', [order.id]);
            expect(dbOrder).toMatchObject({ user_id: user.id, status: 'pending' });
            expect(Number(dbOrder.total_amount)).toBeCloseTo(39.98, 2);

            const items = await sql('SELECT product_id, quantity, price_at_purchase FROM order_items WHERE order_id = $1', [order.id]);
            expect(items).toHaveLength(1);
            expect(items[0]).toMatchObject({ product_id: product.id, quantity: 2 });
            expect(Number(items[0].price_at_purchase)).toBe(19.99);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_007: price at purchase is a snapshot and does not change when the product price changes', async ({ user, admin }) => {
        const product = await makeProduct(admin.api, { stock: 10, price: 20 });
        try {
            await user.api.post('orders', { data: orderOf(product, 1) });
            await admin.api.put(`products/${product.id}`, { data: { price: 99 } });

            const [order] = await (await user.api.get('orders/my-orders')).json();
            expect(Number(order.items[0].price)).toBe(20);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_008: a customer only sees their own orders', async ({ playwright, user, admin }) => {
        const other = await makeUser(playwright);
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            await user.api.post('orders', { data: orderOf(product, 1) });

            expect(await (await user.api.get('orders/my-orders')).json()).toHaveLength(1);
            expect(await (await other.api.get('orders/my-orders')).json()).toHaveLength(0);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
            await other.api.dispose();
        }
    });

    test('TC_API_ORDER_009: a failed multi-item order is rolled back completely (atomicity)', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            // Second line item references a product that does not exist
            const res = await user.api.post('orders', {
                data: {
                    totalAmount: 100,
                    items: [
                        { productId: product.id, quantity: 2, price: Number(product.price) },
                        { productId: 99999999, quantity: 1, price: 1 },
                    ],
                },
            });

            expect(res.ok()).toBe(false);
            expect(await (await user.api.get('orders/my-orders')).json()).toHaveLength(0);
            expect(await stockOf(anon, product.id)).toBe(10);

            const orphans = await sql('SELECT 1 FROM orders WHERE user_id = $1', [user.id]);
            expect(orphans).toHaveLength(0);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_010 [KNOWN DEFECT D1]: ordering more than the available stock should be rejected', async ({ user, admin, anon }) => {
        test.fail(true, 'D1: no stock check, the order succeeds and stock becomes negative');
        const product = await makeProduct(admin.api, { stock: 2 });
        try {
            const res = await user.api.post('orders', { data: orderOf(product, 5) });

            expect(res.status()).toBeGreaterThanOrEqual(400);
            expect(res.status()).toBeLessThan(500);
            expect(await stockOf(anon, product.id)).toBeGreaterThanOrEqual(0);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_011 [KNOWN DEFECT D2]: the server should price the order from the catalogue, not the client', async ({ user, admin }) => {
        test.fail(true, 'D2: price and totalAmount are taken from the request body');
        const product = await makeProduct(admin.api, { stock: 10, price: 100 });
        try {
            await user.api.post('orders', { data: orderOf(product, 1, 0.01) });

            const [order] = await (await user.api.get('orders/my-orders')).json();
            expect(Number(order.items[0].price)).toBe(100);
            expect(Number(order.total_amount)).toBe(100);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_012 [KNOWN DEFECT D6]: an unknown product should be a client error, not a 500', async ({ user }) => {
        test.fail(true, 'D6: the foreign key violation is returned as a generic 500');
        const res = await user.api.post('orders', {
            data: { totalAmount: 1, items: [{ productId: 99999999, quantity: 1, price: 1 }] },
        });
        expect(res.status()).toBeLessThan(500);
    });
});
