/**
 * Product Reviews E2E Tests
 * --------------------------
 * Test Suite ID: TS_REV
 * Following ISTQB TAE Guidelines:
 * - User interaction testing
 * - Form validation testing
 * - Data persistence verification
 */

import { test, expect, PageActions } from './fixtures/test-fixtures.js';

test.describe('TS_REV: Product Reviews Test Suite', () => {

    test.describe('View Reviews', () => {

        test('TC_REV_001: Should display reviews section on product page', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Verify reviews section
            await expect(page.locator('text=Customer Reviews')).toBeVisible();
            await expect(page.locator('text=Write a Review')).toBeVisible();
        });

        test('TC_REV_002: Should display existing reviews if any', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Either reviews exist or "No reviews yet" message
            await expect(
                page.locator('.card.p-3').first().or(page.locator('text=No reviews yet'))
            ).toBeVisible({ timeout: 10000 });
        });

        test('TC_REV_003: Should display review rating as stars', async ({ authenticatedPage }) => {
            // First submit a review
            await PageActions.goToFirstProduct(authenticatedPage);

            authenticatedPage.once('dialog', dialog => dialog.accept());
            await authenticatedPage.selectOption('select.form-select:near(:text("Rating"))', '5');
            await authenticatedPage.fill('textarea', 'Test review for stars display');
            await authenticatedPage.click('button:has-text("Submit Review")');

            // Verify stars are shown
            await expect(authenticatedPage.locator('.text-warning:has-text("★")')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Submit Review', () => {

        test('TC_REV_004: Should submit a review successfully', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            const reviewText = `Test review ${Date.now()}`;

            // Fill review form
            await authenticatedPage.selectOption('select.form-select:near(:text("Rating"))', '4');
            await authenticatedPage.fill('textarea', reviewText);

            // Handle success alert
            authenticatedPage.once('dialog', dialog => {
                expect(dialog.message()).toContain('Review submitted');
                dialog.accept();
            });

            // Submit
            await authenticatedPage.click('button:has-text("Submit Review")');

            // Verify review appears
            await expect(authenticatedPage.locator(`text=${reviewText}`)).toBeVisible({ timeout: 10000 });
        });

        test('TC_REV_005: Should allow selecting different ratings', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            // Test all rating options
            const ratings = ['5', '4', '3', '2', '1'];
            for (const rating of ratings) {
                await authenticatedPage.selectOption('select.form-select:near(:text("Rating"))', rating);
                const selectedValue = await authenticatedPage.locator('select.form-select:near(:text("Rating"))').inputValue();
                expect(selectedValue).toBe(rating);
            }
        });

        test('TC_REV_006: Should require comment text', async ({ authenticatedPage }) => {
            await PageActions.goToFirstProduct(authenticatedPage);

            // Try to submit without comment (textarea has required attribute)
            const textarea = authenticatedPage.locator('textarea');
            const isRequired = await textarea.getAttribute('required');
            expect(isRequired).not.toBeNull();
        });
    });

    test.describe('Review Form Validation', () => {

        test('TC_REV_007: Should show rating options from 1 to 5', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Get all rating options
            const options = page.locator('select.form-select:near(:text("Rating")) option');
            const count = await options.count();

            expect(count).toBe(5);
        });

        test('TC_REV_008: Should default to 5-star rating', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Check default value
            const selectedValue = await page.locator('select.form-select:near(:text("Rating"))').inputValue();
            expect(selectedValue).toBe('5');
        });
    });

    test.describe('Review Authentication', () => {

        test('TC_REV_009: Should show error when unauthenticated user tries to review', async ({ page }) => {
            await PageActions.goToFirstProduct(page);

            // Fill review form
            await page.selectOption('select.form-select:near(:text("Rating"))', '4');
            await page.fill('textarea', 'Unauthenticated review attempt');

            // Handle alert
            page.once('dialog', dialog => {
                expect(dialog.message()).toContain('login');
                dialog.accept();
            });

            // Try to submit
            await page.click('button:has-text("Submit Review")');
        });
    });
});
