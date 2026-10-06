/**
 * Admin Dashboard E2E Tests
 * --------------------------
 * Test Suite ID: TS_ADMIN
 * Data is created and cleaned up through the admin API; the dashboard is used for the behaviour under test.
 */
import { test, expect, API_URL, TestData } from '../fixtures/test-fixtures.js';
import { sql } from '../support/db.js';

const uniqueName = label => `${label} ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

async function createProduct(api, overrides = {}) {
    const res = await api.post('products', {
        data: { name: uniqueName('UI Admin Product'), description: 'Created by a UI test', price: 12.5, stock: 7, categoryId: 1, ...overrides },
    });
    expect(res.status(), 'product creation in test setup').toBe(201);
    return res.json();
}

test.describe('TS_ADMIN: Admin Dashboard Test Suite', () => {

    test.describe('Access', () => {

        test('TC_ADMIN_001: A customer is sent away from the dashboard', async ({ shopper }) => {
            await shopper.page.goto('/admin');

            await expect(shopper.page).toHaveURL('/');
            await expect(shopper.admin.heading).toHaveCount(0);
        });

        test('TC_ADMIN_002: An anonymous visitor is sent to the login page', async ({ app }) => {
            await app.page.goto('/admin');

            await expect(app.page).toHaveURL('/login');
        });

        test('TC_ADMIN_003: An admin sees the dashboard with every product', async ({ admin, request }) => {
            // Other tests create and delete products concurrently, so check the permanent catalogue products
            const catalogue = (await (await request.get(`${API_URL}/products?limit=100`)).json())
                .filter(p => !p.name.startsWith('UI ') && !p.name.startsWith('QA Product') && !p.name.startsWith('No Reviews'));
            expect(catalogue.length).toBeGreaterThan(0);

            await admin.admin.goto();

            for (const product of catalogue) {
                const row = admin.admin.row(product.name);
                await expect(row).toBeVisible();
                await expect(row).toContainText(`$${product.price}`);
            }
        });
    });

    test.describe('Product management', () => {

        test('TC_ADMIN_004: Adding a product through the form lists it and stores it', async ({ admin, request }) => {
            const name = uniqueName('UI Added Product');
            await admin.admin.goto();
            await admin.admin.openAddForm();

            await admin.admin.fillProduct({ name, price: 12.5, description: 'Added in a UI test', stock: 9 });
            await admin.admin.save();

            const row = admin.admin.row(name);
            await expect(row).toBeVisible();
            await expect(row).toContainText('$12.50');
            await expect(row).toContainText('9');
            await expect(admin.admin.addProductButton).toBeVisible();   // form closed

            const stored = await (await request.get(`${API_URL}/products?search=${encodeURIComponent(name)}`)).json();
            try {
                expect(stored).toHaveLength(1);
                expect(stored[0]).toMatchObject({ name, price: '12.50', stock: 9 });
            } finally {
                for (const p of stored) await admin.api.delete(`products/${p.id}`);
            }
        });

        test('TC_ADMIN_005: Editing a product changes its price everywhere', async ({ admin, request }) => {
            const product = await createProduct(admin.api);
            try {
                await admin.admin.goto();
                await admin.admin.edit(product.name);
                await expect(admin.admin.nameField).toHaveValue(product.name);

                await admin.admin.priceField.fill('33.30');
                await admin.admin.save();

                await expect(admin.admin.row(product.name)).toContainText('$33.30');
                const stored = await (await request.get(`${API_URL}/products/${product.id}`)).json();
                expect(stored.price).toBe('33.30');
            } finally {
                await admin.api.delete(`products/${product.id}`);
            }
        });

        test('TC_ADMIN_006: Deleting a product removes it from the list and the catalogue', async ({ admin, request }) => {
            const product = await createProduct(admin.api);
            await admin.admin.goto();
            await expect(admin.admin.row(product.name)).toBeVisible();

            await admin.admin.remove(product.name);

            await expect(admin.admin.row(product.name)).toHaveCount(0);
            expect(admin.dialogs).toContain('Are you sure you want to delete this product?');
            expect((await request.get(`${API_URL}/products/${product.id}`)).status()).toBe(404);
        });

        test('TC_ADMIN_007: The form refuses a product without a name or price', async ({ admin }) => {
            const productRequests = [];
            admin.page.on('request', r => {
                if (r.method() === 'POST' && r.url().endsWith('/products')) productRequests.push(r.url());
            });
            await admin.admin.goto();
            await admin.admin.openAddForm();

            await admin.admin.save();

            // The browser blocks the submit and puts the cursor in the first missing field
            await expect(admin.admin.nameField).toBeFocused();
            expect(await admin.admin.nameField.evaluate(el => el.validity.valueMissing)).toBe(true);
            await expect(admin.admin.formTitle).toHaveText('Add New Product');
            expect(productRequests).toEqual([]);
        });

        test('TC_ADMIN_008: Cancel closes the form without saving', async ({ admin }) => {
            const name = uniqueName('Never saved');
            const productRequests = [];
            admin.page.on('request', r => {
                if (r.method() === 'POST' && r.url().endsWith('/products')) productRequests.push(r.url());
            });
            await admin.admin.goto();
            await admin.admin.openAddForm();
            await admin.admin.nameField.fill(name);

            await admin.admin.cancelButton.click();

            await expect(admin.admin.addProductButton).toBeVisible();
            await expect(admin.admin.row(name)).toHaveCount(0);
            expect(productRequests).toEqual([]);
        });
    });

    test.describe('Orders tab', () => {

        test('TC_ADMIN_009: Orders placed by customers are listed with the customer and total', async ({ admin, playwright }) => {
            const product = await createProduct(admin.api, { price: 20, stock: 5 });
            const customer = await playwright.request.newContext({ baseURL: `${API_URL}/` });
            const user = TestData.generateUser();
            try {
                expect((await customer.post('auth/register', { data: user })).status()).toBe(201);
                const order = await customer.post('orders', { data: { items: [{ productId: product.id, quantity: 2 }] } });
                expect(order.status()).toBe(201);
                const orderId = (await order.json()).order.id;

                await admin.admin.goto();
                await admin.admin.openOrdersTab();

                const row = admin.admin.row(user.email);
                await expect(row).toBeVisible();
                await expect(row).toContainText(`${orderId}`);
                await expect(row).toContainText('$40.00');
                await expect(row).toContainText('pending');
            } finally {
                await sql('DELETE FROM order_items WHERE product_id = $1', [product.id]);
                await admin.api.delete(`products/${product.id}`);
                await customer.dispose();
            }
        });
    });
});
