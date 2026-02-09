const Joi = require('joi');

/**
 * Validation middleware factory
 * Creates a middleware function that validates request data against a Joi schema
 * 
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown properties
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                msg: 'Validation failed',
                errors: errors
            });
        }

        // Replace request data with validated and sanitized data
        req[property] = value;
        next();
    };
};

/**
 * Validation schemas for different endpoints
 */
const schemas = {
    // Registration schema
    register: Joi.object({
        name: Joi.string()
            .min(3)
            .max(50)
            .trim()
            .required()
            .messages({
                'string.min': 'Name must be at least 3 characters long',
                'string.max': 'Name must not exceed 50 characters',
                'string.empty': 'Name is required',
                'any.required': 'Name is required'
            }),
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'string.empty': 'Email is required',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(8)
            .max(128)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password must not exceed 128 characters',
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            }),
        contactNumber: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required()
            .messages({
                'string.pattern.base': 'Contact number must be exactly 10 digits',
                'string.empty': 'Contact number is required',
                'any.required': 'Contact number is required'
            })
    }),

    // OTP verification schema
    verifyOtp: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]{6}$/)
            .required()
            .messages({
                'string.length': 'OTP must be exactly 6 digits',
                'string.pattern.base': 'OTP must contain only numbers',
                'any.required': 'OTP is required'
            })
    }),

    // Login schema
    login: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            })
    }),

    // Forgot password schema
    forgotPassword: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            })
    }),

    // Reset password schema
    resetPassword: Joi.object({
        password: Joi.string()
            .min(8)
            .max(128)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password must not exceed 128 characters',
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            })
    }),

    // Order creation schema
    createOrder: Joi.object({
        items: Joi.array()
            .min(1)
            .items(
                Joi.object({
                    name: Joi.string().trim().required(),
                    quantity: Joi.number().integer().min(1).max(100).required(),
                    price: Joi.number().positive().optional() // Optional, will be validated server-side
                })
            )
            .required()
            .messages({
                'array.min': 'Order must contain at least one item',
                'any.required': 'Items are required'
            }),
        shippingAddress: Joi.string()
            .trim()
            .min(5)
            .max(500)
            .required()
            .messages({
                'string.min': 'Shipping address must be at least 5 characters',
                'string.max': 'Shipping address must not exceed 500 characters',
                'string.empty': 'Shipping address is required',
                'any.required': 'Shipping address is required'
            }),
        restaurant: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid restaurant ID format',
                'any.required': 'Restaurant ID is required'
            }),
        couponUsed: Joi.string().trim().allow(null, '').optional(),
        creditsUsed: Joi.number().min(0).optional().default(0),
        itemsPrice: Joi.number().optional(),
        taxPrice: Joi.number().optional(),
        shippingPrice: Joi.number().optional(),
        totalPrice: Joi.number().optional()
    }),

    // Google OAuth schema
    googleAuth: Joi.object({
        idToken: Joi.string().required().messages({
            'string.empty': 'Google ID token is required',
            'any.required': 'Google ID token is required'
        })
    }),

    // Rate order schema
    rateOrder: Joi.object({
        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required()
            .messages({
                'number.min': 'Rating must be between 1 and 5',
                'number.max': 'Rating must be between 1 and 5',
                'number.base': 'Rating must be a number',
                'any.required': 'Rating is required'
            }),
        review: Joi.string()
            .trim()
            .max(1000)
            .allow('', null)
            .optional()
            .messages({
                'string.max': 'Review must not exceed 1000 characters'
            })
    }),

    // Coupon validation schema
    validateCoupon: Joi.object({
        code: Joi.string()
            .trim()
            .uppercase()
            .min(3)
            .max(20)
            .required()
            .messages({
                'string.min': 'Coupon code must be at least 3 characters',
                'string.max': 'Coupon code must not exceed 20 characters',
                'string.empty': 'Coupon code is required',
                'any.required': 'Coupon code is required'
            })
    }),

    // Create coupon schema (admin)
    createCoupon: Joi.object({
        code: Joi.string()
            .trim()
            .uppercase()
            .min(3)
            .max(20)
            .required(),
        discountType: Joi.string()
            .valid('percentage', 'fixed')
            .required(),
        value: Joi.number()
            .positive()
            .required(),
        expiresAt: Joi.date()
            .greater('now')
            .required(),
        isActive: Joi.boolean().default(true)
    }),

    // Update order status schema (admin)
    updateOrderStatus: Joi.object({
        status: Joi.string()
            .valid(
                'Waiting for Acceptance',
                'Accepted',
                'Preparing Food',
                'Out for Delivery',
                'Delivered',
                'Cancelled'
            )
            .required()
            .messages({
                'any.only': 'Invalid order status',
                'any.required': 'Status is required'
            })
    }),

    // Restaurant creation schema (admin)
    createRestaurant: Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        cuisine: Joi.string().trim().max(50).required(),
        deliveryTime: Joi.string().trim().max(50).required(),
        tags: Joi.array().items(Joi.string().trim()).optional(),
        imageUrl: Joi.string().uri().allow('', null).optional(),
        menu: Joi.array().items(
            Joi.object({
                category: Joi.string().trim().required(),
                items: Joi.array().items(
                    Joi.object({
                        name: Joi.string().trim().required(),
                        price: Joi.number().positive().required(),
                        emoji: Joi.string().allow('', null).optional(),
                        imageUrl: Joi.string().uri().allow('', null).optional()
                    })
                ).optional()
            })
        ).optional(),
        isAcceptingOrders: Joi.boolean().default(true)
    }),

    // Update settings schema (admin)
    updateSettings: Joi.object({
        isOrderingEnabled: Joi.boolean().optional(),
        orderClosingTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional()
            .messages({
                'string.pattern.base': 'Closing time must be in HH:MM format (24-hour)'
            })
    }),

    // Update profile schema
    updateProfile: Joi.object({
        contactNumber: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required()
            .messages({
                'string.pattern.base': 'Contact number must be exactly 10 digits',
                'string.empty': 'Contact number is required',
                'any.required': 'Contact number is required'
            })
    })
};

module.exports = {
    validate,
    schemas
};
