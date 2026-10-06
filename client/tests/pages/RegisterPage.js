import { expect } from '@playwright/test';

export class RegisterPage {
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: 'Register' });
        this.email = page.locator('#email');
        this.password = page.locator('#password');
        this.confirmPassword = page.locator('#confirmPassword');
        this.submit = page.getByRole('button', { name: 'Register', exact: true });
        this.error = page.locator('.alert-danger');
    }

    async goto() {
        await this.page.goto('/register');
        await expect(this.heading).toBeVisible();
    }

    /** Fills and submits the form; the confirmation defaults to the password. */
    async register({ email, password }, confirmation = password) {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.confirmPassword.fill(confirmation);
        await this.submit.click();
    }
}
