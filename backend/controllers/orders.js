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
            itemsPrice, 
            taxPrice, 
            shippingPrice, 
            totalPrice,
            couponUsed,
            restaurant // new field
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: 'No order items' });
        }
        
        if (!restaurant) {
            return res.status(400).json({ msg: 'Restaurant ID is required' });
        }

        // Fetch restaurant to check type and apply specific logic
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }

        let finalShippingPrice = shippingPrice;
        
        // Custom Delivery Logic for Fruit Stalls
        if (restaurantDoc.type === 'fruit_stall') {
            // Logic: < 500 => 30 Rs, >= 500 => 50 Rs
            if (itemsPrice < 500) {
                finalShippingPrice = 30;
            } else {
                finalShippingPrice = 50;
            }
        } else {
            // For regular restaurants, ensure we stick to the standard 50 (or whatever was passed if valid)
            // If we want to enforce 50 for restaurants, we can do it here.
            // Assuming standard delivery is 50 for now based on previous code context
            finalShippingPrice = 50; 
        }

        // Recalculate total price to ensure consistency
        // totalPrice = itemsPrice + taxPrice + finalShippingPrice - (couponDiscount if any)
        // Since coupon logic is complex and calculated on frontend/coupon endpoint, 
        // we might just need to adjust the difference in shipping.
        // Ideally, we should recalculate everything, but for now let's adjust based on shipping difference.
        
        // Let's assume totalPrice passed includes the OLD shipping price.
        // We need to subtract old shipping and add new shipping.
        // BUT 'shippingPrice' from req.body is what frontend thought it was.
        // So we can do: newTotal = totalPrice - req.body.shippingPrice + finalShippingPrice
        
        const adjustedTotalPrice = totalPrice - shippingPrice + finalShippingPrice;

        const order = new Order({
            user: req.user.id,
            restaurant, 
            items,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice: finalShippingPrice, // Use server-calculated shipping
            totalPrice: adjustedTotalPrice,    // Use adjusted total
            couponUsed
        });

        const createdOrder = await order.save();

        // If a coupon was used, increment its timesUsed count
        if (couponUsed) {
            await Coupon.updateOne({ code: couponUsed.toUpperCase() }, { $inc: { timesUsed: 1 } });
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error(error);
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

        order.rating = rating;
        order.review = review;

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
