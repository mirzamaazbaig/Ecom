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

## Not covered by these fixes

- No password strength policy (any non-empty password up to 72 characters is accepted) and emails are not normalised to lower case, so `A@x.com` and `a@x.com` are different accounts. Neither was reported as a defect; both are candidates for the next round of test design.
