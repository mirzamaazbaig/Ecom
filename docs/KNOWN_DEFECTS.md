# Defects found by the test suite

The API test suite found six defects in the application under test. Two high-severity ones (D1, D2) and the order part of D6 have been fixed; the rest are intentionally left open as a worked example of how known defects are tracked. Every open defect is pinned by an automated test that asserts the *correct* behaviour and is marked `test.fail()`: while the defect exists the test is reported as an expected failure; as soon as it is fixed the test starts passing, Playwright reports an unexpected pass, and the `test.fail()` line should be removed.

| ID | Severity | Area | Summary | Status | Test |
|---|---|---|---|---|---|
| D1 | High | Orders | Stock is not checked; ordering more than is available succeeds and stock goes negative | **Fixed** | `TC_API_ORDER_009`, `010`, `011`, `015`, `016` |
| D2 | High | Orders | Item prices and `totalAmount` are taken from the request body, so a client can buy at any price | **Fixed** | `TC_API_ORDER_012` |
| D3 | Medium | Auth | Registration accepts any string as an email address | Open | `TC_API_AUTH_009` |
| D4 | Low | Auth | Registration with a missing email or password returns 500 | Open | `TC_API_AUTH_010` |
| D5 | Low | Products | `GET /api/products/abc` returns 500 | Open | `TC_API_PROD_013` |
| D6 | Medium | Validation | Unknown product ids and out-of-range ratings surface as generic 500s | Orders fixed; wishlist and reviews open | `TC_API_ORDER_013`, `014`; open: `TC_API_WISH_007`, `TC_API_REV_006`, `TC_API_REV_007` |

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

### D6, orders part
- **Found with:** `POST /api/orders` with an unknown product id returned `500` (the transaction rolled back correctly, but the status was wrong).
- **Fix:** unknown product returns `404`; non-positive or non-integer quantities and invalid product ids return `400`.
- **Verified by:** `TC_API_ORDER_013`, `TC_API_ORDER_014`.

## Open

### D3: no email format validation (Medium)
- **Request:** `POST /api/auth/register` with `{"email": "not-an-email", "password": "..."}`.
- **Expected:** 400. **Actual:** `201 Created`, user stored with that email.

### D4: empty registration body gives 500 (Low)
- **Request:** `POST /api/auth/register` with `{}`.
- **Expected:** 400 with a message naming the missing fields. **Actual:** `500 {"message":"Server error"}` (bcrypt receives `undefined`).

### D5: non-numeric product id gives 500 (Low)
- **Request:** `GET /api/products/abc`.
- **Expected:** 400 or 404. **Actual:** `500`; Postgres rejects the cast to integer and the error is not handled.

### D6, wishlist and reviews part (Medium)
All return `500` instead of a 4xx:
- `POST /api/wishlist` with an unknown `product_id`.
- `POST /api/reviews` with `rating: 99` (blocked by the database `CHECK`, but not validated by the API) or an unknown `product_id`.

Suggested fix for D3 to D6: validate request bodies in the controllers (or with a schema library) and map known database errors (`23503`, `23514`, `22P02`) to 4xx responses.
