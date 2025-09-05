const Order = require('../models/Order');

// @desc    Get all orders (for admins)
// @route   GET /api/admin/orders
// @access  Private (Admin, DeliveryAdmin)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email contactNumber').sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update order status (for admins)
// @route   PUT /api/admin/orders/:id
// @access  Private (Admin, DeliveryAdmin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Ensure the status is a valid one from our model
        const validStatuses = Order.schema.path('status').enumValues;
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: `Invalid status: '${status}'` });
        }

        order.status = status;
        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
