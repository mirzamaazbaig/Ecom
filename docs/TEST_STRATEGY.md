# Test strategy

How this application is tested, why, and what is deliberately not tested. It is short on purpose: a strategy that nobody reads does not help.

## 1. Scope

**System under test:** a small online shop. React single-page client, Express REST API, PostgreSQL database. Features: registration and login (sessions), product catalogue with filters, sorting and search, cart (kept in the browser), checkout and order history, wishlist, product reviews, an admin dashboard for products.

**In scope:** functional behaviour through the UI and the API, authorisation, input validation, data integrity of orders and stock, accessibility of the customer pages and the admin dashboard.

**Out of scope (and why):**

| Not tested | Reason |
|---|---|
| Payments, email, third-party services | The application has none. The "Web3 receipt" feature is a mock. |
| Phone-sized screens and real mobile browsers | The UI tests run in desktop Chromium, Firefox and WebKit only. |
| Manual keyboard and screen reader testing | Not automated here, see section 6. |

## 2. Product risks and how they drive testing

Test effort follows risk: what would hurt most if it were wrong, and how likely it is to be wrong.

| # | Risk | Impact | Likelihood | Where it is tested |
|---|---|---|---|---|
| R1 | Orders oversell stock or charge the wrong price | High (money, trust) | High at the start: both defects were found in the first API run | API `TS_API_ORDER`, including concurrent orders and server-side pricing |
| R2 | A user sees or changes another user's data, or a customer reaches admin functions | High | Medium | API `TS_API_ADMIN`, `TS_API_WISH`, `TS_API_ORDER_008`; UI protected-route and admin access tests |
| R3 | Account takeover through weak session or password handling | High | Low | API `TS_API_AUTH` (bcrypt, no user enumeration, session lifecycle) |
| R4 | Invalid or hostile input causes errors or data damage (SQL injection, bad ids, bad ratings) | Medium | High: six validation defects found | API `TS_API_PROD_009`, `010`, `013`, validation cases in `TS_API_AUTH`, `TS_API_REV`, `TS_API_WISH`, `TS_API_ORDER` |
| R5 | Customers cannot complete a purchase (browse, cart, checkout) | High | Medium | UI `TS_PROD`, `TS_CART`, `TS_ORDER` |
| R6 | Users with disabilities cannot use the shop | Medium (legal and reputational) | High: 4 groups of violations on first scan | `TS_A11Y` |
| R7 | UI shows data that differs from the API (wrong prices, filters, totals) | Medium | Medium | UI tests cross-check against the API (`TC_PROD_007`, `008`) |
| R8 | Slow responses under load | Medium | Low at this size | Separate load test project (Locust), outside this repository |

## 3. Test levels and what each is for

| Level | Tool | Purpose | Count |
|---|---|---|---|
| API | Playwright `request` | Business rules, authorisation, validation, data integrity. Fast (seconds), no browser, checks persisted rows with SQL. Most behaviour is tested here. | 65 |
| UI end-to-end | Playwright (Chromium) | User journeys through the real interface: sign-up, browse, cart, checkout, wishlist, reviews, and the admin dashboard. Written with page objects. | 58 |
| Accessibility | Playwright and axe-core | WCAG 2.1 A and AA on every customer page and the admin dashboard. | 14 |

The pyramid is deliberately API-heavy: a rule such as "an order cannot exceed stock" is checked once, at the API, in milliseconds. The UI tests then only need to prove that the interface is wired to it.

## 4. Approach

- **Isolation:** every test creates its own user, and tests that depend on stock or price create their own product. No test depends on another's data or order, so everything runs in parallel. Tests do not count shared data that other tests change at the same time; they assert on what they created or on the requests they caused.
- **Page objects:** UI tests talk to page classes (locators and actions); assertions stay in the tests.
- **Deterministic waits:** no fixed sleeps; assertions wait for conditions.
- **Test data:** a seeded catalogue (8 products) plus data created per test through the API. Tests that need the database (admin promotion, row checks) connect with `DATABASE_URL`.
- **A defect is first a failing test:** a bug is reproduced by a test that asserts the correct behaviour. While the bug is open the test is marked `test.fail()` so the suite stays green and the test flags itself when the bug is fixed. See [`KNOWN_DEFECTS.md`](KNOWN_DEFECTS.md).
- **Proving a test can fail:** when a fix is written, the new tests are also run against the previous code to confirm they fail there.

## 5. Environments, entry and exit criteria

- **Environment:** the whole stack runs locally or in CI against a throwaway PostgreSQL database; GitHub Actions starts PostgreSQL as a service container for each run.
- **Run on:** every push and pull request.
- **Entry:** the application starts and the database is created, migrated and seeded.
- **Exit (a change may merge):** all three projects pass (`npm test`), no flaky test is left unexplained, and any new behaviour has a test.
- **Failure evidence:** HTML report on every run; screenshots, video and traces on failure.

## 6. Known limitations and next steps

| Gap | Why it matters | Next step |
|---|---|---|
| Automated accessibility scanning finds only part of the problems | Only a portion of WCAG issues can be detected by tools. Keyboard order, focus visibility, meaningful alternative text and screen reader announcements need a person. | Manual keyboard and screen reader pass on checkout, recorded as a checklist |
| No password policy or e-mail case normalisation tests | Both are unspecified behaviours; they need a product decision before tests | Agree the rules, then test them |
| API and accessibility tests run in Chromium only | The API tests use no browser; the axe scan is browser-independent in most rules but was run in Chromium | Acceptable; revisit if a browser-specific accessibility defect appears |
| No performance gate in this repository | See R8 | Load test project, run on a schedule |

## 7. Traceability: where each risk's tests live

| Risk | Test IDs |
|---|---|
| R1 | `TC_API_ORDER_005`, `009` to `016` |
| R2 | `TC_API_ADMIN_001` to `004`, `TC_API_ORDER_008`, `TC_API_WISH_006`, `TC_ORDER_006`, `007`, `TC_ADMIN_001`, `002` |
| R3 | `TC_API_AUTH_001` to `008` |
| R4 | `TC_API_PROD_009`, `010`, `013`, `014`; `TC_API_AUTH_009` to `011`; `TC_API_ORDER_013`, `014`; `TC_API_WISH_007`, `008`; `TC_API_REV_005` to `008` |
| R5 | `TC_PROD_*`, `TC_CART_*`, `TC_ORDER_*` |
| R6 | `TC_A11Y_001` to `014` |
| R7 | `TC_PROD_007`, `008`, `009`, `TC_ADMIN_003` and the UI tests that read prices and totals |
| Admin changes (add, edit, delete) | `TC_ADMIN_004` to `009`, with API checks that the change was stored |
