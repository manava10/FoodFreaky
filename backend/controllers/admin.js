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

        const orders = await Order.find(query)
            .populate('user', 'name email contactNumber')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 });
            
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

// @desc    Export daily orders report
// @route   GET /api/admin/orders/export
// @access  Private (Admin)
exports.exportDailyOrders = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        })
        .populate('user', 'name email contactNumber')
        .populate('restaurant', 'name')
        .sort({ 'restaurant.name': 1, createdAt: -1 }); // Group by restaurant

        // Generate CSV
        const headers = ['Order ID', 'Restaurant', 'Customer Name', 'Contact', 'Items', 'Total Price', 'Status', 'Time'];
        const csvRows = [headers.join(',')];

        orders.forEach(order => {
            // Format items string: "Burger x 2; Fries x 1"
            const itemsString = order.items
                .map(item => `${item.name} x ${item.quantity}`)
                .join('; ');

            // Escape fields that might contain commas
            const escapeCsv = (field) => {
                if (!field) return '';
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            const row = [
                order._id,
                order.restaurant?.name || 'Unknown Restaurant',
                order.user?.name || 'Guest',
                order.user?.contactNumber || 'N/A',
                itemsString,
                order.totalPrice.toFixed(2),
                order.status,
                new Date(order.createdAt).toLocaleTimeString()
            ].map(escapeCsv).join(',');

            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const filename = `orders-${targetDate.toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvString);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ msg: 'Server Error during export' });
    }
};
