import { expect } from '@playwright/test';

export class OrdersPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'My Orders' });
        this.emptyHeading = page.getByRole('heading', { name: 'No orders found' });
        this.orders = page.locator('.accordion-item');
    }

    async goto() {
        await this.page.goto('/my-orders');
        await expect(this.heading.or(this.emptyHeading)).toBeVisible();
    }

    /** The newest order is expanded by default; this is its visible content. */
    expandedOrderBody() {
        return this.page.locator('.accordion-collapse.show .accordion-body');
    }
}
