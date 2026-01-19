/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

/**
 * Recursively sanitizes an object by trimming strings and removing dangerous patterns
 */
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        // Trim whitespace
        let sanitized = obj.trim();

        // Remove potential script tags (basic XSS prevention)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '');

        // Remove javascript: URLs
        sanitized = sanitized.replace(/javascript:/gi, '');

        return sanitized;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            // Skip prototype pollution attempts
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }

    return obj;
};

/**
 * Middleware to sanitize request body
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

/**
 * Validates MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
    if (!id) return false;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
};

/**
 * Middleware to validate that restaurant ID is a valid ObjectId
 */
const validateRestaurantId = (req, res, next) => {
    const restaurantId = req.body.restaurant || req.params.id;

    if (restaurantId && !isValidObjectId(restaurantId)) {
        return res.status(400).json({
            success: false,
            msg: 'Invalid restaurant ID format'
        });
    }
    next();
};

/**
 * Middleware to validate order ID
 */
const validateOrderId = (req, res, next) => {
    const orderId = req.params.id;

    if (orderId && !isValidObjectId(orderId)) {
        return res.status(400).json({
            success: false,
            msg: 'Invalid order ID format'
        });
    }
    next();
};

module.exports = {
    sanitizeInput,
    sanitizeObject,
    isValidObjectId,
    validateRestaurantId,
    validateOrderId
};
