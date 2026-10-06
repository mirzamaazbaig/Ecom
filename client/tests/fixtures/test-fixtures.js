/**
 * Fixtures for the UI tests.
 *
 *   app      an anonymous visitor: every page object bound to the test's browser page
 *   shopper  a registered customer who is already signed in (created through the API)
 *   admin    an administrator who is already signed in, plus an API client (`admin.api`) with the same session
 *   adminSession  just the administrator's API client, for creating test data while the browser is anonymous
 *
 * Signing in through the API and handing the session cookie to the browser keeps tests that are not about
 * authentication independent of the login screens, which have their own suite (TS_AUTH).
 */
import { test as base, expect } from '@playwright/test';
import { API_URL } from '../support/env.js';
import { sql } from '../support/db.js';
import { App } from '../pages/index.js';

export { expect, API_URL };

const PASSWORD = 'TestPass123!';

export const TestData = {
    /** Unique credentials, so tests never depend on each other's accounts. */
    generateUser: () => ({
        email: `test_user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
        password: PASSWORD,
    }),
};

/** Registers a user through the API. With `admin`, promotes the account and logs in again to refresh the session role. */
async function createUser(playwright, { admin = false } = {}) {
    const api = await playwright.request.newContext({ baseURL: `${API_URL}/` });
    const user = TestData.generateUser();

    const registered = await api.post('auth/register', { data: user });
    expect(registered.status(), 'user registration in test setup').toBe(201);
    user.id = (await registered.json()).user.id;

    if (admin) {
        await sql("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
        // The role lives in the session, so sign in again to get an admin session
        const login = await api.post('auth/login', { data: user });
        expect(login.status(), 'admin login in test setup').toBe(200);
    }
    return { api, user };
}

async function signInBrowser(context, api) {
    await context.addCookies((await api.storageState()).cookies);
}

export const test = base.extend({
    app: async ({ page }, use) => {
        await use(new App(page));
    },

    shopper: async ({ page, context, playwright }, use) => {
        const { api, user } = await createUser(playwright);
        await signInBrowser(context, api);
        const app = new App(page);
        app.user = user;
        await use(app);
        await api.dispose();
    },

    adminSession: async ({ playwright }, use) => {
        const { api, user } = await createUser(playwright, { admin: true });
        await use({ api, user });
        await api.dispose();
    },

    admin: async ({ page, context, playwright }, use) => {
        const { api, user } = await createUser(playwright, { admin: true });
        await signInBrowser(context, api);
        const app = new App(page);
        app.user = user;
        app.api = api;
        await use(app);
        await api.dispose();
    },
});
