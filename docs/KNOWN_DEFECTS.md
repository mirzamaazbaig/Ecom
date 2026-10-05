# Known defects

Defects found by the API test suite in the application under test. They are **not fixed on purpose**: each one is pinned by an automated test that asserts the *correct* behaviour and is marked `test.fail()`. While the defect exists the test is reported as an expected failure; as soon as the defect is fixed the test starts passing, Playwright reports it as an unexpected pass, and the `test.fail()` line should be removed.

| ID | Severity | Area | Summary | Pinned by |
|---|---|---|---|---|
| D1 | High | Orders | Stock is not checked; ordering more than is available succeeds and stock goes negative | `TC_API_ORDER_010` |
| D2 | High | Orders | Item prices and `totalAmount` are taken from the request body, so a client can buy at any price | `TC_API_ORDER_011` |
| D3 | Medium | Auth | Registration accepts any string as an email address | `TC_API_AUTH_009` |
| D4 | Low | Auth | Registration with a missing email or password returns 500 | `TC_API_AUTH_010` |
| D5 | Low | Products | `GET /api/products/abc` returns 500 | `TC_API_PROD_013` |
| D6 | Medium | Validation | No input validation on orders, reviews and wishlist: unknown product ids and out-of-range ratings surface as generic 500s | `TC_API_ORDER_012`, `TC_API_WISH_007`, `TC_API_REV_006`, `TC_API_REV_007` |

## Details

### D1: order exceeds stock (High)
- **Request:** `POST /api/orders` with `{"totalAmount": 1, "items": [{"productId": <id>, "quantity": 5, "price": 1}]}` for a product with `stock = 2`.
- **Expected:** a 4xx response; stock unchanged.
- **Actual:** `201 Created`; `products.stock` becomes `-3`.
- **Cause:** `OrderModel.create` runs `UPDATE products SET stock = stock - $1` with no check and the column has no `CHECK (stock >= 0)`.

### D2: client-controlled prices (High)
- **Request:** `POST /api/orders` with `"price": 0.01` and `"totalAmount": 0.01` for a product that costs 100.
- **Expected:** the order is priced from `products.price`.
- **Actual:** the order is stored with `price_at_purchase = 0.01`.
- **Cause:** `price` and `totalAmount` are read from `req.body` and inserted as is.

### D3: no email format validation (Medium)
- **Request:** `POST /api/auth/register` with `{"email": "not-an-email", "password": "..."}`.
- **Expected:** 400.
- **Actual:** `201 Created`, user stored with that email.

### D4: empty registration body gives 500 (Low)
- **Request:** `POST /api/auth/register` with `{}`.
- **Expected:** 400 with a message naming the missing fields.
- **Actual:** `500 {"message":"Server error"}` (bcrypt receives `undefined`).

### D5: non-numeric product id gives 500 (Low)
- **Request:** `GET /api/products/abc`.
- **Expected:** 400 or 404.
- **Actual:** `500`; Postgres rejects the cast to integer and the error is not handled.

### D6: database errors leak out as 500 (Medium)
Examples, all returning `500` instead of a 4xx:
- `POST /api/orders` with an unknown `productId` (the transaction is correctly rolled back, see `TC_API_ORDER_009`, but the status is wrong).
- `POST /api/wishlist` with an unknown `product_id`.
- `POST /api/reviews` with `rating: 99` (blocked by the database `CHECK`, but not validated by the API) or an unknown `product_id`.

Suggested fix for D3 to D6: validate request bodies in the controllers (or with a schema library) and map known database errors (`23503`, `23514`, `22P02`) to 4xx responses.
