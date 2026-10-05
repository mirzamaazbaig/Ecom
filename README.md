# E-Commerce Application with Playwright E2E Test Suite

[![E2E tests](https://github.com/mirzamaazbaig/Ecom/actions/workflows/e2e.yml/badge.svg)](https://github.com/mirzamaazbaig/Ecom/actions/workflows/e2e.yml)

A full-stack shop (React, Express, PostgreSQL) built as the system under test for an end-to-end test automation suite. The application is deliberately small; the focus of this repository is the **test suite in [`client/tests`](client/tests)** and how it is structured, run and maintained.

## What is tested

| Suite | Cases | Coverage |
|---|---|---|
| `TS_AUTH` | 7 | Registration, duplicate email, password mismatch, login, invalid credentials, logout, session persistence after reload |
| `TS_PROD` | 13 | Listing, prices and ratings, navigation, category filter, sorting, search, empty search |
| `TS_CART` | 7 | Add from list and details page, quantity, empty cart, remove, total calculation |
| `TS_ORDER` | 7 | Checkout, cart cleared after order, order history, protected routes redirect to login |
| `TS_REV` | 9 | Viewing reviews, submitting a review, rating options and default, validation, unauthenticated user |
| `TS_WISH` | 6 | Add, view, empty state, remove, add to cart from wishlist, navigate to product |

49 cases in total. Test IDs (`TC_CART_003`) map one to one to test titles so failures can be traced to a requirement area.

## Test approach

- **Isolation:** every test that needs a user registers a fresh one through the `authenticatedPage` fixture (unique email per test), so tests are order-independent and run in parallel.
- **Reusable layer:** shared fixtures, assertions and UI actions live in [`client/tests/fixtures/test-fixtures.js`](client/tests/fixtures/test-fixtures.js), keeping selectors out of the test bodies.
- **Web-first assertions, no fixed sleeps:** tests wait on conditions (`expect(...).toHaveCount`, `expect.poll`, `waitForResponse`) instead of `waitForTimeout`.
- **UI checked against the API:** for example the category filter test compares the cards on screen with the products returned by `GET /api/products?category_id=1`.
- **Failure evidence:** screenshots and video are kept on failure and a trace is recorded on the first retry. The HTML report is written to `client/playwright-report`.

## Continuous integration

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) runs on every push, pull request and manual dispatch:

1. Starts a PostgreSQL 16 service container.
2. Installs server and client dependencies with `npm ci` (cached) and Playwright Chromium.
3. Creates, migrates and seeds the database (`db/setup.js`, `scripts/migrate.js`, `scripts/seedProducts.js`).
4. Runs the 49 cases headless. With `CI` set, Playwright uses 2 retries and one worker.
5. Uploads the HTML report as the `playwright-report` artifact; traces, screenshots and videos are uploaded as `test-results` when a run fails.

Known limitations are listed under [Roadmap](#roadmap).

## Running the tests

Prerequisites: Node.js 18+, PostgreSQL running locally.

```bash
# 1. Install
npm run install-all
cd client && npx playwright install chromium && cd ..

# 2. Configure and prepare the database
cp server/.env.example server/.env      # then set DATABASE_URL and SESSION_SECRET
cd server
node db/setup.js                         # creates the database and tables
node scripts/migrate.js                  # applies db/migrations
node scripts/seedProducts.js             # inserts the product catalogue
cd ..

# 3. Run (Playwright starts the API on :5000 and the client on :5173 itself)
cd client
npm run test:e2e                         # headless
npm run test:e2e:headed                  # watch it run
npm run test:e2e:ui                      # interactive UI mode
npm run test:report                      # open the last HTML report
```

Run one suite or one case:

```bash
npx playwright test tests/cart.spec.js
npx playwright test -g "TC_CART_003"
```

Environment variables: `API_URL` (default `http://localhost:5000/api`) points the tests at a different API; `PW_CHROMIUM_PATH` uses an existing Chromium binary instead of Playwright's download.

## Application under test

- **Client:** React 19, Vite, Bootstrap 5, Context API for auth and cart state.
- **Server:** Express 5 with controllers, models and routes; session authentication with `express-session` and `bcrypt`.
- **Database:** PostgreSQL via `pg` with parameterised SQL. Orders are created in a transaction (insert order, insert items, update stock, commit or roll back).
- **Admin:** Protected admin dashboard. Promote a user with `node server/scripts/setAdmin.js <email>`.

```
client/            React app and the Playwright suite
  src/             Pages, components, contexts
  tests/           *.spec.js suites and fixtures/
  playwright.config.js
server/            Express API
  controllers/ models/ routes/ middleware/
  db/              setup.js and SQL migrations
  scripts/         migrate, seed, setAdmin
```

More detail on the suites: [`client/TESTING.md`](client/TESTING.md).

## Roadmap

- API-level tests for auth, products and order endpoints, including the checkout transaction and its rollback path.
- Page Object classes to replace the `PageActions` helper object.
- Admin dashboard coverage (currently untested).
- Firefox and WebKit projects (configured but disabled).
