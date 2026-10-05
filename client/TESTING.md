# E2E Testing with Playwright

The suite is in `client/tests`, 49 cases across six files. See the root [README](../README.md) for the overview and setup.

## Layout

| File | Suite ID | Focus |
|---|---|---|
| `tests/auth.spec.js` | `TS_AUTH` | Registration, login, logout, session persistence |
| `tests/products.spec.js` | `TS_PROD` | Listing, details, category filter, sort, search |
| `tests/cart.spec.js` | `TS_CART` | Add, remove, quantity, totals |
| `tests/checkout.spec.js` | `TS_ORDER` | Checkout, order history, protected routes |
| `tests/reviews.spec.js` | `TS_REV` | Viewing and submitting reviews |
| `tests/wishlist.spec.js` | `TS_WISH` | Wishlist add, remove, move to cart |
| `tests/fixtures/test-fixtures.js` | | `authenticatedPage` fixture, `TestData`, `TestAssertions`, `PageActions`, `API_URL` |

## Conventions

- Case titles start with a stable ID: `TC_<AREA>_<NNN>: Should ...`.
- Use the `authenticatedPage` fixture when a logged-in user is needed; use `page` for anonymous flows. Each use creates a unique user.
- Do not use `waitForTimeout`. Wait for the element, the response, or poll for the state.
- Assert the outcome, not that "something is visible". An assertion that passes in both the success and the failure state (for example `a.or(b)`) is a defect in the test.

## Configuration

`playwright.config.js`:

- Runs headless on Chromium (Firefox and WebKit are present but commented out).
- Starts the API (`../server`, port 5000) and the Vite client (port 5173) and reuses them if already running.
- Screenshot and video on failure, trace on first retry, 2 retries and 1 worker when `CI` is set.
- `PW_CHROMIUM_PATH` overrides the browser executable.

## Prerequisites for a run

The database must exist and be seeded (`server/db/setup.js`, `scripts/migrate.js`, `scripts/seedProducts.js`). Tests rely on the seeded catalogue: 8 products, 3 of them in Electronics.
