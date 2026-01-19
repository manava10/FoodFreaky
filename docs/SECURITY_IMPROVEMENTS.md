# Security Improvements - FoodFreaky Backend

## Overview

This document summarizes the security improvements made to the FoodFreaky backend to ensure robust server-side validation of all data received from the frontend.

---

## 🔐 Critical Security Fixes

### 1. Server-Side Price Validation (`controllers/orders.js`)

**Problem:** Previously, the backend trusted all prices sent from the frontend, including `itemsPrice`, `taxPrice`, and `totalPrice`. An attacker could manipulate these values to place orders at lower prices.

**Solution:** Complete overhaul of the `createOrder` function:

- **Item Price Verification**: Each item's price is now verified against the restaurant's menu in the database.
  ```javascript
  const actualPrice = priceMap[item.name.toLowerCase().trim()];
  // Always use DATABASE price, never frontend price
  verifiedItems.push({ name: item.name, quantity: item.quantity, price: actualPrice });
  ```

- **Server-Side Tax Calculation**: Tax is now calculated on the server using tiered rates:
  - < ₹500: 9%
  - ₹500-749: 8.5%
  - ₹750-999: 7.5%
  - ₹1000+: 6.25%

- **Server-Side Shipping Calculation**: Shipping is calculated based on restaurant type and order value.

- **Coupon Re-Verification**: Coupons are validated again at order creation time, checking:
  - Existence and active status
  - Expiration date
  - Usage limits
  - Discount calculation

- **Security Logging**: Price discrepancies between frontend and server values are logged for monitoring.

### 2. Input Validation

- **Item Quantities**: Must be integers between 1 and 100
- **Item Names**: Must be non-empty strings
- **Shipping Address**: Required and trimmed
- **Restaurant ID**: Validated as valid MongoDB ObjectId
- **Rating**: Must be integer 1-5
- **Review**: Max 1000 characters

---

## 🛡️ New Security Middleware

### Rate Limiting (`middleware/rateLimiter.js`)

Different rate limits for different endpoints to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Order Creation | 10 requests | 15 minutes |
| Authentication | 10 requests | 15 minutes |
| Coupon Validation | 20 requests | 15 minutes |

### Input Sanitization (`middleware/sanitizer.js`)

- **XSS Prevention**: Removes `<script>` tags and event handlers
- **Prototype Pollution Prevention**: Blocks `__proto__`, `constructor`, `prototype` keys
- **JavaScript URL Prevention**: Removes `javascript:` URLs
- **String Trimming**: Whitespace is trimmed from all string inputs
- **ObjectId Validation**: Validates MongoDB ObjectId formats

---

## 📁 Files Modified

### New Files
- `middleware/rateLimiter.js` - Rate limiting middleware
- `middleware/sanitizer.js` - Input sanitization middleware
- `docs/SECURITY_IMPROVEMENTS.md` - This documentation

### Updated Files
- `controllers/orders.js` - Complete security overhaul of order creation
- `routes/orders.js` - Added rate limiting and validation middleware
- `routes/auth.js` - Added rate limiting for auth endpoints
- `routes/coupons.js` - Added rate limiting for coupon validation
- `index.js` - Added global rate limiting and input sanitization

---

## 🔍 Security Checklist (Post-Implementation)

| Security Check | Status |
|----------------|--------|
| Item prices verified from DB | ✅ **IMPLEMENTED** |
| itemsPrice calculated on server | ✅ **IMPLEMENTED** |
| Tax calculated on server | ✅ **IMPLEMENTED** |
| Shipping calculated on server | ✅ **IMPLEMENTED** |
| Coupon discount verified at order time | ✅ **IMPLEMENTED** |
| Total price calculated on server | ✅ **IMPLEMENTED** |
| Input validation (quantities, names) | ✅ **IMPLEMENTED** |
| Rate limiting | ✅ **IMPLEMENTED** |
| Input sanitization | ✅ **IMPLEMENTED** |
| ObjectId validation | ✅ **IMPLEMENTED** |
| XSS prevention | ✅ **IMPLEMENTED** |
| Prototype pollution prevention | ✅ **IMPLEMENTED** |
| Security logging | ✅ **IMPLEMENTED** |

---

## 🧪 Testing Recommendations

1. **Price Manipulation Test**: Try to place an order with modified item prices using an intercepting proxy (e.g., Burp Suite). The server should use database prices.

2. **Coupon Abuse Test**: Try to use an expired/invalid coupon or claim a larger discount than allowed.

3. **Rate Limiting Test**: Send more than 10 order requests in 15 minutes. Should receive 429 Too Many Requests.

4. **Invalid Input Test**: Send invalid quantities (negative, > 100, non-integer) and verify rejection.

5. **XSS Test**: Include script tags in shipping address and verify they're sanitized.

---

## 📝 Logging

Security-related events are logged with `[SECURITY]` prefix:

```javascript
console.warn(`[SECURITY] Price mismatch for item "${item.name}": Frontend sent ₹${item.price}, DB has ₹${actualPrice}. User: ${req.user.id}`);
console.warn(`[SECURITY] Total price discrepancy detected. Frontend: ₹${frontendTotalPrice}, Server: ₹${finalTotalPrice}. User: ${req.user.id}`);
```

Monitor these logs to detect potential manipulation attempts.

---

## 🚀 Dependencies Added

```bash
npm install express-rate-limit
```

---

## 🔮 Future Recommendations

1. **Per-User Rate Limiting**: Consider using user ID instead of IP for authenticated routes
2. **Logging to External Service**: Send security logs to a monitoring service (e.g., Sentry, DataDog)
3. **CAPTCHA**: Add CAPTCHA for suspicious activity patterns
4. **Two-Factor Authentication**: Add 2FA for admin accounts
5. **Audit Trail**: Log all price calculations for order disputes

---

*Last Updated: January 19, 2026*
