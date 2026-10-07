# E-Commerce Application with Playwright E2E Test Suite

[![E2E tests](https://github.com/mirzamaazbaig/Ecom/actions/workflows/e2e.yml/badge.svg)](https://github.com/mirzamaazbaig/Ecom/actions/workflows/e2e.yml)

A full-stack shop (React, Express, PostgreSQL) built as the system under test for a three-part test automation suite in Playwright: **API tests**, **UI end-to-end tests** and **accessibility checks**, all in [`client/tests`](client/tests). The approach and the risks behind it are written down in [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md). The application is deliberately small; the focus of this repository is how the tests are structured, run and maintained, and what they found.

## What is tested

### API tests: `client/tests/api` (65 cases)

| Suite | Cases | Coverage |
|---|---|---|
| `TS_API_AUTH` | 11 | Register, duplicate email, session start, bcrypt hash stored, login, no user enumeration, `/me`, logout |
| `TS_API_PROD` | 14 | Field contract, limit/offset, category/price filters, sorting, search, SQL-injection and unsupported `sort_by` handling, get by id, 404 |
| `TS_API_ADMIN` | 8 | Role-based access (401 anonymous, 403 customer), product create/update/delete lifecycle |
| `TS_API_ORDER` | 16 | Validation, persistence, stock decrement and stock boundary, server-side pricing, price snapshot, per-user isolation, all-or-nothing orders, concurrent orders, SQL checks on stored rows |
| `TS_API_WISH` | 8 | Auth, add, idempotent add, remove, per-user privacy |
| `TS_API_REV` | 8 | Auth, review listing, average rating aggregation, rating range |

### UI end-to-end tests: `client/tests/e2e` (58 cases)

| Suite | Cases | Coverage |
|---|---|---|
| `TS_AUTH` | 7 | Registration, duplicate email, password mismatch, login, invalid credentials, logout, session persistence after reload |
| `TS_PROD` | 13 | Listing, prices and ratings, navigation, category filter, sorting, search, empty search |
| `TS_CART` | 7 | Add from list and details page, quantity, empty cart, remove, total calculation |
| `TS_ORDER` | 7 | Checkout, cart cleared after order, order history, protected routes redirect to login |
| `TS_REV` | 9 | Viewing reviews, submitting a review, rating options and default, validation, unauthenticated user |
| `TS_WISH` | 6 | Add, view, empty state, remove, add to cart from wishlist, navigate to product |
| `TS_ADMIN` | 9 | Access (customer and anonymous are turned away), dashboard lists the catalogue, add / edit / delete a product, form validation, cancel, orders tab shows a customer's order |

### Accessibility: `client/tests/a11y` (14 cases)

| Suite | Cases | Coverage |
|---|---|---|
| `TS_A11Y` | 14 | axe-core scan against WCAG 2.1 A and AA on the home page, login (also with an error shown), register, product details, empty search, empty and filled cart, wishlist, order history, profile, and the admin dashboard (products, add form, orders) |

The first scan failed on all 11 customer pages (unnamed form controls and low-contrast buttons), and the admin pages added later had two more problems; the findings and fixes are in the defect log below.

Test IDs (`TC_CART_003`, `TC_API_ORDER_009`) map one to one to test titles so failures can be traced to a requirement area.

## Defects found

The tests found 6 functional defects (API) and 4 groups of accessibility defects (axe-core), documented in [`docs/KNOWN_DEFECTS.md`](docs/KNOWN_DEFECTS.md) with requests, expected and actual behaviour. All are fixed. The six functional ones:

- **High:** orders that exceeded stock (D1) and client-controlled prices (D2). The fix locks product rows in the order transaction and prices the order on the server; a concurrency test has two users race for the last unit.
- **Medium and low:** missing input validation (D3 to D6): malformed emails, empty registration bodies, non-numeric ids, invalid ratings and unknown products that returned 500 instead of a 4xx.

The accessibility findings were unlabeled form controls (`select-name`, `label`: critical) and text contrast below 4.5:1 (`color-contrast`: serious), fixed with accessible names, label associations and darker shades of the same colours.

Each fix followed the same loop: a test asserting the correct behaviour that fails against the application, the fix, then the same test passing. The tests stay as regression tests.

## Test approach

- **Two layers:** most behaviour (validation, authorisation, data integrity) is checked at the API; the UI layer covers user journeys. API tests run in seconds and need no browser.
- **Isolation:** every test registers its own user (unique email). Tests that depend on stock or price create their own product through the admin API, so assertions are exact and tests run in parallel without interfering.
- **Page objects for the UI tests:** one class per page in [`tests/pages`](client/tests/pages) (locators and user actions; assertions stay in the tests), bound together by an `App` object. Tests read like the user's journey (`shopper.home.addToCart(name)`, `shopper.cart.checkout()`) and a changed selector is fixed in one place.
- **Fixtures:** `app` is an anonymous visitor, `shopper` and `admin` are already signed in. They sign in through the API and hand the session cookie to the browser, so only the authentication suite uses the login screens. The `App` also accepts the app's native `alert()` and `confirm()` dialogs and records their messages for assertions. API fixtures (`anon`, `user`, `admin`) and factories live in [`tests/api/support.js`](client/tests/api/support.js).
- **Persistence checks:** selected API tests query PostgreSQL directly to verify what was stored (password hash, order and line-item rows, rollback leaves no rows).
- **Web-first assertions, no fixed sleeps:** tests wait on conditions (`expect(...).toHaveCount`, `expect.poll`, `waitForResponse`) instead of `waitForTimeout`.
- **UI checked against the API:** for example the category filter test compares the cards on screen with the products returned by `GET /api/products?category_id=1`.
- **Defects are tracked in code:** a defect is first pinned by a test that asserts the correct behaviour and is marked `test.fail()`; the marker is removed when it is fixed. See [Defects found](#defects-found).
- **Test data:** the checkout UI suite tops up seeded stock before it runs, because the server now enforces stock.
- **Failure evidence:** screenshots and video are kept on failure and a trace is recorded on the first retry. The HTML report is written to `client/playwright-report`.

## Continuous integration

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) runs on every push, pull request and manual dispatch:

1. Starts a PostgreSQL 16 service container.
2. Installs server and client dependencies with `npm ci` (cached) and Playwright Chromium.
3. Creates, migrates and seeds the database (`db/setup.js`, `scripts/migrate.js`, `scripts/seedProducts.js`).
4. Runs the API, accessibility and E2E projects headless (`npm test`). With `CI` set, Playwright uses 2 retries and one worker.
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
npm test                                 # API + E2E
npm run test:api                         # API tests only (fast, no browser)
npm run test:a11y                        # accessibility scan (axe-core)
npm run test:e2e                         # UI tests only, headless
npm run test:e2e:headed                  # watch it run
npm run test:e2e:ui                      # interactive UI mode
npm run test:report                      # open the last HTML report
```

Run one suite or one case:

```bash
npx playwright test tests/e2e/cart.spec.js
npx playwright test -g "TC_CART_003"
```

The API tests read `DATABASE_URL` from `server/.env` (or the environment) to create admin users and verify stored rows.

Environment variables: `API_URL` (default `http://localhost:5000/api`) points the tests at a different API; `PW_CHROMIUM_PATH` uses an existing Chromium binary instead of Playwright's download.

## Application under test

- **Client:** React 19, Vite, Bootstrap 5, Context API for auth and cart state.
- **Server:** Express 5 with controllers, models and routes; session authentication with `express-session` and `bcrypt`.
- **Database:** PostgreSQL via `pg` with parameterised SQL. Orders are created in a transaction (insert order, insert items, update stock, commit or roll back).
- **Admin:** Protected admin dashboard. Promote a user with `node server/scripts/setAdmin.js <email>`.

```
client/            React app and the Playwright suite
  src/             Pages, components, contexts
  tests/
    api/           *.api.spec.js suites, support.js (fixtures, factories)
    a11y/          axe-core accessibility suite
    e2e/           *.spec.js UI suites
    pages/         page objects (one class per page) and the App that bundles them
    fixtures/      E2E fixtures: app, shopper, admin
    support/       shared configuration
  playwright.config.js   projects: api, a11y, chromium
docs/              TEST_STRATEGY.md, KNOWN_DEFECTS.md
server/            Express API
  controllers/ models/ routes/ middleware/
  db/              setup.js and SQL migrations
  scripts/         migrate, seed, setAdmin
```

More detail on the suites: [`client/TESTING.md`](client/TESTING.md).

## Roadmap

- Manual keyboard and screen reader pass, recorded as a checklist (automated scanning finds only part of the problems).
- Contract check of API response shapes with a schema, shared by the API and UI tests.
- Mobile viewports (the UI tests run in desktop Firefox and WebKit, not on phone-sized screens).
- Next round of API test design: password policy, email case normalisation, rate limiting on login.
