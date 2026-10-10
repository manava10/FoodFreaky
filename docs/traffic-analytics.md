# Superadmin website traffic

Only authenticated superadmins (`admin`) can read GET `/api/admin/traffic`. Customer and delivery-admin accounts receive 403; anonymous readers receive 401. Responses are not cached.

Customer pages send anonymous random browser visit IDs to POST `/api/traffic/heartbeat` every 30 seconds while visible. Guests count too. Signed-in staff and staff pages skip tracking; the server also excludes authenticated staff. No IP address, name, email, or browsing history is stored in visit records.

“Visitors online” counts browser visits seen within two minutes, not distinct people. Closing/hiding a page removes it from the count after that window. Devices and browser profiles count separately. Shared local storage and browser locks prevent normal refreshes and same-browser tabs from adding visits; browsers without locks may race on simultaneous first opens. Clearing storage starts a new visit.

“Total site visits” counts persisted visit records. After 30 minutes without a visible-page heartbeat, the browser generates a new visit ID. The total begins at deployment; past traffic cannot be reconstructed. Records must not be TTL-deleted, or historical totals will be lost. Indexed timestamps support presence and earliest-visit queries.

These are approximate first-party traffic metrics, not billing or verified unique-customer figures. Blocked tracking undercounts; synthetic public heartbeats can inflate counts. The public endpoint is rate limited using Express trusted IP handling. There is no third-party analytics service or dependency.

The dashboard polls every 30 seconds and displays an unavailable message on failure rather than a misleading zero. Shopping continues if tracking fails.

Verification: integration tests cover protected access with real JWTs, validation, staff exclusion, concurrent deduplication, active expiry, and cumulative retention.
