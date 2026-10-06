/**
 * Authentication E2E Tests
 * -------------------------
 * Test Suite ID: TS_AUTH
 * The only suite that goes through the login and registration screens on purpose; every other suite signs in
 * through the API (see fixtures/test-fixtures.js).
 */
import { test, expect, API_URL, TestData } from '../fixtures/test-fixtures.js';

test.describe('TS_AUTH: Authentication Test Suite', () => {

    test.describe('User Registration', () => {

        test('TC_AUTH_001: Should successfully register a new user', async ({ app }) => {
            await app.register.goto();
            await app.register.register(TestData.generateUser());

            await expect(app.page).toHaveURL('/');
            await app.nav.expectLoggedIn();
        });

        test('TC_AUTH_002: Should show error for mismatched passwords', async ({ app }) => {
            await app.register.goto();
            await app.register.register(TestData.generateUser(), 'DifferentPassword123');

            await expect(app.register.error).toHaveText('Passwords do not match');
            await expect(app.page).toHaveURL('/register');
        });

        test('TC_AUTH_003: Should prevent duplicate email registration', async ({ app, request }) => {
            const user = TestData.generateUser();
            const existing = await request.post(`${API_URL}/auth/register`, { data: user });
            expect(existing.status()).toBe(201);

            await app.register.goto();
            await app.register.register(user);

            await expect(app.register.error).toHaveText('User already exists');
            await expect(app.page).toHaveURL('/register');
        });
    });

    test.describe('User Login', () => {

        test('TC_AUTH_004: Should login successfully with valid credentials', async ({ app, request }) => {
            const user = TestData.generateUser();
            expect((await request.post(`${API_URL}/auth/register`, { data: user })).status()).toBe(201);

            await app.login.goto();
            await app.login.login(user);

            await expect(app.page).toHaveURL('/');
            await app.nav.expectLoggedIn();
        });

        test('TC_AUTH_005: Should show error for invalid credentials', async ({ app }) => {
            await app.login.goto();
            await app.login.login({ email: 'nonexistent@example.com', password: 'WrongPassword123' });

            await expect(app.login.error).toHaveText('Invalid credentials');
            await expect(app.page).toHaveURL('/login');
            await app.nav.expectLoggedOut();
        });
    });

    test.describe('User Logout', () => {

        test('TC_AUTH_006: Should logout successfully', async ({ shopper }) => {
            await shopper.home.goto();
            await shopper.nav.expectLoggedIn();

            await shopper.nav.logout();

            await shopper.nav.expectLoggedOut();
        });
    });

    test.describe('Session Persistence', () => {

        test('TC_AUTH_007: Should maintain session after page refresh', async ({ shopper }) => {
            await shopper.home.goto();
            await shopper.nav.expectLoggedIn();

            await shopper.page.reload();

            await shopper.nav.expectLoggedIn();
        });
    });
});
