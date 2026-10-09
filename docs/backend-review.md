# FoodFreaky backend review

Reviewed on 10 October 2026, on `codex/backend`, including the current menu fixes.

Scope: all backend routes, controllers, middleware, models, startup, utilities, the maintenance script, package scripts, and the existing menu test. Frontend callers were checked where needed to understand backend behavior. This was a source review with focused local reproductions; production databases, secrets, deployment configuration, SMTP, Google sign-in, load metrics, and dependency vulnerability databases were not accessed.

Priorities: P1 should be addressed first because it can affect balances, order integrity, or account security. P2 affects reliability, performance, or expected functionality.

## Implementation progress

First batch completed on 10 October 2026:

- Finding 7 fixed: the checkout catch block logs the restaurant ID from the request and preserves the intended error response.
- Finding 3 partially fixed: checkout reads current store settings and rejects orders when the manual ordering switch is disabled. Missing settings retain the existing enabled default; a failed settings lookup prevents checkout. Automatic closing-time enforcement remains pending the daily reopening/schedule rules.
- Added `npm test` for database-free unit regressions and `npm run test:integration` for the existing MongoDB menu tests.
- Seven unit regressions pass, covering disabled/enabled ordering, missing settings, settings lookup failures, restaurant lookup failures, invalid IDs, and restaurant closure. Four tests failed against the previous controller before the fixes.

Second batch completed on 10 October 2026:

- Finding 1 fixed for transactional writes: checkout, credits and coupon reservations commit together. Added user-scoped retry keys and connected the checkout page. Legacy API callers can omit the key; full page reload recovery remains a follow-up.
- Finding 2 fixed: delivery status and rewards commit together; repeated delivery does not reward twice.
- Finding 4 fixed for new cancellations: cancellation and credit refund commit together and retries do not repeat refunds. Coupon usage is retained; historical cancelled orders are not retroactively repaired.
- Finding 5 partially fixed: backwards status changes are rejected and delivered/cancelled orders are terminal. Forward stage skipping remains supported. Delivery-admin mutation scope remains pending.
- The integration runner now manages an isolated local replica set and tests real HTTP/JWT plus financial concurrency and rollback.
- Deployment requires transaction support and the new unique partial checkout index. See `backend-order-safety.md` for behavior, limitations, and deployment prerequisites.

Branch retest completed on 10 October 2026:

- Re-ran the existing 24 tests and frontend production build successfully.
- Expanded menu coverage and reproduced the previously noted duplicate-category race: two simultaneous category additions produced two categories. The regression failed before the fix.
- Finding 12 partially fixed further: menu insertion now uses conditional atomic pushes, creating a category only if absent and retrying after a competing category change. Whole-menu replacement and the availability toggle remain pending.
- Added checks for simultaneous category creation, adding while deleting the last category item, and conflicting concurrent checkout intents using one retry key.
- Final results: 8 unit tests and 19 integration tests pass (27 total), all 40 backend JavaScript files pass syntax checks, and the production frontend build passes with existing warnings. No browser interaction suite exists in the frontend yet.
- Testing used isolated local MongoDB. Live SMTP, Google sign-in, deployment topology, production data and performance were not tested. The remaining findings below stay open unless explicitly marked fixed above.

The evidence references below describe the original review snapshot; code line numbers can change as fixes are applied.

## Findings and proposed work

### 1. P1 — Checkout is not an atomic operation

Evidence: `backend/controllers/orders.js:203` reads a balance; lines 264–279 separately save the order, debit the user, and increment coupon usage. No conditional balance reservation, transaction, or request idempotency key exists.

Two simultaneous orders can read the same credit balance and both use it, taking the balance below zero. Two requests can both pass a coupon's final-use check. A failure after saving the order leaves a partial checkout; a client retry can create another order.

Fix: make order creation, conditional credit debit, and coupon reservation one transaction; add a unique checkout request key for safe retries. Confirm the deployment supports MongoDB transactions before choosing the implementation.

### 2. P1 — Delivery rewards can be awarded more than once

Evidence: `backend/controllers/admin.js:189` checks the previously loaded status and `creditsEarned`, credits the user at line 198, then saves the order at line 205.

Two delivery requests can both observe an unrewarded order and both increment the user's balance. If the order save fails after the credit increment, a retry can award the reward again.

Fix: enforce one reward per order with a conditional state transition and transaction or uniquely keyed credit ledger.

### 3. P1 — Store closure is enforced only by the client

Evidence: `backend/controllers/orders.js:createOrder` checks restaurant availability but never reads `Setting`, `isOrderingEnabled`, or `orderClosingTime`. The switch is checked by the frontend checkout page.

A stale page or direct authenticated API call can still order after the global ordering switch is turned off. The configured closing time is not enforced in checkout either.

Fix: enforce the global ordering switch on the server. Define the intended daily schedule and timezone before enforcing closing time; retain the restaurant availability check.

### 4. P1 — Cancellation loses spent credits and races with acceptance

Evidence: `backend/controllers/orders.js:422` reads the order, checks its status, and saves `Cancelled`. It never refunds `creditsUsed` or adjusts coupon usage.

A customer cancelling an eligible order permanently loses credits already deducted during checkout. Acceptance and cancellation can both act on the same previous status and race to overwrite each other.

Fix: perform cancellation only if the database still has the eligible status; refund credits exactly once in the same transaction. Decide explicitly whether cancellation should restore a coupon use.

### 5. P1 — Status changes have no transition rules

Evidence: `backend/controllers/admin.js:183` validates membership in the status enum only.

The API permits `Cancelled → Delivered`, `Delivered → Preparing Food`, or other backwards transitions. Delivery admins can update any known order ID, even though their list endpoint exposes only today's orders.

Fix: define allowed transitions, protect terminal states, and enforce any intended delivery-admin date/assignment scope on mutation routes as well as listing routes. The date limitation is a policy inconsistency; the exact allowed mutation scope needs a business decision.

### 6. P1 — Password reset leaves existing sessions valid

Evidence: `backend/controllers/auth.js:162` changes the password and clears the reset token; `backend/middleware/auth.js:protect` checks only JWT validity and user existence. Google sessions last 30 days.

A token issued before a password reset remains usable until it expires, including a token held by someone the user is trying to lock out.

Fix: track a session version or password-change timestamp and reject older sessions. Consume reset tokens conditionally so simultaneous reset attempts cannot both succeed.

### 7. P2 — Order error handling throws another exception

Evidence: `backend/controllers/orders.js:293` uses `restaurant`, which is declared inside the `try` block and unavailable inside `catch`.

A database or validation failure produces `ReferenceError: restaurant is not defined`, masking the original failure and bypassing the controller's intended response.

Verification: reproduced locally by injecting a database lookup failure.

Fix: read `req.body.restaurant` in the catch block or declare the variable in the enclosing scope.

### 8. P2 — Pagination is unbounded and slows admin lists

Evidence: `backend/controllers/admin.js:115`, `backend/controllers/orders.js:311`, and `backend/controllers/restaurants.js:12` accept arbitrary parsed page/limit values. Admin count and list queries run sequentially and return hydrated documents. `frontend/src/pages/SuperAdminPage.jsx:33` requests 10,000 orders.

Large requests transfer and populate thousands of documents. Negative values cause bad query behavior, and the dashboard totals stop being complete once more than 10,000 orders exist.

Fix: validate and cap pagination, use lean/projection where appropriate, run independent queries concurrently, and provide separate aggregate summary totals. Connect the dashboard to real pagination before introducing a cap that would change its displayed totals.

### 9. P2 — Delivery status updates wait for SMTP

Evidence: `backend/controllers/admin.js:210` generates the PDF and awaits `sendEmail` at line 221 before returning at line 240. `backend/utils/sendEmail.js` creates a transporter per email.

The comment says email does not block the response, but the request actually waits for SMTP. Slow mail service makes a successful delivery update feel stalled; retries can trigger overlapping work.

Fix: save the status and enqueue a durable notification job. Reuse a configured transporter and add explicit timeouts. Actual latency needs live measurement.

### 10. P2 — Coupon creation drops requested limits and active status

Evidence: `backend/middleware/validate.js:242` omits `usageLimit`; validation strips unknown fields. `backend/controllers/coupons.js:20` reads `usageLimit` but omits `isActive` when constructing the document.

A requested limited-use coupon becomes unlimited. A request with `isActive: false` still creates an active coupon. Percentage values are not capped at 100.

Verification: reproduced the validator dropping `usageLimit: 5` locally; active-status omission confirmed from the controller.

Fix: align validation and controller fields, validate percentage bounds, and test the complete create route.

### 11. P2 — Bulk credit values are not validated

Evidence: `backend/routes/admin.js` attaches no body validator to `/credit-all-users`; `backend/controllers/admin.js:17` uses `amount || 25` and accepts `setToAmount`. Update calls omit update validators.

An explicit zero becomes 25; negative amounts can reduce every user's balance, and negative set values can violate the model's minimum. Mistyped inputs can produce a bulk operation rather than a clear validation error.

Fix: validate finite amounts and distinguish omitted fields from zero; define whether zero is allowed, enforce nonnegative balances, and reject ambiguous add/set requests.

### 12. P2 — Menu insertion and general restaurant updates still have concurrency gaps

Evidence: `backend/controllers/restaurantsAdmin.js:130` reads the full restaurant, checks category existence, and saves. `updateRestaurant` at line 70 accepts the request body directly and still permits complete menu replacement. Availability toggle at line 101 reads then writes the inverse.

Simultaneous additions to a new category can create duplicate categories. A legacy whole-menu replacement can erase another administrator's edits, including edits made through the newly fixed item routes. Overlapping toggle requests can both write the same inverse value.

Fix: make category creation/insertion concurrency-safe, validate and allowlist restaurant metadata, phase out full-menu replacement or require version checks, and use explicit availability updates or an atomic toggle. The earlier item update/delete fixes remain useful but do not cover these paths.

### 13. P2 — Rating writes are not consistent across order and restaurant

Evidence: `backend/controllers/orders.js:473` reads an unrated order, saves the rating at line 494, then reads and updates the restaurant average.

Concurrent submissions can both pass the unrated check. Reviews of different orders can overwrite each other's restaurant aggregate. A missing restaurant or failed aggregate save leaves an order marked rated without the corresponding aggregate; retry is then refused.

Fix: atomically claim the rating once and update a rating count/sum consistently, or calculate aggregates from rated orders. Handle deleted restaurants explicitly.

### 14. P2 — Invoice discount arithmetic counts credits twice

Evidence: `backend/utils/generateInvoicePdf.js:104` calculates discount as subtotal plus charges minus total, which already includes credits used. Lines 113–118 show those credits as a second deduction.

Example: subtotal plus charges 150, coupon discount 10, credits used 5, total 135. The invoice shows discount 15 plus credits 5, which implies 130 despite displaying total 135.

Fix: persist the coupon discount independently or subtract credits from the derived discount. Cover no coupon, coupon only, credits only, and combined usage.

### 15. P2 — Order pricing identifies menu items by name

Evidence: `backend/controllers/orders.js:75` builds a name-to-price map; menu item IDs are absent from the order input schema.

Identical names in different categories overwrite each other, so one dish can be charged at another dish's price. Renaming a dish also invalidates a previously built cart.

Fix: use immutable menu item IDs for lookup and store the name and price as order snapshots. Coordinate this with cart callers.

### 16. P2 — Passwords are changed by global input sanitization

Evidence: `backend/index.js` applies `sanitizeInput` to all requests; `backend/middleware/sanitizer.js` trims all strings and removes patterns, including from passwords.

Passwords with leading/trailing spaces are silently changed before hashing or comparison. Distinct submitted passwords can collapse to the same value.

Verification: reproduced with a password containing surrounding spaces.

Fix: preserve password bytes exactly; validate fields according to their type rather than applying blanket text rewriting.

### 17. P2 — API errors and deleted references are handled inconsistently

Evidence: most controllers catch validation/cast errors and return generic 500 responses, bypassing the shared error handler. `backend/controllers/orders.js:497` assumes the restaurant exists; line 532 assumes the populated order user exists. Restaurant deletion does not address historical order references. Admin exports use server-local day boundaries (`backend/controllers/admin.js:255`).

Bad IDs are often reported as server failures. Historical rating/invoice operations can crash after related records are removed. Daily reports and delivery-admin lists may show the wrong India-local day when deployed in UTC.

Fix: validate IDs consistently, preserve historical snapshots or use soft deletion, handle missing references, and use an explicit business timezone for daily boundaries. Timezone impact depends on deployment configuration.

## Deployment-dependent security checks

- `backend/middleware/rateLimiter.js:getClientIp` trusts client-provided forwarding headers directly. If the backend is reachable without a proxy that strips/overwrites those headers, callers can rotate them to bypass IP limits. Verify ingress controls; use the trusted proxy chain and normalized IP keys. The general limiter also skips successful requests, so it cannot bound sustained successful API traffic.
- `backend/controllers/auth.js:googleAuth` does not require a configured Google audience at startup or inspect `email_verified` before linking by email. Verify configuration and enforce verified identity claims before account linking. Existing email-account linking does not set `isVerified`, leaving inconsistent Google/password behavior.
- `backend/models/User.js` hides passwords but not OTP/reset-token-hash fields; `getMe` returns the default document. Confirmed locally that serialization includes these fields. Use an explicit public profile projection. A reset-token hash is not the raw reset credential, so this finding alone does not demonstrate account takeover.
- Password-reset rate limiting skips requests without a body email, which is the normal reset-token request. Add a token/IP limiter appropriate to that route.

## Validation and limits

- Syntax checks passed for all 36 backend JavaScript files.
- Four focused local reproductions confirmed the coupon limit stripping, password alteration, order catch exception, and default sensitive-field serialization.
- Concurrency and partial-write findings follow directly from the independent read/write sequences; this review did not load-test them against production.
- The earlier menu integration test passed against isolated MongoDB in the previous work. It injects an authenticated identity, so it checks role authorization but does not constitute an end-to-end JWT test.
- At review time, `backend/package.json` had no test script. The first fix batch adds a database-free unit test command. The second batch adds an integration runner that starts and cleans up its own temporary replica set; `mongod` must be available on PATH.
- Startup begins listening before the database connection resolves, and `/health` always reports UP. Add readiness checking and orderly shutdown as operational follow-up.

## Recommended implementation sequence

1. Repair checkout error handling and enforce store availability on the server.
2. Implement atomic checkout, delivery rewards, cancellation refunds, and order transition rules together.
3. Fix coupon/bulk-credit validation and invoice arithmetic.
4. Replace the large dashboard fetch with pagination and server summaries; move delivery email to a durable queue.
5. Harden session invalidation, account linking, input handling, and proxy/rate-limit configuration.
6. Complete concurrency-safe menu insertion, stable menu IDs, rating consistency, historical references, timezone handling, and reproducible tests.

The review initially changed no application behavior. Implementation progress is tracked above; current fixes remain local and uncommitted on the backend branch.
