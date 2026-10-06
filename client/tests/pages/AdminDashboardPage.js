import { expect } from '@playwright/test';

/** The admin dashboard: product management and the all-orders tab. */
export class AdminDashboardPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'Admin Dashboard' });
        this.productsTab = page.getByRole('button', { name: 'Products', exact: true });
        this.ordersTab = page.getByRole('button', { name: 'Orders', exact: true });
        this.addProductButton = page.getByRole('button', { name: '+ Add Product' });

        this.formTitle = page.locator('.card-header');
        this.nameField = page.getByLabel('Name');
        this.priceField = page.getByLabel('Price');
        this.descriptionField = page.getByLabel('Description');
        this.stockField = page.getByLabel('Stock');
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });

        this.rows = page.locator('table tbody tr');
    }

    async goto() {
        await this.page.goto('/admin');
        await expect(this.heading).toBeVisible();
    }

    row(text) {
        return this.rows.filter({ hasText: text });
    }

    async openAddForm() {
        await this.addProductButton.click();
        await expect(this.formTitle).toHaveText('Add New Product');
    }

    async fillProduct({ name, price, description = '', stock }) {
        await this.nameField.fill(name);
        await this.priceField.fill(String(price));
        await this.descriptionField.fill(description);
        await this.stockField.fill(String(stock));
    }

    async save() {
        await this.saveButton.click();
    }

    async edit(name) {
        await this.row(name).getByRole('button', { name: 'Edit' }).click();
        await expect(this.formTitle).toHaveText('Edit Product');
    }

    /** Deletes after accepting the confirmation dialog (handled by the app fixture). */
    async remove(name) {
        await this.row(name).getByRole('button', { name: 'Delete' }).click();
    }

    async openOrdersTab() {
        await this.ordersTab.click();
        await expect(this.page.getByRole('columnheader', { name: 'Order ID' })).toBeVisible();
    }
}
