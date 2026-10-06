# E2E Testing with Playwright

The suite is in `client/tests`: 49 UI cases in `tests/e2e` and 65 API cases in `tests/api`. See the root [README](../README.md) for the overview and setup.

## Layout

| Path | Suite ID | Focus |
|---|---|---|
| `tests/e2e/auth.spec.js` | `TS_AUTH` | Registration, login, logout, session persistence |
| `tests/e2e/products.spec.js` | `TS_PROD` | Listing, details, category filter, sort, search |
| `tests/e2e/cart.spec.js` | `TS_CART` | Add, remove, quantity, totals |
| `tests/e2e/checkout.spec.js` | `TS_ORDER` | Checkout, order history, protected routes |
| `tests/e2e/reviews.spec.js` | `TS_REV` | Viewing and submitting reviews |
| `tests/e2e/wishlist.spec.js` | `TS_WISH` | Wishlist add, remove, move to cart |
| `tests/api/auth.api.spec.js` | `TS_API_AUTH` | Auth endpoints, session handling, password storage |
| `tests/api/products.api.spec.js` | `TS_API_PROD` | Catalogue contract, filters, sorting, search, injection handling |
| `tests/api/admin.api.spec.js` | `TS_API_ADMIN` | Role-based access, product CRUD |
| `tests/api/orders.api.spec.js` | `TS_API_ORDER` | Order creation, server-side pricing, stock rules, all-or-nothing, concurrency, SQL checks |
| `tests/api/wishlist-reviews.api.spec.js` | `TS_API_WISH`, `TS_API_REV` | Wishlist and review endpoints |
| `tests/fixtures/test-fixtures.js` | | E2E `authenticatedPage` fixture, `TestData`, `TestAssertions`, `PageActions` |
| `tests/api/support.js` | | API fixtures `anon`/`user`/`admin`, `makeUser`, `makeProduct` |
| `tests/support/db.js` | | `sql()` helper for setup and persistence checks |

## Conventions

- Case titles start with a stable ID: `TC_<AREA>_<NNN>: Should ...`.
- Use the `authenticatedPage` fixture when a logged-in user is needed; use `page` for anonymous flows. Each use creates a unique user.
- API tests: use `anon`, `user` or `admin`; create products with `makeProduct` when a test depends on stock or price; clean up what you create.
- A defect that is not fixed yet is pinned by a case titled `[KNOWN DEFECT Dn]` that asserts the correct behaviour and calls `test.fail(true, reason)`; log it in `docs/KNOWN_DEFECTS.md` and remove the marker when it is fixed. No defects are open at the moment.
- Do not use `waitForTimeout`. Wait for the element, the response, or poll for the state.
- Assert the outcome, not that "something is visible". An assertion that passes in both the success and the failure state (for example `a.or(b)`) is a defect in the test.

## Configuration

`playwright.config.js`:

- Two projects: `api` (no browser, `tests/api`) and `chromium` (headless, `tests/e2e`). Firefox and WebKit are present but commented out.
- Loads `../server/.env` when present so `DATABASE_URL` is available to the API tests.
- Starts the API (`../server`, port 5000) and the Vite client (port 5173) and reuses them if already running.
- Screenshot and video on failure, trace on first retry, 2 retries and 1 worker when `CI` is set.
- `PW_CHROMIUM_PATH` overrides the browser executable.

## Prerequisites for a run

The database must exist and be seeded (`server/db/setup.js`, `scripts/migrate.js`, `scripts/seedProducts.js`). Tests rely on the seeded catalogue: 8 products, 3 of them in Electronics. API tests also need `DATABASE_URL`.
