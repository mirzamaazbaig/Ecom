import { expect } from '@playwright/test';

/** Product details with its reviews section. */
export class ProductPage {
    constructor(page) {
        this.page = page;
        this.name = page.locator('h2').first();
        this.price = page.locator('h4.text-muted');
        this.quantity = page.getByLabel('Quantity');
        this.addToCartButton = page.getByRole('button', { name: 'Add to Cart' });
        this.wishlistButton = page.getByRole('button', { name: /Wishlist/ });

        this.reviewsHeading = page.getByRole('heading', { name: 'Customer Reviews' });
        this.writeReviewHeading = page.getByText('Write a Review');
        this.reviewCards = page.locator('.card.p-3');
        this.noReviews = page.getByText('No reviews yet.');
        this.ratingSelect = page.getByLabel('Rating');
        this.commentBox = page.getByLabel('Comment');
        this.submitReviewButton = page.getByRole('button', { name: 'Submit Review' });
    }

    async goto(id) {
        await this.page.goto(`/products/${id}`);
        await expect(this.addToCartButton).toBeVisible();
    }

    async priceValue() {
        return parseFloat((await this.price.innerText()).replace('$', ''));
    }

    async setQuantity(quantity) {
        await this.quantity.fill(String(quantity));
    }

    async addToCart() {
        await this.addToCartButton.click();
    }

    async addToWishlist() {
        await this.wishlistButton.click();
    }

    async submitReview({ rating, comment }) {
        await this.ratingSelect.selectOption(String(rating));
        await this.commentBox.fill(comment);
        await this.submitReviewButton.click();
    }

    reviewCard(text) {
        return this.reviewCards.filter({ hasText: text });
    }
}
