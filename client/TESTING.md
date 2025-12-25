# E2E Testing with Playwright

This project uses [Playwright](https://playwright.dev/) for End-to-End (E2E) testing.

## Prerequisites
1.  **Backend Server**: The backend server must be running on `http://localhost:5000`.
    ```bash
    cd server
    npm run dev
    ```
2.  **Dependencies**: Ensure dependencies are installed in the `client` directory.
    ```bash
    cd client
    npm install
    npx playwright install
    ```

## Running Tests
To run the automated tests, open a terminal in the `client` directory:

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npx playwright test --ui

# View the last test report
npx playwright show-report
```

## Test Structure
- **`tests/auth.spec.js`**: Verifies Registration and Login flows.
- **`tests/cart.spec.js`**: Verifies adding items to the cart and checking the item count.
- **`tests/checkout.spec.js`**: Verifies the full checkout process.

## Configuration
The Playwright configuration is located in `playwright.config.js`. It is set to:
- Launch the React client using `npm run dev` (Port 5173).
- Test against Chromium, Firefox, and WebKit.
