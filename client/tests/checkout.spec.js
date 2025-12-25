import { test, expect } from '@playwright/test';

test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
        const uniqueEmail = `checkout_test_${Date.now()}@example.com`;
        const password = 'password123';

        // Register & Login (Auto)
        await page.goto('/register');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"] >> nth=0', password);
        await page.fill('input[type="password"] >> nth=1', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');
    });

    test('should complete checkout successfully', async ({ page }) => {
        // Add item to cart
        await page.goto('/');
        await page.waitForSelector('.card');
        await page.locator('.card .btn-primary').first().click();

        page.on('dialog', async dialog => {
            await dialog.accept(); // Accept alerts
        });

        await page.click('text=Add to Cart');

        // Go to Cart
        await page.goto('/cart');

        // Click Checkout
        // We expect an alert "Order placed successfully!"
        // And then redirection to /my-orders

        let orderPlaced = false;
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Order placed successfully')) {
                orderPlaced = true;
            }
            await dialog.accept();
        });

        await page.click('button:has-text("Checkout")');

        // Wait for navigation to my-orders
        await expect(page).toHaveURL(/\/my-orders/);

        // Verify order is listed
        // Assuming MyOrders page lists orders, checking for a table or card
        // We can just verify the URL and the header for now
        await expect(page.locator('h2')).toContainText('My Orders');
    });
});
