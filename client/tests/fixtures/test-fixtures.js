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
     * Base page fixture - auto-handles dialogs
     */
    page: async ({ page }, use) => {
        page.on('dialog', dialog => {
            console.log(`Dialog: ${dialog.message()}`);
            dialog.accept().catch(() => { });
        });
        await use(page);
    },

    /**
     * Authenticated page fixture - logs in a new user before each test
     */
    authenticatedPage: async ({ page }, use) => {
        const user = TestData.generateUser();

        // Register new user
        // Use domcontentloaded for faster navigation in SPAs, avoiding timeouts on external resources
        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        // Ensure the form is actually rendered before interacting (catches React hydration delays)
        await expect(page.locator('h2:has-text("Register")')).toBeVisible({ timeout: 15000 });
        await page.fill('#email', user.email);
        await page.fill('#password', user.password);
        await page.fill('#confirmPassword', user.password);
        await page.click('button:has-text("Register")');

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
        // Dropdown toggle with username and down arrow when logged in
        await expect(page.locator('.nav-link.dropdown-toggle')).toBeVisible({ timeout: 10000 });
    },

    /**
     * Verify user is logged out
     */
    assertLoggedOut: async (page) => {
        // Login link shows "Account & Lists" when logged out
        await expect(page.locator('a[href="/login"]')).toBeVisible({ timeout: 10000 });
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
        // Click "View Details" or use the image/title link
        await page.locator('.card .btn-outline-secondary').first().click();
        await expect(page).toHaveURL(/\/products\//);
        await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
    },

    /**
     * Add product to cart from product details page
     */
    addProductToCart: async (page) => {
        await page.click('text=Add to Cart');
    },

    /**
     * Add product to wishlist from product details page
     */
    addProductToWishlist: async (page) => {
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
     * Navigate to wishlist page
     */
    goToWishlist: async (page) => {
        await page.click('a[href="/wishlist"]');
        await expect(page).toHaveURL('/wishlist');
    },

    /**
     * Navigate to orders page
     */
    goToOrders: async (page) => {
        await page.click('a[href="/my-orders"]');
        await expect(page).toHaveURL('/my-orders');
    },

    /**
     * Navigate to home page
     */
    goToHome: async (page) => {
        await page.goto('/');
        await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });
    },

    /**
     * Navigate to cart page
     */
    goToCart: async (page) => {
        await page.click('a[href="/cart"]');
        await expect(page).toHaveURL('/cart');
    },

    /**
     * Logout user
     */
    logout: async (page) => {
        const accountToggle = page.locator('.nav-link.dropdown-toggle');
        await expect(accountToggle).toBeVisible({ timeout: 10000 });
        await accountToggle.click();

        // Wait for the Logout link to be visible in the dropdown
        const logoutBtn = page.locator('.dropdown-item:has-text("Logout")');
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
        await logoutBtn.click({ force: true });

        // Verify we are back to the logged out state
        await expect(page.locator('a[href="/login"]')).toBeVisible({ timeout: 10000 });
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
        // Use :has() pseudo-class to find the specific filter section containing the 'Sort By' header
        await page.locator('.filter-section:has(h5:has-text("Sort By")) select').selectOption(sortValue);
    }
};

export { expect };
