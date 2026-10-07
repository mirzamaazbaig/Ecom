# Defects found by the test suite

The API test suite found six defects in the application under test. All six have been fixed. For each one the sequence was the same: write a test that asserts the correct behaviour, confirm it fails against the application, fix the application, confirm the test passes. While a defect was open its test was marked `test.fail()` (an expected failure), and that marker was removed when the fix landed.

| ID | Severity | Area | Summary | Status | Test |
|---|---|---|---|---|---|
| D1 | High | Orders | Stock is not checked; ordering more than is available succeeds and stock goes negative | Fixed | `TC_API_ORDER_009`, `010`, `011`, `015`, `016` |
| D2 | High | Orders | Item prices and `totalAmount` are taken from the request body, so a client can buy at any price | Fixed | `TC_API_ORDER_012` |
| D3 | Medium | Auth | Registration accepts any string as an email address | Fixed | `TC_API_AUTH_009` |
| D4 | Low | Auth | Registration with a missing email or password returns 500 | Fixed | `TC_API_AUTH_010`, `011` |
| D5 | Low | Products | `GET /api/products/abc` returns 500 | Fixed | `TC_API_PROD_013`, `014` |
| D6 | Medium | Validation | Unknown product ids and out-of-range ratings surface as generic 500s | Fixed | `TC_API_ORDER_013`, `014`, `TC_API_WISH_007`, `008`, `TC_API_REV_006`, `007`, `008` |
| D7 | Medium | Products | Deleting a product that customers have ordered returns 500 (the foreign key error leaks out) | Fixed | `TC_API_ADMIN_009` |

## Fixed

### D1: order exceeds stock (High)
- **Found with:** `POST /api/orders` for a product with `stock = 2` and `quantity = 5` returned `201 Created`. The schema has no `CHECK (stock >= 0)`, so stock would go negative.
- **Cause:** `OrderModel.create` ran `UPDATE products SET stock = stock - $1` with no check.
- **Fix:** the product rows are locked (`SELECT ... FOR UPDATE`, in id order) inside the transaction, all lines are validated against stock before anything is written, and an unavailable line rejects the whole order with `409 Insufficient stock`. Duplicate lines for the same product are combined first.
- **Verified by:** exact-stock boundary (`TC_API_ORDER_011`), all-or-nothing multi-item order (`009`), combined duplicate lines (`015`) and two concurrent orders for the last unit, where exactly one succeeds (`016`). Against the unfixed code, these tests fail.

### D2: client-controlled prices (High)
- **Found with:** an order for a product that costs 100, sent with `"price": 0.01`, was stored with `price_at_purchase = 0.01`.
- **Cause:** `price` and `totalAmount` were read from `req.body` and inserted as is.
- **Fix:** the server reads the price from `products` and computes the total (in cents) itself; client-sent prices and totals are ignored. The UI is unchanged: it still sends them, they are just not trusted.
- **Verified by:** `TC_API_ORDER_012`.

### D3: no email format validation (Medium)
- **Found with:** `POST /api/auth/register` with `{"email": "not-an-email", ...}` returned `201 Created`.
- **Fix:** the email must be text of at most 255 characters and match `local@domain.tld`; otherwise `400`.
- **Verified by:** `TC_API_AUTH_009` (unique malformed email per run, and checks nothing was stored).

### D4: missing registration fields give 500 (Low)
- **Found with:** `POST /api/auth/register` with `{}` returned `500` (bcrypt received `undefined`).
- **Fix:** email and password must be non-empty text (password at most 72 characters, the bcrypt limit); otherwise `400 Email and password are required`. Login got the same check.
- **Verified by:** `TC_API_AUTH_010` (seven malformed bodies including wrong types), `TC_API_AUTH_011`.

### D5: non-numeric product id gives 500 (Low)
- **Found with:** `GET /api/products/abc` returned `500` (Postgres rejected the cast to integer).
- **Fix:** ids are validated as positive integers within the Postgres range before any query; otherwise `400 Invalid product id`. Applied to get, update and delete.
- **Verified by:** `TC_API_PROD_013` (six invalid ids including a SQL fragment), `TC_API_PROD_014`.

### D6: database errors leak out as 500 (Medium)
- **Found with:** unknown product ids in orders, wishlist and reviews, and `rating: 99`, all returned `500`.
- **Fix:** orders return `404` for an unknown product and `400` for invalid quantities or product ids (see D1); wishlist and reviews validate `product_id` (`400`), check the product exists (`404`), and reviews require a whole-number rating from 1 to 5 (`400`). Reading reviews and removing from the wishlist validate their id parameter.
- **Verified by:** the tests listed in the table.

### D7: deleting an ordered product gives 500 (Medium)
- **Found with:** the database test suite (`ecommerce-db-pytest`): an admin deleted a product that had been ordered; `order_items` references it, PostgreSQL refused, and the API answered `500 Server error`.
- **Fix:** the foreign key violation (`23503`) is answered with `409 Product has been ordered and cannot be deleted`; the product and the order history stay as they were.
- **Verified by:** `TC_API_ADMIN_009` fails on the old code and passes on the fix.

## Schema safeguards that were missing (found by the database suite, fixed by migration 002)

The schema accepted data that no part of the shop should ever store. The application code prevents most of it, but a database that relies on that is one bug away from bad data (D1 let stock go negative for exactly this reason).

| ID | Missing safeguard | Now |
|---|---|---|
| S1 | `products.stock` could be negative or NULL | `NOT NULL`, `CHECK (stock >= 0)` |
| S2 | `products.price` could be negative | `CHECK (price >= 0)` |
| S3 | An order line could have quantity 0 or less, or a negative price | `CHECK (quantity > 0)`, `CHECK (price_at_purchase >= 0)` |
| S4 | An order line could have no order or no product | `NOT NULL` on both columns |
| S5 | An order could have a negative total or no user | `CHECK (total_amount >= 0)`, `NOT NULL` on `user_id` |
| S6 | `users.role` accepted any text | `NOT NULL`, `CHECK (role IN ('user', 'admin'))` |
| S7 | Migration 001 inserted dummy reviews again on every run, and `migrate.js` ran only 001 | The seed is guarded; `migrate.js` runs every file in `db/migrations` in order; 002 is idempotent |

Each was first written as an expected failure (`xfail`, strict) in the database suite, then closed by `db/migrations/002_add_integrity_constraints.sql`.

Not changed because they need a product decision: the allowed order statuses (only `pending` is ever written), one review per user and product, and case-insensitive email uniqueness.

## Accessibility defects (found with axe-core, fixed)

The accessibility scan (`TS_A11Y`, WCAG 2.1 level A and AA) failed on all 11 customer pages when it was first run, and on the admin dashboard when that was added (A5). A6 was found earlier, while writing the admin page object. Findings, grouped by cause:

| ID | Impact | Where | Finding | Fix |
|---|---|---|---|---|
| A1 | Critical | Every page | The category dropdown in the search bar has no accessible name (`select-name`) | `aria-label="Search category"` |
| A2 | Critical | Home, product details | The sort dropdown and the review rating dropdown have no name or label (`select-name`) | `aria-label="Sort by"`; the rating label is now tied to its field (`htmlFor`) |
| A3 | Critical | Home, product details | The price slider, the quantity input and the review text area have no label (`label`) | `aria-label="Maximum price"` and `"Quantity"`; the comment label is tied to its field |
| A4 | Serious | Product details, cart, profile | Text contrast below 4.5:1: red outline buttons (4.11:1 on the grey page background), green buttons, the green "Active" text and green badges (`color-contrast`) | Darker shades of the same hues, defined once in `index.css` |

| A5 | Serious | Admin dashboard | The inactive "Orders" / "Products" tab text is white on the light grey page (contrast 1.1:1, practically invisible). A rule meant for the dark navbar, `.nav-link { color: white !important }`, applied to every `.nav-link` | The rule is scoped to `.navbar .nav-link`; the inactive tab uses a darker blue |
| A6 | Critical | Admin dashboard | The product form's labels are not tied to their inputs (Name, Price, Description, Stock, Image URL), so screen readers announce unnamed fields. Found when the page object could not locate the fields by label; fixed before the accessibility scan ran, so the scan never reported it | `htmlFor` and matching ids |

Each customer page's scan failed before its fix and passes after it; the same is true of A5. The scan covers what axe-core can detect automatically; it does not replace keyboard and screen reader testing (see [`TEST_STRATEGY.md`](TEST_STRATEGY.md)).

## Responsive defects (found by running the UI tests at phone size, fixed)

Running the 58 UI tests at 393 x 851 (touch) failed 29 of them on the first run. Most were the tests clicking links hidden behind the collapsed menu, which is expected behaviour; the page objects now open the menu first (`NavBar.openMenu`). After that, six tests still failed and showed three real defects:

| ID | Impact | Where | Finding | Fix | Shown by |
|---|---|---|---|---|---|
| M1 | Medium | Home page | The sidebar with the category list, the price slider and the sort selector was `d-none d-md-block`: on a phone there was no way to sort or limit the price (the category dropdown in the menu still worked) | The sidebar is always shown and stacks above the products on small screens | `TC_PROD_007` to `010` on `mobile-chrome` |
| M2 | Medium | Admin dashboard | The product and order tables overflowed the screen; other cells overlapped the Edit and Delete buttons, so they could not be tapped | Both tables are wrapped in `.table-responsive` (they scroll sideways) | `TC_ADMIN_005`, `006` on `mobile-chrome` |
| M3 | Critical (accessibility) | Every page, phone width | The hamburger button has no accessible name (axe `button-name`); it is hidden on wide screens, so the desktop scans never saw it | `aria-label="Toggle navigation"`, `aria-controls` and `aria-expanded` | `TC_A11Y_015`, `016` |

All of them fail on the previous code and pass on the fix (the accessibility tests were run against the unfixed app first and failed on `button-name`).

## Not covered by these fixes

- No password strength policy (any non-empty password up to 72 characters is accepted) and emails are not normalised to lower case, so `A@x.com` and `a@x.com` are different accounts. Neither was reported as a defect; both are candidates for the next round of test design.
