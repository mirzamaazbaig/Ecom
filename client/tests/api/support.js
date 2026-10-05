/**
 * Shared fixtures and helpers for the API test suites.
 *
 * - `anon`   : request context with no session
 * - `user`   : a freshly registered, logged-in customer (own cookie jar)
 * - `admin`  : a freshly registered customer promoted to admin, then logged in again
 * - `makeUser`, `makeProduct`: factories for tests that need a second user or isolated data
 * - `db`     : direct SQL access for verifying persistence (needs DATABASE_URL)
 */
import { test as base, expect } from '@playwright/test';
import pg from 'pg';
import { API_URL } from '../support/env.js';

export { expect };

export const PASSWORD = 'TestPass123!';

export const uniqueEmail = (prefix = 'api') =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

/** Run a query against the application database. */
export async function sql(text, params = []) {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set; API tests need it for setup and persistence checks (see README).');
    }
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        return (await client.query(text, params)).rows;
    } finally {
        await client.end();
    }
}

async function newContext(playwright) {
    return playwright.request.newContext({ baseURL: `${API_URL}/` });
}

/** Register a user in a new session. Returns { api, id, email, password }. */
export async function makeUser(playwright, { admin = false } = {}) {
    const api = await newContext(playwright);
    const email = uniqueEmail(admin ? 'admin' : 'user');
    const res = await api.post('auth/register', { data: { email, password: PASSWORD } });
    expect(res.status(), 'registration in test setup').toBe(201);
    const { user } = await res.json();

    if (admin) {
        await sql("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
        // The role is stored in the session at login, so log in again
        const login = await api.post('auth/login', { data: { email, password: PASSWORD } });
        expect(login.status(), 'admin re-login in test setup').toBe(200);
    }
    return { api, id: user.id, email, password: PASSWORD };
}

/** Create an isolated product as an admin so stock/price assertions cannot collide with other tests. */
export async function makeProduct(adminApi, overrides = {}) {
    const data = {
        name: `QA Product ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        description: 'Created by the API test suite',
        price: 19.99,
        stock: 10,
        imageUrl: null,
        categoryId: 1,
        ...overrides,
    };
    const res = await adminApi.post('products', { data });
    expect(res.status(), 'product creation in test setup').toBe(201);
    return res.json();
}

export const test = base.extend({
    anon: async ({ playwright }, use) => {
        const api = await newContext(playwright);
        await use(api);
        await api.dispose();
    },
    user: async ({ playwright }, use) => {
        const user = await makeUser(playwright);
        await use(user);
        await user.api.dispose();
    },
    admin: async ({ playwright }, use) => {
        const admin = await makeUser(playwright, { admin: true });
        await use(admin);
        await admin.api.dispose();
    },
});
