/**
 * Accessibility checks (WCAG 2.1 A and AA) with axe-core.
 * Test Suite ID: TS_A11Y
 *
 * Automated scanning finds only part of the accessibility problems (missing labels, contrast, names, roles).
 * It does not replace keyboard and screen reader testing; see docs/TEST_STRATEGY.md.
 */
import { test, expect } from '@playwright/test';
import { API_URL } from '../support/env.js';
import { expectNoA11yViolations } from './a11y-support.js';

/** Registers a user through the API and gives the browser that user's session. */
async function signIn(page, context, request) {
    const email = `a11y_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
    const res = await request.post(`${API_URL}/auth/register`, { data: { email, password: 'TestPass123!' } });
    expect(res.status()).toBe(201);
    await context.addCookies((await request.storageState()).cookies);
}

async function firstProductId(request) {
    const products = await (await request.get(`${API_URL}/products`)).json();
    return products[0].id;
}

test.describe('TS_A11Y: Accessibility (WCAG 2.1 A and AA)', () => {

    test.describe('Public pages', () => {

        test('TC_A11Y_001: home page and product list', async ({ page }) => {
            await page.goto('/');
            await expect(page.locator('.card').first()).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_002: login page', async ({ page }) => {
            await page.goto('/login');
            await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_003: login page with an error message', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#email', 'nobody@example.com');
            await page.fill('#password', 'wrong');
            await page.getByRole('button', { name: 'Login' }).click();
            await expect(page.locator('.alert-danger')).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_004: register page', async ({ page }) => {
            await page.goto('/register');
            await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_005: product details page', async ({ page, request }) => {
            await page.goto(`/products/${await firstProductId(request)}`);
            await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_006: search results with no match', async ({ page }) => {
            await page.goto('/');
            await page.fill('input[placeholder="Search products..."]', 'zzz-no-such-product');
            await page.click('.search-btn');
            await expect(page.getByText('No products found.')).toBeVisible();
            await expectNoA11yViolations(page);
        });
    });

    test.describe('Signed-in pages', () => {

        test('TC_A11Y_007: empty cart', async ({ page, context, request }) => {
            await signIn(page, context, request);
            await page.goto('/cart');
            await expect(page.getByRole('heading', { name: 'Your Cart is Empty' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_008: cart with an item', async ({ page, context, request }) => {
            await signIn(page, context, request);
            await page.goto('/');
            await page.locator('.card .btn-primary').first().click();
            // Wait for the cart badge so the item is stored before navigating away
            await expect(page.locator('a[href="/cart"] .badge')).toHaveText('1');
            await page.goto('/cart');
            await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_009: empty wishlist', async ({ page, context, request }) => {
            await signIn(page, context, request);
            await page.goto('/wishlist');
            await expect(page.getByRole('heading', { name: 'Your Wishlist is Empty' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_010: empty order history', async ({ page, context, request }) => {
            await signIn(page, context, request);
            await page.goto('/my-orders');
            await expect(page.getByRole('heading', { name: 'No orders found' })).toBeVisible();
            await expectNoA11yViolations(page);
        });

        test('TC_A11Y_011: profile page', async ({ page, context, request }) => {
            await signIn(page, context, request);
            await page.goto('/profile');
            await expect(page.locator('main, .container').first()).toBeVisible();
            await expectNoA11yViolations(page);
        });
    });
});
