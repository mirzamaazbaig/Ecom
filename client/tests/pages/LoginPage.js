import { expect } from '@playwright/test';

export class LoginPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'Login' });
        this.email = page.locator('#email');
        this.password = page.locator('#password');
        this.submit = page.getByRole('button', { name: 'Login', exact: true });
        this.error = page.locator('.alert-danger');
    }

    async goto() {
        await this.page.goto('/login');
        await expect(this.heading).toBeVisible();
    }

    /** Fills and submits the form; the caller asserts the outcome. */
    async login({ email, password }) {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.submit.click();
    }
}
