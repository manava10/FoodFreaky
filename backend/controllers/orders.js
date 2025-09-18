const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
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
            couponUsed
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: 'No order items' });
        }

        const order = new Order({
            user: req.user.id,
            items,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
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
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
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
