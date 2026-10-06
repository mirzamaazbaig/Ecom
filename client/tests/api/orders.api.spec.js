/**
 * Order API tests: POST /orders, GET /orders/my-orders
 * Test Suite ID: TS_API_ORDER
 *
 * Stock is checked and prices are set on the server (defects D1 and D2, now fixed;
 * see docs/KNOWN_DEFECTS.md). Every test that touches stock creates its own product through the admin API,
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

    test('TC_API_ORDER_009: a multi-item order with one unavailable line is rejected as a whole (all or nothing)', async ({ user, admin, anon }) => {
        const plenty = await makeProduct(admin.api, { stock: 10 });
        const scarce = await makeProduct(admin.api, { stock: 1 });
        try {
            const res = await user.api.post('orders', {
                data: { items: [{ productId: plenty.id, quantity: 2 }, { productId: scarce.id, quantity: 2 }] },
            });

            expect(res.status()).toBe(409);
            expect((await res.json()).message).toContain('Insufficient stock');
            expect(await (await user.api.get('orders/my-orders')).json()).toHaveLength(0);
            expect(await stockOf(anon, plenty.id)).toBe(10);
            expect(await stockOf(anon, scarce.id)).toBe(1);
            expect(await sql('SELECT 1 FROM orders WHERE user_id = $1', [user.id])).toHaveLength(0);
        } finally {
            await admin.api.delete(`products/${plenty.id}`);
            await admin.api.delete(`products/${scarce.id}`);
        }
    });

    test('TC_API_ORDER_010: ordering more than the available stock is rejected with 409 and changes nothing', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 2 });
        try {
            const res = await user.api.post('orders', { data: orderOf(product, 5) });

            expect(res.status()).toBe(409);
            expect((await res.json()).message).toContain('Insufficient stock');
            expect(await stockOf(anon, product.id)).toBe(2);
            expect(await (await user.api.get('orders/my-orders')).json()).toHaveLength(0);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_011: ordering exactly the remaining stock succeeds and leaves zero (boundary)', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 3 });
        try {
            expect((await user.api.post('orders', { data: orderOf(product, 3) })).status()).toBe(201);
            expect(await stockOf(anon, product.id)).toBe(0);

            // One more is now too many
            expect((await user.api.post('orders', { data: orderOf(product, 1) })).status()).toBe(409);
            expect(await stockOf(anon, product.id)).toBe(0);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_012: the server prices the order from the catalogue, ignoring client prices and totals', async ({ user, admin }) => {
        const product = await makeProduct(admin.api, { stock: 10, price: 100 });
        try {
            const res = await user.api.post('orders', { data: orderOf(product, 2, 0.01) });
            expect(res.status()).toBe(201);
            expect(Number((await res.json()).order.total_amount)).toBe(200);

            const [order] = await (await user.api.get('orders/my-orders')).json();
            expect(Number(order.items[0].price)).toBe(100);
            expect(Number(order.total_amount)).toBe(200);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_013: an unknown product is rejected with 404 and nothing is written', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            const res = await user.api.post('orders', {
                data: { items: [{ productId: product.id, quantity: 1 }, { productId: 99999999, quantity: 1 }] },
            });

            expect(res.status()).toBe(404);
            expect(await (await user.api.get('orders/my-orders')).json()).toHaveLength(0);
            expect(await stockOf(anon, product.id)).toBe(10);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_014: invalid quantities and product ids are rejected with 400', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 10 });
        try {
            const invalidLines = [
                { productId: product.id, quantity: 0 },
                { productId: product.id, quantity: -2 },
                { productId: product.id, quantity: 1.5 },
                { productId: product.id, quantity: 'two' },
                { productId: product.id },
                { productId: 'abc', quantity: 1 },
                { productId: 99999999999, quantity: 1 },
                { quantity: 1 },
            ];
            for (const line of invalidLines) {
                const res = await user.api.post('orders', { data: { items: [line] } });
                expect(res.status(), JSON.stringify(line)).toBe(400);
            }
            expect(await stockOf(anon, product.id)).toBe(10);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_015: duplicate lines for one product are combined before the stock check', async ({ user, admin, anon }) => {
        const product = await makeProduct(admin.api, { stock: 3 });
        try {
            const res = await user.api.post('orders', {
                data: { items: [{ productId: product.id, quantity: 2 }, { productId: product.id, quantity: 2 }] },
            });
            expect(res.status()).toBe(409);
            expect(await stockOf(anon, product.id)).toBe(3);
        } finally {
            await admin.api.delete(`products/${product.id}`);
        }
    });

    test('TC_API_ORDER_016: concurrent orders cannot oversell the last unit', async ({ playwright, user, admin, anon }) => {
        const other = await makeUser(playwright);
        const product = await makeProduct(admin.api, { stock: 1 });
        try {
            const results = await Promise.all([
                user.api.post('orders', { data: orderOf(product, 1) }),
                other.api.post('orders', { data: orderOf(product, 1) }),
            ]);

            expect(results.map(r => r.status()).sort()).toEqual([201, 409]);
            expect(await stockOf(anon, product.id)).toBe(0);
        } finally {
            await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
            await admin.api.delete(`products/${product.id}`);
            await other.api.dispose();
        }
    });
});
