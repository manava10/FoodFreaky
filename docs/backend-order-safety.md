# Order and credit consistency

## Behavior

Checkout reads menu prices, current store availability, coupon limits, and the user's credit balance inside a MongoDB transaction. The new order, credit debit, and coupon usage increment either all commit or all roll back. The existing pricing rules remain: requested credits are limited to the available balance and 5% of the order value. Competing checkouts recompute that balance after a transaction retry.

The checkout page submits a random `checkoutKey` and reuses it when the same payload is retried on that page. Repeating that key for the same user returns the existing order without another credit debit or coupon increment. Reusing it with different order inputs returns 409. Keys are scoped to the user. Clients that omit the optional key retain the previous request contract, but do not receive duplicate-request protection. The page's key is kept in memory; a full page reload starts a new attempt. Durable checkout recovery across reloads is a separate UI follow-up.

Delivery status changes and their 2% credit rewards commit together. Repeating an already committed delivery does not award another reward or trigger another email. Email remains outside the transaction; SMTP queuing and durable notification retries are still pending.

Both customer and admin cancellation use the same transaction service. Customers may cancel only while an order is waiting for acceptance. Admins may cancel nonterminal orders. Cancellation restores `creditsUsed` exactly once and records the amount in `creditsRefunded`. Coupon usage remains consumed, retaining the existing cancellation policy. No historical balance corrections are performed, and already-cancelled legacy orders are not retroactively refunded.

Order statuses may move forward, including skipping intermediate preparation stages as before. Backwards changes are rejected. Delivered and cancelled orders are terminal. Repeating the current status is harmless. The admin selector offers matching forward status choices and disables changes to terminal orders. Delivery-admin date or assignment restrictions are still pending.

## Deployment prerequisites

The database must support transactions: use a MongoDB replica set or a sharded deployment. A standalone MongoDB server is unsuitable for these operations. Unsupported transaction operations return 503 without falling back to independent balance/order writes. Production topology has not been inspected or changed.

The order collection requires the new unique partial index on `{ user: 1, checkoutKey: 1 }`. Its partial filter includes only string keys, so existing orders without a key remain valid. With the project's current default Mongoose index configuration, `Order.init()` completes index initialization before transactional writes. Deployments that disable automatic index creation must build the index separately before serving this version. Do not remove or disable this index: concurrent duplicate-request protection relies on it.

Deploy backend and frontend changes together to activate checkout keys in the application. Other API clients should include a validated key of 16–128 letters, digits, underscores, or hyphens for each checkout intent, and retain it on retries.

## Tests

From the backend directory:

- `npm test` runs eight isolated unit regressions without a database.
- `npm run test:integration` starts a temporary localhost-only MongoDB replica set, runs the menu and order integration tests, stops it, and removes its temporary database. It requires `mongod` on PATH; it does not load the application's `.env` or connect to application data.

Order integration coverage uses real HTTP, JWT authentication, authorization, MongoDB transactions and indexes. SMTP alone is stubbed. Cases cover simultaneous identical checkout, competing credit spending, coupon final-use contention, partial-write rollback, retry-key conflict and user isolation, store closure after a committed checkout, duplicate delivery, failed rewards, duplicate refunds, failed refunds, admin cancellation, acceptance/cancellation contention, terminal/backwards status protection, legacy delivered orders, deleted accounts, and unauthorized access.

The financial invariant tested is that the stored order and balance agree after both successful operations and injected failures. The menu tests still inject an identity but exercise real menu writes and role authorization.
