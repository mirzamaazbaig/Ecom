/**
 * Authentication E2E Tests
 * -------------------------
 * Test Suite ID: TS_AUTH
 * Following ISTQB TAE Guidelines:
 * - Clear test case naming convention (TC_AUTH_XXX)
 * - Independent test execution
 * - Proper setup and teardown
 * - Comprehensive coverage of authentication flows
 */

import { test, expect, TestData, TestAssertions, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_AUTH: Authentication Test Suite', () => {

    test.describe('User Registration', () => {

        test('TC_AUTH_001: Should successfully register a new user', async ({ page }) => {
            // Test Data
            const user = TestData.generateUser();

            // Preconditions: Navigate to registration page
            await page.goto('/register');
            await expect(page.locator('h2:has-text("Register")')).toBeVisible();

            // Test Actions
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.fill('#confirmPassword', user.password);
            await page.click('button:has-text("Register")');

            // Expected Results: User is redirected to home and logged in
            await expect(page).toHaveURL('/', { timeout: 10000 });
            await TestAssertions.assertLoggedIn(page);
        });

        test('TC_AUTH_002: Should show error for mismatched passwords', async ({ page }) => {
            const user = TestData.generateUser();

            await page.goto('/register');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.fill('#confirmPassword', 'DifferentPassword123');
            await page.click('button:has-text("Register")');

            // Should show error and stay on register page
            await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 5000 });
            await expect(page).toHaveURL('/register');
        });

        test('TC_AUTH_003: Should prevent duplicate email registration', async ({ page }) => {
            const user = TestData.generateUser();

            // First registration
            await page.goto('/register');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.fill('#confirmPassword', user.password);
            await page.click('button:has-text("Register")');
            await expect(page).toHaveURL('/', { timeout: 10000 });

            // Logout
            await PageActions.logout(page);

            // Attempt second registration with same email
            await page.goto('/register');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.fill('#confirmPassword', user.password);
            await page.click('button:has-text("Register")');

            // Should show error
            await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('User Login', () => {

        test('TC_AUTH_004: Should login successfully with valid credentials', async ({ page }) => {
            const user = TestData.generateUser();

            // Setup: Register user first
            await page.goto('/register');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.fill('#confirmPassword', user.password);
            await page.click('button:has-text("Register")');
            await expect(page).toHaveURL('/', { timeout: 10000 });

            // Logout
            await PageActions.logout(page);
            await expect(page.locator('text=Login')).toBeVisible();

            // Test: Login
            await page.goto('/login');
            await page.fill('#email', user.email);
            await page.fill('#password', user.password);
            await page.click('button:has-text("Login")');

            // Verify
            await expect(page).toHaveURL('/', { timeout: 10000 });
            await TestAssertions.assertLoggedIn(page);
        });

        test('TC_AUTH_005: Should show error for invalid credentials', async ({ page }) => {
            await page.goto('/login');
            await page.fill('#email', 'nonexistent@example.com');
            await page.fill('#password', 'WrongPassword123');
            await page.click('button:has-text("Login")');

            await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 5000 });
            await expect(page).toHaveURL('/login');
        });
    });

    test.describe('User Logout', () => {

        test('TC_AUTH_006: Should logout successfully', async ({ authenticatedPage }) => {
            // Precondition: User is logged in (handled by fixture)
            await TestAssertions.assertLoggedIn(authenticatedPage);

            // Test: Click logout
            await PageActions.logout(authenticatedPage);

            // Verify: Login button visible, Account dropdown hidden
            await expect(authenticatedPage.locator('text=Login')).toBeVisible();
            await expect(authenticatedPage.locator('text=Account')).not.toBeVisible();
        });
    });

    test.describe('Session Persistence', () => {

        test('TC_AUTH_007: Should maintain session after page refresh', async ({ authenticatedPage }) => {
            // Verify logged in
            await TestAssertions.assertLoggedIn(authenticatedPage);

            // Refresh page
            await authenticatedPage.reload();

            // Should still be logged in
            await TestAssertions.assertLoggedIn(authenticatedPage);
        });
    });
});
