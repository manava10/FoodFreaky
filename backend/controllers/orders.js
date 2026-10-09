const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Setting = require('../models/Setting');
const crypto = require('crypto');
const { ErrorResponse } = require('../middleware/errorHandler');
const { runOrderTransaction, changeOrderStatus } = require('../services/orderLifecycle');
const logger = require('../utils/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const checkoutFingerprint = (body) => crypto.createHash('sha256').update(JSON.stringify({
    restaurant: body.restaurant?.toLowerCase(),
    items: (body.items || []).map(item => ({ name: item.name?.trim().toLowerCase(), quantity: item.quantity })),
    shippingAddress: body.shippingAddress?.trim(),
    couponUsed: body.couponUsed?.trim().toUpperCase() || null,
    creditsUsed: Math.floor(body.creditsUsed || 0),
})).digest('hex');

const checkoutResponse = (order) => {
    const data = order.toObject();
    delete data.checkoutKey;
    delete data.checkoutFingerprint;
    return { ...data, _securityNote: 'All prices verified and calculated on server' };
};

const verifyCheckoutRetry = (order, fingerprint) => {
    if (order.checkoutFingerprint !== fingerprint) {
        throw new ErrorResponse('This checkout key was already used for a different order', 409);
    }
    return order;
};

exports.createOrder = async (req, res) => {
    const checkoutKey = req.body?.checkoutKey;
    const fingerprint = checkoutFingerprint(req.body || {});
    try {
        const result = await runOrderTransaction(async (session) => {
            if (checkoutKey) {
                const existing = await Order.findOne({ user: req.user.id, checkoutKey })
                    .select('+checkoutFingerprint').session(session);
                if (existing) return { order: verifyCheckoutRetry(existing, fingerprint), replayed: true };
            }
            const {
                items,
                shippingAddress,
                itemsPrice: frontendItemsPrice,  // Keep for logging/comparison
                taxPrice: frontendTaxPrice,       // Keep for logging/comparison
                shippingPrice: frontendShippingPrice, // Keep for logging/comparison
                totalPrice: frontendTotalPrice,   // Keep for logging/comparison
                couponUsed,
                restaurant,
                creditsUsed: frontendCreditsUsed  // Credits user wants to use
            } = req.body;

            // ==========================================
            // VALIDATION: Basic input checks
            // ==========================================
            if (!items || items.length === 0) {
                throw new ErrorResponse('No order items', 400);
            }

            if (!restaurant) {
                throw new ErrorResponse('Restaurant ID is required', 400);
            }

            if (!shippingAddress || shippingAddress.trim() === '') {
                throw new ErrorResponse('Shipping address is required', 400);
            }

            // Enforce valid contact number before allowing order placement.
            const contactNumber = (req.user.contactNumber || '').trim();
            const isValidContactNumber = /^[0-9]{10}$/.test(contactNumber) && contactNumber !== '0000000000';
            if (!isValidContactNumber) {
                throw new ErrorResponse('Please update your contact number before placing an order', 400);
            }

            // Validate item quantities
            for (const item of items) {
                if (!item.name || typeof item.name !== 'string') {
                    throw new ErrorResponse('Invalid item name', 400);
                }
                if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
                    throw new ErrorResponse(`Invalid quantity for item "${item.name}". Must be between 1 and 100.`, 400);
                }
            }

            // Recheck current store settings: a stale client must not bypass closure.
            // A missing document uses the existing enabled default; lookup errors
            // propagate to the error handler rather than allowing an unchecked order.
            const settings = await Setting.findOne({ key: 'appSettings' }).session(session)
                .select('isOrderingEnabled').lean();
            if (settings?.isOrderingEnabled === false) {
                throw new ErrorResponse('Ordering is currently disabled. Please try again later.', 400);
            }

            // ==========================================
            // SECURITY: Fetch restaurant and verify it exists
            // ==========================================
            const restaurantDoc = await Restaurant.findById(restaurant).session(session);
            if (!restaurantDoc) {
                throw new ErrorResponse('Restaurant not found', 404);
            }

            // Check if restaurant is accepting orders
            if (restaurantDoc.isAcceptingOrders === false) {
                throw new ErrorResponse('This restaurant is not currently accepting orders', 400);
            }

            // ==========================================
            // SECURITY: Build price map from restaurant menu (server-side truth)
            // ==========================================
            const priceMap = Object.create(null);
            if (restaurantDoc.menu && Array.isArray(restaurantDoc.menu)) {
                restaurantDoc.menu.forEach(category => {
                    if (category.items && Array.isArray(category.items)) {
                        category.items.forEach(menuItem => {
                            priceMap[menuItem.name.toLowerCase().trim()] = menuItem.price;
                        });
                    }
                });
            }

            // ==========================================
            // SECURITY: Verify each item's price against database
            // ==========================================
            let calculatedItemsPrice = 0;
            const verifiedItems = [];

            for (const item of items) {
                const itemNameKey = item.name.toLowerCase().trim();
                const actualPrice = priceMap[itemNameKey];

                if (actualPrice === undefined) {
                    throw new ErrorResponse(`Item "${item.name}" not found in restaurant menu. Please refresh and try again.`, 400);
                }

                // Log if frontend price doesn't match (potential manipulation attempt)
                if (item.price !== actualPrice) {
                    logger.warn('Price mismatch detected', {
                        itemName: item.name,
                        frontendPrice: item.price,
                        databasePrice: actualPrice,
                        userId: req.user.id
                    });
                }

                // Always use the DATABASE price, never the frontend price
                verifiedItems.push({
                    name: item.name,
                    quantity: item.quantity,
                    price: actualPrice
                });

                calculatedItemsPrice += actualPrice * item.quantity;
            }

            // ==========================================
            // SECURITY: Calculate tax on server (tiered rates)
            // ==========================================
            let calculatedTaxPrice = 0;
            const isFruitStall = restaurantDoc.type === 'fruit_stall';

            if (!isFruitStall) {
                // Tiered tax rates for restaurants
                if (calculatedItemsPrice < 500) {
                    calculatedTaxPrice = calculatedItemsPrice * 0.09; // 9%
                } else if (calculatedItemsPrice >= 500 && calculatedItemsPrice < 750) {
                    calculatedTaxPrice = calculatedItemsPrice * 0.085; // 8.5%
                } else if (calculatedItemsPrice >= 750 && calculatedItemsPrice < 1000) {
                    calculatedTaxPrice = calculatedItemsPrice * 0.075; // 7.5%
                } else {
                    calculatedTaxPrice = calculatedItemsPrice * 0.0625; // 6.25%
                }
            }
            // Round to 2 decimal places
            calculatedTaxPrice = Math.round(calculatedTaxPrice * 100) / 100;

            // ==========================================
            // SECURITY: Calculate shipping on server
            // ==========================================
            let calculatedShippingPrice = 50; // Default for restaurants

            if (isFruitStall) {
                // Fruit stall delivery logic
                if (calculatedItemsPrice < 500) {
                    calculatedShippingPrice = 30;
                } else {
                    calculatedShippingPrice = 50;
                }
            }

            // ==========================================
            // SECURITY: Verify and calculate coupon discount on server
            // ==========================================
            let calculatedDiscount = 0;
            let validatedCouponCode = null;
            let validatedCouponId = null;

            if (couponUsed && couponUsed.trim() !== '') {
                const coupon = await Coupon.findOne({
                    code: couponUsed.toUpperCase().trim(),
                    isActive: true
                }).session(session);

                if (!coupon) {
                    throw new ErrorResponse('Invalid or inactive coupon code', 400);
                }

                // Check expiration
                if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                    throw new ErrorResponse('This coupon has expired', 400);
                }

                // Check usage limit
                if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
                    throw new ErrorResponse('This coupon has reached its usage limit', 400);
                }

                // Calculate discount based on coupon type
                if (coupon.discountType === 'percentage') {
                    calculatedDiscount = calculatedItemsPrice * (coupon.value / 100);
                } else {
                    calculatedDiscount = coupon.value;
                }

                // Cap discount at items price (can't go negative)
                calculatedDiscount = Math.min(calculatedDiscount, calculatedItemsPrice);
                calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

                validatedCouponCode = coupon.code;
                validatedCouponId = coupon._id;
            }

            // ==========================================
            // SECURITY: Handle FoodFreaky Credits
            // ==========================================
            let creditsToUse = 0;
            if (frontendCreditsUsed && frontendCreditsUsed > 0) {
                // Get user's current credits
                const user = await User.findById(req.user.id).session(session);
                if (!user) throw new ErrorResponse('User no longer exists', 409);
                const userCredits = user.credits || 0;

                // Validate credits usage
                const maxCreditsAllowed = Math.floor((calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice - calculatedDiscount) * 0.05); // Max 5% of order value
                const requestedCredits = Math.floor(frontendCreditsUsed);

                // Use minimum of: requested credits, user's available credits, max allowed (5%)
                creditsToUse = Math.min(requestedCredits, userCredits, maxCreditsAllowed);
                creditsToUse = Math.max(0, creditsToUse); // Ensure non-negative

                if (requestedCredits > maxCreditsAllowed) {
                    logger.warn('Credits usage exceeds 5% limit', {
                        requested: requestedCredits,
                        maxAllowed: maxCreditsAllowed,
                        userId: req.user.id
                    });
                }

                if (requestedCredits > userCredits) {
                    logger.warn('Insufficient credits', {
                        requested: requestedCredits,
                        available: userCredits,
                        userId: req.user.id
                    });
                }
            }

            // ==========================================
            // SECURITY: Calculate final total on server (after credits)
            // ==========================================
            const calculatedTotalPrice = calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice - calculatedDiscount - creditsToUse;
            const finalTotalPrice = Math.max(0, Math.round(calculatedTotalPrice * 100) / 100); // Ensure non-negative

            // Log any significant discrepancies (potential manipulation attempts)
            const priceDifference = Math.abs(finalTotalPrice - (frontendTotalPrice || 0));
            if (priceDifference > 1) { // More than ₹1 difference
                logger.warn('Price discrepancy detected', {
                    frontendPrice: frontendTotalPrice,
                    serverPrice: finalTotalPrice,
                    difference: priceDifference,
                    userId: req.user.id
                });
            }

            // ==========================================
            // CREATE ORDER: Use only server-calculated values
            // ==========================================
            const order = new Order({
                user: req.user.id,
                restaurant,
                items: verifiedItems,           // Server-verified items with DB prices
                shippingAddress: shippingAddress.trim(),
                itemsPrice: calculatedItemsPrice,    // Server-calculated
                taxPrice: calculatedTaxPrice,        // Server-calculated
                shippingPrice: calculatedShippingPrice, // Server-calculated
                totalPrice: finalTotalPrice,         // Server-calculated
                couponUsed: validatedCouponCode,      // Server-validated coupon code
                creditsUsed: creditsToUse,            // Server-validated credits
                checkoutKey,
                checkoutFingerprint: fingerprint
            });

            const createdOrder = await order.save({ session });

            // Deduct credits from user account if used
            if (creditsToUse > 0) {
                const debit = await User.updateOne(
                    { _id: req.user.id, credits: { $gte: creditsToUse } },
                    { $inc: { credits: -creditsToUse } },
                    { session }
                );
                if (debit.matchedCount !== 1) throw new ErrorResponse('Credits balance changed. Please retry checkout.', 409);
            }

            // Increment coupon usage count after successful order
            if (validatedCouponCode) {
                const reservation = await Coupon.updateOne(
                    { _id: validatedCouponId, $or: [
                        { usageLimit: null },
                        { $expr: { $lt: ['$timesUsed', '$usageLimit'] } },
                    ] },
                    { $inc: { timesUsed: 1 } },
                    { session }
                );
                if (reservation.matchedCount !== 1) throw new ErrorResponse('This coupon has reached its usage limit', 409);
            }

            return { order: createdOrder, replayed: false };
        });
        res.status(result.replayed ? 200 : 201).json(checkoutResponse(result.order));
    } catch (error) {
        // A concurrent identical request may win the unique index race.
        if (error.code === 11000 && checkoutKey && error.keyPattern?.checkoutKey) {
            try {
                const existing = await Order.findOne({ user: req.user.id, checkoutKey }).select('+checkoutFingerprint');
                if (existing) return res.status(200).json(checkoutResponse(verifyCheckoutRetry(existing, fingerprint)));
            } catch (retryError) {
                error = retryError;
            }
        }
        logger.error('Order creation error:', {
            error: error.message, stack: error.stack,
            userId: req.user?.id, restaurantId: req.body?.restaurant
        });
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid restaurant ID format' });
        }
        res.status(error.statusCode || 500).json({ msg: error.statusCode ? error.message : 'Server Error' });
    }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Optional filters
        const status = req.query.status;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        
        // Build query
        const query = { user: req.user.id };
        
        if (status) {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Optimize: Use Promise.all to run count and find in parallel
        // Use lean() for faster queries (returns plain JS objects instead of Mongoose documents)
        const startTime = Date.now();
        const [total, orders] = await Promise.all([
            Order.countDocuments(query),
            Order.find(query)
                .populate('restaurant', 'name _id') // Only fetch name and _id
                .select('-shippingAddress -review') // Exclude large fields not needed for list view
                .lean() // Use lean() for 2-3x faster queries
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);
        const queryTime = Date.now() - startTime;
        
        // Log slow queries for monitoring
        if (queryTime > 500) {
            logger.warn('Slow orders query detected', { queryTime, userId: req.user.id, page, limit, total });
        }
        
        logger.info(`User ${req.user.id} fetched orders`, { page, limit, total, count: orders.length, queryTime });
        
        res.json({ 
            success: true, 
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: orders 
        });
    } catch (error) {
        logger.error('Get orders error:', { error: error.message, stack: error.stack, userId: req.user.id });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Get order details for reorder
// @route   GET /api/orders/:id/reorder
// @access  Private
exports.getReorderData = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name _id type');

        if (!order) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, msg: 'Not authorized' });
        }

        // Check if restaurant still exists and is accepting orders
        if (!order.restaurant) {
            return res.status(400).json({ success: false, msg: 'Restaurant no longer exists' });
        }

        logger.info(`User ${req.user.id} requested reorder data for order ${req.params.id}`);

        res.json({
            success: true,
            data: {
                items: order.items,
                restaurant: {
                    id: order.restaurant._id,
                    name: order.restaurant.name,
                    type: order.restaurant.type || 'restaurant' // Include type for cart context
                }
            }
        });
    } catch (error) {
        logger.error('Get reorder data error:', {
            error: error.message,
            stack: error.stack,
            orderId: req.params.id,
            userId: req.user.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const { order } = await changeOrderStatus({
            orderId: req.params.id, status: 'Cancelled', customerId: req.user.id,
        });
        res.json(order);
    } catch (error) {
        logger.error('Cancel order error:', { error: error.message, orderId: req.params.id, userId: req.user.id });
        const status = error.name === 'CastError' ? 400 : error.statusCode || 500;
        res.status(status).json({ msg: error.statusCode ? error.message : 'Failed to cancel order' });
    }
};

// @desc    Rate an order
// @route   PUT /api/orders/:id/rate
// @access  Private
exports.rateOrder = async (req, res) => {
    const { rating, review } = req.body;

    try {
        // Validate rating input
        if (rating === undefined || rating === null) {
            return res.status(400).json({ msg: 'Rating is required' });
        }

        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ msg: 'Rating must be an integer between 1 and 5' });
        }

        // Validate review if provided
        if (review && (typeof review !== 'string' || review.length > 1000)) {
            return res.status(400).json({ msg: 'Review must be a string with max 1000 characters' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to rate this order' });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ msg: 'Order must be delivered to be rated' });
        }

        if (order.rating) {
            return res.status(400).json({ msg: 'Order already rated' });
        }

        order.rating = numRating;
        order.review = review ? review.trim() : undefined;

        await order.save();

        // Update restaurant average rating
        const restaurant = await Restaurant.findById(order.restaurant);

        const totalRating = restaurant.averageRating * restaurant.numberOfReviews;
        const newNumberOfReviews = restaurant.numberOfReviews + 1;
        const newAverageRating = (totalRating + rating) / newNumberOfReviews;

        restaurant.averageRating = newAverageRating;
        restaurant.numberOfReviews = newNumberOfReviews;

        await restaurant.save();

        logger.info(`Order ${req.params.id} rated ${rating} stars by user ${req.user.id}`);
        res.json({ msg: 'Order rated successfully' });

    } catch (error) {
        logger.error('Rate order error:', { error: error.message, stack: error.stack, orderId: req.params.id, userId: req.user.id });
        res.status(500).send('Server Error');
    }
};


// @desc    Get invoice for an order
// @route   GET /api/orders/:id/invoice
// @access  Private
const generateInvoicePdf = require('../utils/generateInvoicePdf');

exports.getOrderInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email contactNumber');
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Check if the order belongs to the user making the request or if user is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized to access this order' });
        }

        const pdfBuffer = await generateInvoicePdf(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);

        logger.info(`Invoice generated for order ${req.params.id} by user ${req.user.id}`);
        res.send(pdfBuffer);

    } catch (error) {
        logger.error('Invoice generation error:', { error: error.message, stack: error.stack, orderId: req.params.id, userId: req.user.id });
        res.status(500).json({ msg: 'Server Error' });
    }
};
