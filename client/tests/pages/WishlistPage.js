import { expect } from '@playwright/test';

export class WishlistPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'My Wishlist' });
        this.emptyHeading = page.getByRole('heading', { name: 'Your Wishlist is Empty' });
        this.cards = page.locator('.card');
        this.titles = page.locator('.card .card-title');
    }

    async goto() {
        await this.page.goto('/wishlist');
        await expect(this.heading.or(this.emptyHeading)).toBeVisible();
    }

    card(name) {
        return this.cards.filter({ has: this.page.locator('.card-title', { hasText: name }) });
    }

    async addToCart(name) {
        await this.card(name).getByRole('button', { name: 'Add to Cart' }).click();
    }

    async remove(name) {
        await this.card(name).getByRole('button', { name: 'Remove from Wishlist' }).click();
    }

    async openProduct(name) {
        await this.card(name).locator('.card-title a').click();
        await expect(this.page).toHaveURL(/\/products\/\d+/);
    }
}
