const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Restaurant = require('../models/Restaurant');
const PDFDocument = require('pdfkit');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            itemsPrice: frontendItemsPrice,  // Keep for logging/comparison
            taxPrice: frontendTaxPrice,       // Keep for logging/comparison
            shippingPrice: frontendShippingPrice, // Keep for logging/comparison
            totalPrice: frontendTotalPrice,   // Keep for logging/comparison
            couponUsed,
            restaurant
        } = req.body;

        // ==========================================
        // VALIDATION: Basic input checks
        // ==========================================
        if (!items || items.length === 0) {
            return res.status(400).json({ msg: 'No order items' });
        }

        if (!restaurant) {
            return res.status(400).json({ msg: 'Restaurant ID is required' });
        }

        if (!shippingAddress || shippingAddress.trim() === '') {
            return res.status(400).json({ msg: 'Shipping address is required' });
        }

        // Validate item quantities
        for (const item of items) {
            if (!item.name || typeof item.name !== 'string') {
                return res.status(400).json({ msg: 'Invalid item name' });
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
                return res.status(400).json({ msg: `Invalid quantity for item "${item.name}". Must be between 1 and 100.` });
            }
        }

        // ==========================================
        // SECURITY: Fetch restaurant and verify it exists
        // ==========================================
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }

        // Check if restaurant is accepting orders
        if (restaurantDoc.isAcceptingOrders === false) {
            return res.status(400).json({ msg: 'This restaurant is not currently accepting orders' });
        }

        // ==========================================
        // SECURITY: Build price map from restaurant menu (server-side truth)
        // ==========================================
        const priceMap = {};
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
                return res.status(400).json({
                    msg: `Item "${item.name}" not found in restaurant menu. Please refresh and try again.`
                });
            }

            // Log if frontend price doesn't match (potential manipulation attempt)
            if (item.price !== actualPrice) {
                console.warn(`[SECURITY] Price mismatch for item "${item.name}": Frontend sent ₹${item.price}, DB has ₹${actualPrice}. User: ${req.user.id}`);
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

        if (couponUsed && couponUsed.trim() !== '') {
            const coupon = await Coupon.findOne({
                code: couponUsed.toUpperCase().trim(),
                isActive: true
            });

            if (!coupon) {
                return res.status(400).json({ msg: 'Invalid or inactive coupon code' });
            }

            // Check expiration
            if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                return res.status(400).json({ msg: 'This coupon has expired' });
            }

            // Check usage limit
            if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
                return res.status(400).json({ msg: 'This coupon has reached its usage limit' });
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
        }

        // ==========================================
        // SECURITY: Calculate final total on server
        // ==========================================
        const calculatedTotalPrice = calculatedItemsPrice + calculatedTaxPrice + calculatedShippingPrice - calculatedDiscount;
        const finalTotalPrice = Math.round(calculatedTotalPrice * 100) / 100;

        // Log any significant discrepancies (potential manipulation attempts)
        const priceDifference = Math.abs(finalTotalPrice - (frontendTotalPrice || 0));
        if (priceDifference > 1) { // More than ₹1 difference
            console.warn(`[SECURITY] Total price discrepancy detected. Frontend: ₹${frontendTotalPrice}, Server: ₹${finalTotalPrice}. User: ${req.user.id}`);
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
            couponUsed: validatedCouponCode      // Server-validated coupon code
        });

        const createdOrder = await order.save();

        // Increment coupon usage count after successful order
        if (validatedCouponCode) {
            await Coupon.updateOne(
                { code: validatedCouponCode },
                { $inc: { timesUsed: 1 } }
            );
        }

        // Return success with server-calculated values
        res.status(201).json({
            ...createdOrder.toObject(),
            _securityNote: 'All prices verified and calculated on server'
        });

    } catch (error) {
        console.error('Order creation error:', error);

        // Handle specific MongoDB errors
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid restaurant ID format' });
        }

        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check if the order is in a cancellable state
        if (order.status !== 'Waiting for Acceptance') {
            return res.status(400).json({ msg: 'Order cannot be cancelled at this stage' });
        }

        order.status = 'Cancelled';
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
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

        res.json({ msg: 'Order rated successfully' });

    } catch (error) {
        console.error(error.message);
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

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
