import { expect } from '@playwright/test';

export class CartPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'Shopping Cart' });
        this.emptyHeading = page.getByRole('heading', { name: 'Your Cart is Empty' });
        this.browseButton = page.getByRole('button', { name: 'Browse Products' });
        this.items = page.locator('ul.list-group.mb-3 > li');
        this.itemNames = this.items.locator('h6');
        this.summary = page.getByText('Summary', { exact: true });
        this.totalItems = page.getByText('Total Items');
        this.totalLabel = page.getByText('Total (USD)');
        this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    }

    async goto() {
        await this.page.goto('/cart');
        await expect(this.heading.or(this.emptyHeading)).toBeVisible();
    }

    item(name) {
        return this.items.filter({ has: this.page.locator('h6', { hasText: name }) });
    }

    async total() {
        const text = await this.page.locator('li', { hasText: 'Total (USD)' }).locator('strong').innerText();
        return parseFloat(text.replace('$', ''));
    }

    async remove(name) {
        await this.item(name).getByRole('button', { name: 'Remove' }).click();
    }

    /** Checks out; the confirmation alert is accepted by the app fixture. Returns once the orders page is shown. */
    async checkout() {
        await this.checkoutButton.click();
        await expect(this.page).toHaveURL('/my-orders');
    }
}
