/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting the number of requests
 * 
 * DESIGNED FOR SHARED NETWORKS (1000+ users on same IP like hostels/universities)
 * 
 * Strategy:
 * 1. IP-based limits are intentionally HIGH (just DDoS protection)
 * 2. User-based limits (by email/phone) provide the REAL security
 * 3. Successful requests don't count against limits
 * 4. Rate Limiter got high
 */

const rateLimit = require('express-rate-limit');

// =============================================================================
// GENERAL API LIMITER
// Very high limit - just protects against DDoS, not abuse
// =============================================================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // 5000 requests per IP per 15min (handles 1000+ users)
    message: {
        success: false,
        msg: 'Server is experiencing high traffic. Please try again in a few minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests - only count failures/suspicious activity
    skipSuccessfulRequests: true,
});

// =============================================================================
// ORDER LIMITER - Per User (not per IP)
// =============================================================================
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 orders per user per 15min (reasonable limit)
    message: {
        success: false,
        msg: 'Too many order attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Key by user ID from auth token if available, otherwise by IP
    keyGenerator: (req) => {
        // If user is authenticated, use their user ID instead of IP
        if (req.user && req.user.id) {
            return `order_user_${req.user.id}`;
        }
        // Fallback to IP for non-authenticated requests (shouldn't happen for orders)
        return `order_ip_${req.ip}`;
    },
});

// =============================================================================
// AUTH RATE LIMITERS - HYBRID APPROACH
// =============================================================================

// IP-based auth limiter - HIGH limit for shared networks
// This is just a safety net against massive DDoS attacks
const authIpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 auth attempts per IP per 15min (1 per user average)
    message: {
        success: false,
        msg: 'Too many authentication attempts from this network. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

// User-based auth limiter - STRICT limit per email/phone
// This is the REAL protection against brute-force attacks
const authUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 failed attempts per email/phone
    message: {
        success: false,
        msg: 'Too many login attempts for this account. Please try again after 15 minutes or reset your password.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use email or phone from request body as the unique key
        const identifier = req.body?.email?.toLowerCase() ||
            req.body?.phone ||
            req.body?.phoneNumber ||
            'unknown';
        return `auth_user_${identifier}`;
    },
    // Skip if no email/phone provided - let other validation handle it
    skip: (req) => !req.body?.email && !req.body?.phone && !req.body?.phoneNumber,
    // Don't count successful logins
    skipSuccessfulRequests: true,
});

// Combined auth limiter - applies BOTH limiters in sequence
const authLimiter = [authIpLimiter, authUserLimiter];

// =============================================================================
// COUPON LIMITER - Per User
// =============================================================================
const couponLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // High IP limit for shared networks
    message: {
        success: false,
        msg: 'Too many coupon validation attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =============================================================================
// OTP LIMITER - Per Phone/Email (strict to prevent SMS/email bombing)
// =============================================================================
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour (longer window for OTP)
    max: 3, // Only 3 OTP requests per hour per email/phone
    message: {
        success: false,
        msg: 'Too many OTP requests. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const identifier = req.body?.email?.toLowerCase() ||
            req.body?.phone ||
            req.body?.phoneNumber ||
            'unknown';
        return `otp_${identifier}`;
    },
    skip: (req) => !req.body?.email && !req.body?.phone && !req.body?.phoneNumber,
});

// =============================================================================
// PASSWORD RESET LIMITER - Per Email (prevent abuse)
// =============================================================================
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 password reset requests per hour per email
    message: {
        success: false,
        msg: 'Too many password reset attempts. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const identifier = req.body?.email?.toLowerCase() || 'unknown';
        return `pwd_reset_${identifier}`;
    },
    skip: (req) => !req.body?.email,
});

module.exports = {
    generalLimiter,
    orderLimiter,
    authLimiter,
    couponLimiter,
    otpLimiter,
    passwordResetLimiter,
    // Export individual limiters for flexibility
    authIpLimiter,
    authUserLimiter
};
