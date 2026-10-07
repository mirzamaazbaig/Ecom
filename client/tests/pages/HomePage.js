import { expect } from '@playwright/test';
import { SEEDED_PRODUCTS } from '../support/seed.js';

/** The product listing with its category, sort and price controls. */
export class HomePage {
    constructor(page) {
        this.page = page;
        this.cards = page.locator('.card');
        this.titles = page.locator('.card .card-title');
        this.prices = page.locator('.card .card-text.fw-bold');
        this.ratings = page.locator('.card .text-warning');
        this.sortSelect = page.getByLabel('Sort by');
        this.priceSlider = page.getByLabel('Maximum price');
        this.resultsHeading = page.getByRole('heading', { name: /^Results for/ });
        this.noProducts = page.getByText('No products found.');
    }

    async goto() {
        await this.page.goto('/');
        await expect(this.cards.first()).toBeVisible();
    }

    /** A product card, found by the product name. */
    card(name) {
        return this.cards.filter({ has: this.page.locator('.card-title', { hasText: name }) });
    }

    /**
     * The name of the first listed product that is part of the seeded catalogue. Tests that need "any product"
     * use this instead of the first card, which may be a product another test created and is about to delete.
     */
    async seededProductName() {
        const escaped = SEEDED_PRODUCTS.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const seeded = this.titles.filter({ hasText: new RegExp(`^(${escaped.join('|')})$`) });
        return (await seeded.first().innerText()).trim();
    }

    async productNames() {
        return (await this.titles.allInnerTexts()).map(t => t.trim());
    }

    async priceOf(name) {
        const text = await this.card(name).locator('.card-text.fw-bold').innerText();
        return parseFloat(text.replace('$', ''));
    }

    async addToCart(name) {
        await this.card(name).getByRole('button', { name: 'Add to Cart' }).click();
    }

    /** Opens the details page via the View Details button and returns once it has loaded. */
    async openDetails(name) {
        await this.card(name).getByRole('link', { name: 'View Details' }).click();
        await expect(this.page).toHaveURL(/\/products\/\d+/);
    }

    async openDetailsViaTitle(name) {
        await this.card(name).locator('.card-title a').click();
        await expect(this.page).toHaveURL(/\/products\/\d+/);
    }

    async filterByCategory(category) {
        await this.page.locator('li', { hasText: category }).click();
    }

    /** `label` is the visible option text, for example "Price: Low to High". */
    async sortBy(label) {
        await this.sortSelect.selectOption({ label });
    }
}
