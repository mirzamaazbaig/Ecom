/**
 * ISTQB TAE Compliant Test Fixtures
 * ----------------------------------
 * Provides reusable test setup and teardown utilities following
 * ISTQB Test Automation Engineering best practices:
 * - Separation of test logic from test data
 * - Reusable authentication helpers
 * - Consistent test state management
 */

import { test as base, expect } from '@playwright/test';

// Test Data Generator
export const TestData = {
    /**
     * Generate unique user credentials for isolated test execution
     */
    generateUser: () => ({
        email: `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@example.com`,
        password: 'TestPass123!'
    }),

    /**
     * Get default test product data
     */
    getProducts: () => ({
        searchTerm: 'T-Shirt',
        category: 'Electronics'
    })
};

/**
 * Extended test fixture with authentication helpers
 * Following ISTQB principle of maintainable test infrastructure
 */
export const test = base.extend({
    /**
     * Authenticated page fixture - logs in a new user before each test
     */
    authenticatedPage: async ({ page }, use) => {
        const user = TestData.generateUser();

        // Register new user
        await page.goto('/register');
        await page.fill('input[type="email"]', user.email);
        await page.locator('input[type="password"]').first().fill(user.password);
        await page.locator('input[type="password"]').nth(1).fill(user.password);
        await page.click('button[type="submit"]');

        // Wait for successful registration and redirect
        await expect(page).toHaveURL('/', { timeout: 10000 });

        // Attach user info for test reference
        page.testUser = user;

        await use(page);
    },

    /**
     * Page with products loaded - ensures products are displayed
     */
    pageWithProducts: async ({ authenticatedPage }, use) => {
        await authenticatedPage.goto('/');
        await authenticatedPage.waitForSelector('.card', { timeout: 10000 });
        await use(authenticatedPage);
    }
});

/**
 * Common test assertions following ISTQB maintainability principles
 */
export const TestAssertions = {
    /**
     * Verify user is logged in by checking for Logout button
     */
    assertLoggedIn: async (page) => {
        await expect(page.locator('text=Logout')).toBeVisible({ timeout: 5000 });
    },

    /**
     * Verify user is on home page with products
     */
    assertOnHomePage: async (page) => {
        await expect(page).toHaveURL('/');
        await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });
    },

    /**
     * Verify product details page is loaded
     */
    assertOnProductPage: async (page) => {
        await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Add to Cart')).toBeVisible();
    },

    /**
     * Verify cart has items
     */
    assertCartHasItems: async (page) => {
        await expect(page.locator('.list-group-item').first()).toBeVisible({ timeout: 5000 });
    }
};

/**
 * Page Actions - Reusable action sequences following Page Object Model principles
 */
export const PageActions = {
    /**
     * Navigate to first product details
     */
    goToFirstProduct: async (page) => {
        await page.goto('/');
        await page.waitForSelector('.card');
        await page.locator('.card .btn-outline-secondary').first().click();
        await page.waitForSelector('h2');
    },

    /**
     * Add product to cart from product details page
     */
    addProductToCart: async (page) => {
        // Handle alert dialog
        page.once('dialog', dialog => dialog.accept());
        await page.click('text=Add to Cart');
    },

    /**
     * Add product to wishlist from product details page
     */
    addProductToWishlist: async (page) => {
        page.once('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Wishlist")');
    },

    /**
     * Perform search
     */
    searchForProduct: async (page, searchTerm) => {
        await page.fill('input[placeholder="Search products..."]', searchTerm);
        await page.click('.search-btn');
    },

    /**
     * Filter by category
     */
    filterByCategory: async (page, categoryName) => {
        await page.click(`li:has-text("${categoryName}")`);
    },

    /**
     * Sort products
     */
    sortProducts: async (page, sortValue) => {
        await page.selectOption('select.form-select', sortValue);
    }
};

export { expect };
