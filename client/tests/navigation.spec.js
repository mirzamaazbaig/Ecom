import { test, expect } from './fixtures/test-fixtures.js';

test.describe('Navigation Features', () => {

    test('Should navigate to register page from login page', async ({ page }) => {
        await page.goto('/login');

        // Check for the link
        const registerLink = page.locator('text=Register here');
        await expect(registerLink).toBeVisible();

        // Click and verify navigation
        await registerLink.click();
        await expect(page).toHaveURL('/register');
        await expect(page.locator('h2:has-text("Register")')).toBeVisible();
    });

    test('Should display breadcrumbs on inner pages', async ({ authenticatedPage }) => {
        // Test Cart page breadcrumb
        await authenticatedPage.goto('/cart');

        const breadcrumbNav = authenticatedPage.locator('nav[aria-label="breadcrumb"]');
        await expect(breadcrumbNav).toBeVisible();

        // Verify path: Home > Cart
        await expect(breadcrumbNav.locator('li').first()).toHaveText('Home');
        await expect(breadcrumbNav.locator('li').last()).toHaveText('Cart');
    });

    // Note: Since /products isn't a route, we won't test clicking the intermediate link for now, 
    // just the presence of the segments on a detail page if possible, or just stay with Cart for safety.
});
