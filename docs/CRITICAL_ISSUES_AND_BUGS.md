# 🚨 Critical Issues and Bugs Found in FoodFreaky

This document outlines all critical issues, bugs, security vulnerabilities, and potential problems discovered during comprehensive code review.

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **Password Not Re-hashed in Registration** ⚠️ CRITICAL
**Location**: `backend/controllers/auth.js:41`
**Issue**: When updating an existing unverified user, the password is set directly without hashing
```javascript
// Line 41 - BUG: Password is not hashed!
user.password = password; // You must re-hash the password
```
**Impact**: Plain text password stored in database (if user.save() triggers before pre-save hook)
**Fix**: 
```javascript
if (user && !user.isVerified) {
    user.name = name;
    user.contactNumber = contactNumber;
    user.otp = otp;
    user.otpExpires = otpExpires;
    // Mark password as modified to trigger pre-save hook
    user.password = password;
    user.markModified('password'); // This ensures it goes through the pre-save hook
    await user.save();
}
```

---

### 2. **Missing User Check in Auth Middleware** ⚠️ CRITICAL
**Location**: `backend/middleware/auth.js:23`
**Issue**: If user is deleted but token is still valid, `req.user` will be `null` and causes errors
```javascript
req.user = await User.findById(decoded.id);
// No check if user exists!
next();
```
**Impact**: Server crashes when accessing protected routes with deleted user tokens
**Fix**:
```javascript
req.user = await User.findById(decoded.id);
if (!req.user) {
    return res.status(401).json({ msg: 'User no longer exists' });
}
next();
```

---

### 3. **No Rate Limiting** ⚠️ HIGH
**Location**: All routes
**Issue**: No rate limiting on authentication endpoints
**Impact**: Vulnerable to brute force attacks, DDoS, API abuse
**Fix**: Add `express-rate-limit` middleware
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

router.post('/login', loginLimiter, login);
```

---

### 4. **Email Domain Validation Bypass** ⚠️ MEDIUM
**Location**: `backend/controllers/auth.js:22-23`
**Issue**: Email domain validation can be bypassed with malformed emails
```javascript
const emailDomain = email.split('@')[1];
// If email doesn't contain @, this will throw error or return undefined
```
**Impact**: Potential bypass of domain restriction
**Fix**:
```javascript
const emailParts = email.split('@');
if (emailParts.length !== 2 || !emailParts[1]) {
    return res.status(400).json({ msg: 'Invalid email format' });
}
const emailDomain = emailParts[1];
```

---

### 5. **No Input Validation/Sanitization on Backend** ⚠️ HIGH
**Location**: All controllers
**Issue**: No validation middleware using Joi or express-validator
**Impact**: Vulnerable to injection attacks, invalid data in database
**Fix**: Add validation middleware (Joi is already in package.json but not used!)

---

### 6. **CORS Allows Requests with No Origin** ⚠️ MEDIUM
**Location**: `backend/index.js:40-41`
**Issue**: CORS allows requests with no origin (mobile apps, curl)
```javascript
if (!origin) return callback(null, true);
```
**Impact**: Can be exploited if not properly secured
**Fix**: Only allow in development or specific use cases
```javascript
if (!origin) {
    // Only allow in development
    if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
    }
    return callback(new Error('Origin is required'), false);
}
```

---

## 🐛 CRITICAL BUGS

### 7. **Race Condition in Rating Calculation** ⚠️ HIGH
**Location**: `backend/controllers/orders.js:130-132`
**Issue**: Restaurant rating calculation can have race conditions
```javascript
const totalRating = restaurant.averageRating * restaurant.numberOfReviews;
const newNumberOfReviews = restaurant.numberOfReviews + 1;
const newAverageRating = (totalRating + rating) / newNumberOfReviews;
```
**Impact**: Incorrect ratings if multiple users rate simultaneously
**Fix**: Use atomic operations
```javascript
await Restaurant.findByIdAndUpdate(order.restaurant, {
    $inc: { numberOfReviews: 1 },
    $set: {
        averageRating: {
            $divide: [
                { $add: [
                    { $multiply: ['$averageRating', '$numberOfReviews'] },
                    rating
                ]},
                { $add: ['$numberOfReviews', 1] }
            ]
        }
    }
});
```
Or use transaction/mutex for critical sections.

---

### 8. **Missing Error Handling in Auth Middleware** ⚠️ HIGH
**Location**: `backend/middleware/auth.js:27-29`
**Issue**: No error handling for database errors
```javascript
} catch (error) {
    res.status(401).json({ msg: 'Not authorized, token failed' });
    // Doesn't handle database connection errors, etc.
}
```
**Impact**: Database errors are masked as auth failures
**Fix**: Proper error handling
```javascript
} catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Not authorized, token failed' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ msg: 'Server error' });
}
```

---

### 9. **No Validation for Order Items** ⚠️ MEDIUM
**Location**: `backend/controllers/orders.js:22-24`
**Issue**: Only checks if items array exists, not if items are valid
```javascript
if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'No order items' });
}
// No validation for item structure, price, quantity, etc.
```
**Impact**: Invalid orders can be created (negative prices, zero quantity, etc.)
**Fix**: Add validation
```javascript
if (!items || items.length === 0) {
    return res.status(400).json({ msg: 'No order items' });
}

// Validate each item
for (const item of items) {
    if (!item.name || typeof item.price !== 'number' || item.price <= 0) {
        return res.status(400).json({ msg: 'Invalid item data' });
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ msg: 'Invalid item quantity' });
    }
}
```

---

### 10. **Coupon Usage Not Checked Per User** ⚠️ MEDIUM
**Location**: `backend/controllers/coupons.js:70`
**Issue**: Only checks total usage, not per-user usage
```javascript
if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
    return res.status(400).json({ msg: 'This coupon has reached its usage limit' });
}
```
**Impact**: One user can use the same coupon multiple times
**Fix**: Track coupon usage per user in Order model or separate CouponUsage model

---

### 11. **Price Manipulation Risk** ⚠️ HIGH
**Location**: `backend/controllers/orders.js:11-20`
**Issue**: Client sends prices and totals - not validated against actual menu prices
```javascript
const { items, shippingAddress, itemsPrice, taxPrice, shippingPrice, totalPrice, ... } = req.body;
// Prices are trusted from client!
```
**Impact**: Users can manipulate prices and get items for free/cheaper
**Fix**: Recalculate prices from restaurant menu
```javascript
const restaurant = await Restaurant.findById(restaurantId);
let calculatedItemsPrice = 0;

for (const item of items) {
    const menuItem = restaurant.menu
        .flatMap(cat => cat.items)
        .find(menuItem => menuItem.name === item.name);
    
    if (!menuItem) {
        return res.status(400).json({ msg: `Item ${item.name} not found in menu` });
    }
    
    calculatedItemsPrice += menuItem.price * item.quantity;
}

// Recalculate totals on server
const calculatedTotal = calculatedItemsPrice + taxPrice + shippingPrice - discount;
```

---

### 12. **No Check for Restaurant Existence** ⚠️ MEDIUM
**Location**: `backend/controllers/orders.js:26-28`
**Issue**: Only checks if restaurant ID is provided, not if it exists
```javascript
if (!restaurant) {
    return res.status(400).json({ msg: 'Restaurant ID is required' });
}
// No check if restaurant actually exists
```
**Impact**: Orders can be created with invalid restaurant IDs
**Fix**: Validate restaurant exists
```javascript
const restaurantExists = await Restaurant.findById(restaurant);
if (!restaurantExists) {
    return res.status(404).json({ msg: 'Restaurant not found' });
}
```

---

### 13. **Inconsistent Error Response Format** ⚠️ LOW
**Location**: Multiple controllers
**Issue**: Some return `{ msg: '...' }`, others return `{ success: false, error: '...' }`
**Impact**: Frontend has to handle multiple error formats
**Fix**: Standardize error responses using errorHandler middleware

---

## 🔵 LOGIC ERRORS

### 14. **Division by Zero in Rating Calculation** ⚠️ MEDIUM
**Location**: `backend/controllers/orders.js:132`
**Issue**: If `restaurant.numberOfReviews` is 0, calculation might have issues
**Impact**: Incorrect rating calculation
**Fix**: Handle edge case
```javascript
if (restaurant.numberOfReviews === 0) {
    restaurant.averageRating = rating;
} else {
    const totalRating = restaurant.averageRating * restaurant.numberOfReviews;
    const newNumberOfReviews = restaurant.numberOfReviews + 1;
    restaurant.averageRating = (totalRating + rating) / newNumberOfReviews;
}
restaurant.numberOfReviews = newNumberOfReviews;
```

---

### 15. **Token Expiry Mismatch** ⚠️ MEDIUM
**Location**: `backend/controllers/auth.js:10-12` vs `78` vs `105`
**Issue**: Different token expiry times
- `generateToken`: 30 days
- `verifyOtp`: 1 hour
- `login`: 1 hour
**Impact**: Confusing user experience, inconsistent behavior
**Fix**: Use consistent token expiry (e.g., 7 days for refresh, 1 hour for access)

---

### 16. **Missing Error Handling in Email Sending** ⚠️ MEDIUM
**Location**: `backend/utils/sendEmail.js:20`
**Issue**: No try-catch, errors will propagate
```javascript
await transporter.sendMail(mailOptions);
// No error handling
```
**Impact**: Application crashes if email service fails
**Fix**: Add error handling
```javascript
try {
    await transporter.sendMail(mailOptions);
} catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
}
```

---

### 17. **No Validation for OTP Format** ⚠️ LOW
**Location**: `backend/controllers/auth.js:63-65`
**Issue**: OTP validation doesn't check format
**Impact**: Could accept invalid OTPs
**Fix**: Add format validation
```javascript
if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    return res.status(400).json({ msg: 'Invalid OTP format' });
}
```

---

### 18. **Cart Items Not Validated Against Restaurant Menu** ⚠️ MEDIUM
**Location**: Frontend cart, backend order creation
**Issue**: Items added to cart might not exist or have wrong prices
**Impact**: Users can order items that don't exist or have been removed
**Fix**: Validate cart items against restaurant menu before order creation

---

## 🟡 PERFORMANCE ISSUES

### 19. **No Pagination on Restaurant List** ⚠️ MEDIUM
**Location**: `backend/controllers/restaurants.js:8`
**Issue**: Returns all restaurants at once
```javascript
const restaurants = await Restaurant.find();
```
**Impact**: Slow response with many restaurants, high memory usage
**Fix**: Add pagination
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

const restaurants = await Restaurant.find()
    .skip(skip)
    .limit(limit);
```

---

### 20. **No Pagination on Orders** ⚠️ MEDIUM
**Location**: `backend/controllers/orders.js:60`
**Issue**: Returns all user orders
```javascript
const orders = await Order.find({ user: req.user.id })
```
**Impact**: Slow with many orders
**Fix**: Add pagination

---

### 21. **N+1 Query Problem in Order List** ⚠️ LOW
**Location**: `backend/controllers/orders.js:60-62`
**Issue**: Only populates restaurant name, might need more data later
**Impact**: Additional queries if more restaurant data needed
**Note**: Current implementation is fine, but be aware if adding more fields

---

### 22. **No Caching** ⚠️ LOW
**Location**: All controllers
**Issue**: No caching for frequently accessed data (restaurants, settings)
**Impact**: Unnecessary database queries
**Fix**: Add Redis caching for restaurants, settings

---

## 🟢 CODE QUALITY ISSUES

### 23. **Inconsistent Error Messages** ⚠️ LOW
**Location**: Multiple files
**Issue**: Some use `msg`, some use `message`, some use `error`
**Impact**: Inconsistent API responses
**Fix**: Standardize using errorHandler middleware

---

### 24. **Console.log in Production Code** ⚠️ LOW
**Location**: Multiple backend files (22 instances found)
**Issue**: Console.log/error used instead of proper logger
**Impact**: No structured logging, harder to debug production issues
**Fix**: Use Winston or similar logging library

---

### 25. **Missing Async Handler** ⚠️ LOW
**Location**: Multiple controllers
**Issue**: Some controllers use try-catch, some don't
**Impact**: Inconsistent error handling
**Fix**: Use asyncHandler middleware consistently

---

### 26. **No Request Validation** ⚠️ HIGH
**Location**: All routes
**Issue**: No validation middleware (Joi is installed but not used!)
**Impact**: Invalid data can reach controllers
**Fix**: Add validation middleware to all routes

---

### 27. **Frontend Environment Variable Not Validated** ⚠️ MEDIUM
**Location**: All frontend API calls
**Issue**: `process.env.REACT_APP_API_URL` might be undefined
**Impact**: API calls fail silently or to wrong endpoint
**Fix**: Add fallback or validation
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

---

### 28. **Missing Error Boundaries** ⚠️ LOW
**Location**: Frontend (ErrorBoundary exists but may not be used everywhere)
**Issue**: Not all routes wrapped in ErrorBoundary
**Impact**: Unhandled errors crash entire app
**Fix**: Wrap App.js with ErrorBoundary

---

### 29. **Inactivity Timer Issue** ⚠️ LOW
**Location**: `frontend/src/context/AuthContext.js:38-62`
**Issue**: Timer uses `isLoggedIn` in dependency array but defines `logout` without dependency
**Impact**: Potential stale closure issue
**Fix**: Add `logout` to dependency array or use useCallback

---

### 30. **Cart Confirmation Modal Access Issue** ⚠️ LOW
**Location**: `frontend/src/context/CartContext.js:122`
**Issue**: Accesses `cartItems[0].restaurant.name` without checking if cartItems exists
```javascript
Your cart contains items from <strong>{cartItems[0].restaurant.name}</strong>.
```
**Impact**: Potential crash if cartItems is empty
**Fix**: Add null check or use optional chaining

---

## 🔴 DATA INTEGRITY ISSUES

### 31. **No Transaction for Order Creation** ⚠️ MEDIUM
**Location**: `backend/controllers/orders.js:42`
**Issue**: Order creation and coupon update are not in a transaction
```javascript
const createdOrder = await order.save();
// If this fails, coupon is already updated
if (couponUsed) {
    await Coupon.updateOne(...);
}
```
**Impact**: Inconsistent state if coupon update fails
**Fix**: Use transactions
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
    const createdOrder = await order.save({ session });
    if (couponUsed) {
        await Coupon.updateOne(..., { session });
    }
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

---

### 32. **No Validation for Restaurant Menu Structure** ⚠️ MEDIUM
**Location**: Restaurant creation/update
**Issue**: Menu items can have invalid data (negative prices, empty names)
**Impact**: Invalid restaurant data in database
**Fix**: Add schema validation or controller validation

---

### 33. **Rating Can Be Updated Multiple Times** ⚠️ LOW
**Location**: `backend/controllers/orders.js:118-120`
**Issue**: Only checks if rating exists, but doesn't prevent updating
**Impact**: Users might rate multiple times (though current check prevents it)
**Note**: Current implementation is fine, but consider making rating immutable

---

## 🟠 DEPLOYMENT & CONFIGURATION ISSUES

### 34. **Hardcoded CORS Origins** ⚠️ MEDIUM
**Location**: `backend/index.js:27-32`
**Issue**: Hardcoded origins in code
**Impact**: Need to redeploy to add new origins
**Fix**: Move to environment variables
```javascript
const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
];
```

---

### 35. **No Environment Variable Validation** ⚠️ HIGH
**Location**: `backend/index.js`
**Issue**: No check if required env variables exist
**Impact**: App crashes at runtime with unclear error
**Fix**: Add validation at startup
```javascript
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USERNAME', 'EMAIL_PASSWORD'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
}
```

---

### 36. **Default Port Mismatch** ⚠️ LOW
**Location**: `backend/index.js:74`
**Issue**: Default port is 5001, but README says 5000
**Impact**: Confusion for developers
**Fix**: Align with documentation

---

## 📋 SUMMARY BY PRIORITY

### 🔴 CRITICAL (Fix Immediately)
1. Password not re-hashed in registration
2. Missing user check in auth middleware
3. No rate limiting
4. Price manipulation risk
5. No input validation on backend

### 🟠 HIGH (Fix Soon)
6. Race condition in rating calculation
7. Missing error handling in auth middleware
8. No validation for order items
9. No environment variable validation
10. Inconsistent error response format

### 🟡 MEDIUM (Fix When Possible)
11. Email domain validation bypass
12. CORS allows requests with no origin
13. Coupon usage not checked per user
14. No check for restaurant existence
15. Division by zero in rating calculation
16. Token expiry mismatch
17. Missing error handling in email sending
18. Cart items not validated
19. No pagination
20. No caching

### 🟢 LOW (Nice to Have)
21. Inconsistent error messages
22. Console.log in production
23. Missing async handler
24. Missing error boundaries
25. Hardcoded CORS origins

---

## 🛠️ RECOMMENDED FIX ORDER

1. **Week 1 (Critical)**
   - Fix password hashing bug
   - Add user check in auth middleware
   - Add rate limiting
   - Add input validation
   - Fix price manipulation

2. **Week 2 (High Priority)**
   - Fix rating race condition
   - Add environment variable validation
   - Improve error handling
   - Validate order items

3. **Week 3 (Medium Priority)**
   - Add pagination
   - Fix email validation
   - Add restaurant validation
   - Improve CORS handling

4. **Week 4 (Polish)**
   - Standardize error messages
   - Add logging library
   - Add caching
   - Fix code quality issues

---

## 📝 NOTES

- Joi is installed but not used - should implement validation middleware
- Winston mentioned in IMPROVEMENTS.md but not implemented
- Error handler exists but not all controllers use it properly
- Some features mentioned in docs (like asyncHandler) exist but aren't used consistently

---

**Last Updated**: Based on code review of entire codebase
**Total Issues Found**: 36
**Critical**: 5
**High**: 5
**Medium**: 10
**Low**: 16

