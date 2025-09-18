const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail');
const generateInvoicePdf = require('../utils/generateInvoicePdf');

// @desc    Get all orders (for admins)
// @route   GET /api/admin/orders
// @access  Private (Admin, DeliveryAdmin)
exports.getAllOrders = async (req, res) => {
    try {
        let query = {};

        // If the user is a delivery admin, only show them today's orders
        if (req.user.role === 'deliveryadmin') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        const orders = await Order.find(query).populate('user', 'name email contactNumber').sort({ createdAt: -1 });
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
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Ensure the status is a valid one from our model
        const validStatuses = Order.schema.path('status').enumValues;
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: `Invalid status: '${status}'` });
        }

        const oldStatus = order.status;
        order.status = status;
        const updatedOrder = await order.save();

        // If the status changed to 'Delivered', send an email with the invoice
        if (status === 'Delivered' && oldStatus !== 'Delivered') {
            try {
                const pdfBuffer = await generateInvoicePdf(order);
                
                await sendEmail({
                    email: order.user.email,
                    subject: `Your FoodFreaky Order #${order._id.toString().substring(0, 8)} has been delivered!`,
                    html: `<p>Hi ${order.user.name},</p><p>Thank you for your order! We're pleased to let you know that your order has been delivered. Your invoice is attached to this email.</p><p>We hope you enjoy your meal!</p>`,
                    attachments: [
                        {
                            filename: `invoice-${order._id}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf',
                        },
                    ],
                });

            } catch (emailError) {
                console.error('Failed to send delivery confirmation email:', emailError);
                // We don't block the main response for this, just log the error
            }
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
