import { expect } from '@playwright/test';

/** The top navigation bar, present on every page. */
export class NavBar {
    constructor(page) {
        this.page = page;
        this.toggler = page.locator('.navbar-toggler');
        this.menu = page.locator('#navbarNav');
        this.searchInput = page.getByPlaceholder('Search products...');
        this.searchButton = page.locator('.search-btn');
        this.accountMenu = page.locator('.nav-link.dropdown-toggle');
        this.signInLink = page.locator('a[href="/login"]');
        this.cartLink = page.locator('a[href="/cart"]');
        this.cartBadge = this.cartLink.locator('.badge');
        this.ordersLink = page.locator('a[href="/my-orders"]');
        this.wishlistLink = page.locator('a[href="/wishlist"]');
    }

    /** On a phone-sized screen the links sit behind a hamburger button: open it. Does nothing on a wide screen. */
    async openMenu() {
        if (!(await this.toggler.isVisible())) return;
        if (await this.menu.evaluate(el => el.classList.contains('show'))) return;
        await this.toggler.click();
        await expect(this.menu).toHaveClass(/\bshow\b/); // wait for the open animation to finish
    }

    async search(term) {
        await this.openMenu();
        await this.searchInput.fill(term);
        await this.searchButton.click();
    }

    async openCart() {
        await this.openMenu();
        await this.cartLink.click();
        await expect(this.page).toHaveURL('/cart');
    }

    async openOrders() {
        await this.openMenu();
        await this.ordersLink.click();
        await expect(this.page).toHaveURL('/my-orders');
    }

    async openWishlist() {
        await this.openMenu();
        await this.wishlistLink.click();
        await expect(this.page).toHaveURL('/wishlist');
    }

    async logout() {
        await this.openMenu();
        await this.accountMenu.click();
        await this.page.getByRole('button', { name: 'Logout' }).click();
        await this.expectLoggedOut();
    }

    async expectLoggedIn() {
        await this.openMenu();
        await expect(this.accountMenu).toBeVisible();
    }

    async expectLoggedOut() {
        await this.openMenu();
        await expect(this.signInLink).toBeVisible();
        await expect(this.accountMenu).toHaveCount(0);
    }

    /** Waits for the cart badge, which is how the UI confirms an item was stored. */
    async expectCartCount(count) {
        await expect(this.cartBadge).toHaveText(String(count));
    }
}
