# 🚨 Quick Issues Summary - FoodFreaky

## Top 10 Critical Issues to Fix Immediately

### 1. 🔴 **Password Not Hashed** (CRITICAL)
- **File**: `backend/controllers/auth.js:41`
- **Issue**: Password set directly without hashing when updating unverified user
- **Risk**: Plain text password stored
- **Fix**: Ensure password goes through pre-save hook

### 2. 🔴 **Price Manipulation** (CRITICAL)
- **File**: `backend/controllers/orders.js`
- **Issue**: Client sends prices - not validated against menu
- **Risk**: Users can order items for free/cheaper
- **Fix**: Recalculate all prices from restaurant menu on server

### 3. 🔴 **No Rate Limiting** (CRITICAL)
- **File**: All auth routes
- **Issue**: No protection against brute force attacks
- **Risk**: Account compromise, API abuse
- **Fix**: Add `express-rate-limit` middleware

### 4. 🔴 **Missing User Check** (CRITICAL)
- **File**: `backend/middleware/auth.js:23`
- **Issue**: No check if user exists after token validation
- **Risk**: Server crashes with deleted user tokens
- **Fix**: Add null check for req.user

### 5. 🔴 **No Input Validation** (CRITICAL)
- **File**: All controllers
- **Issue**: No validation middleware (Joi installed but unused!)
- **Risk**: Injection attacks, invalid data
- **Fix**: Add validation middleware to all routes

### 6. 🟠 **Race Condition in Ratings** (HIGH)
- **File**: `backend/controllers/orders.js:130-132`
- **Issue**: Rating calculation not atomic
- **Risk**: Incorrect restaurant ratings
- **Fix**: Use atomic operations or transactions

### 7. 🟠 **No Environment Variable Validation** (HIGH)
- **File**: `backend/index.js`
- **Issue**: No check for required env vars at startup
- **Risk**: App crashes at runtime with unclear errors
- **Fix**: Validate env vars on startup

### 8. 🟠 **Order Items Not Validated** (HIGH)
- **File**: `backend/controllers/orders.js:22-24`
- **Issue**: Only checks if items exist, not if valid
- **Risk**: Invalid orders (negative prices, zero quantity)
- **Fix**: Validate item structure, price, quantity

### 9. 🟡 **No Pagination** (MEDIUM)
- **File**: `backend/controllers/restaurants.js:8`
- **Issue**: Returns all restaurants at once
- **Risk**: Slow response, high memory usage
- **Fix**: Add pagination

### 10. 🟡 **Coupon Usage Not Per User** (MEDIUM)
- **File**: `backend/controllers/coupons.js:70`
- **Issue**: Only checks total usage, not per-user
- **Risk**: One user can use coupon multiple times
- **Fix**: Track coupon usage per user

---

## Quick Stats

- **Total Issues Found**: 36
- **Critical**: 5
- **High**: 5
- **Medium**: 10
- **Low**: 16

---

## Priority Fix Order

### This Week (Critical)
1. Fix password hashing
2. Fix price manipulation
3. Add rate limiting
4. Add user check in auth
5. Add input validation

### Next Week (High Priority)
6. Fix rating race condition
7. Add env var validation
8. Validate order items
9. Improve error handling

### This Month (Medium Priority)
10. Add pagination
11. Fix coupon per-user tracking
12. Add restaurant validation
13. Improve CORS handling

---

**See `CRITICAL_ISSUES_AND_BUGS.md` for detailed analysis and fixes.**

