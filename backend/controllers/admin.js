const Order = require('../models/Order');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateInvoicePdf = require('../utils/generateInvoicePdf');
const logger = require('../utils/logger');

// @desc    Credit all users with FoodFreaky credits
// @route   POST /api/admin/credit-all-users
// @access  Private (Admin only)
exports.creditAllUsers = async (req, res) => {
    try {
        // Only super admin can credit all users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, msg: 'Only super admin can credit all users' });
        }

        const creditAmount = req.body.amount || 25; // Default to 25, but allow custom amount
        const setToAmount = req.body.setToAmount; // If provided, set credits to this amount instead of adding

        let result;
        let message;
        let totalCredits;

        if (setToAmount !== undefined) {
            // Set credits to a specific amount (X rupees) regardless of previous balance
            result = await User.updateMany(
                {}, // Match all users
                { 
                    $set: { credits: setToAmount } // Set credits to the specified amount
                }
            );

            totalCredits = result.modifiedCount * setToAmount;
            message = `Successfully set credits to ₹${setToAmount} for ${result.modifiedCount} users`;

            logger.info(`Admin ${req.user.id} set credits to ₹${setToAmount} for all users`, { 
                usersUpdated: result.modifiedCount, 
                totalCredits 
            });
        } else {
            // Add credits to existing balance (X + previous)
            result = await User.updateMany(
                {}, // Match all users
                { 
                    $inc: { credits: creditAmount } // Increment credits by the specified amount
                }
            );

            totalCredits = result.modifiedCount * creditAmount;
            message = `Successfully added ₹${creditAmount} to ${result.modifiedCount} users (X + previous balance)`;

            logger.info(`Admin ${req.user.id} added ₹${creditAmount} to all users`, { 
                usersCredited: result.modifiedCount, 
                totalCredits 
            });
        }

        res.status(200).json({
            success: true,
            message: message,
            usersCredited: result.modifiedCount,
            totalCreditsDistributed: totalCredits,
            operation: setToAmount !== undefined ? 'set' : 'add'
        });
    } catch (error) {
        logger.error('Credit all users error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Reset all users' credits to 0
// @route   POST /api/admin/reset-all-credits
// @access  Private (Admin)
exports.resetAllCredits = async (req, res) => {
    try {
        // Only super admin can reset all credits
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, msg: 'Only super admin can reset all credits' });
        }

        const result = await User.updateMany(
            {}, // Match all users
            { $set: { credits: 0 } } // Set credits to 0
        );

        logger.info(`Admin ${req.user.id} reset all users' credits to 0`, {
            usersUpdated: result.modifiedCount
        });

        res.status(200).json({
            success: true,
            message: `Successfully reset credits to ₹0 for ${result.modifiedCount} users`,
            usersUpdated: result.modifiedCount
        });
    } catch (error) {
        logger.error('Reset all credits error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Get all orders (for admins)
// @route   GET /api/admin/orders
// @access  Private (Admin, DeliveryAdmin)
exports.getAllOrders = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Optional filters
        const status = req.query.status;
        const restaurantId = req.query.restaurantId;
        
        let query = {};

        // If the user is a delivery admin, only show them today's orders
        if (req.user.role === 'deliveryadmin') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }
        
        // Apply filters
        if (status) {
            query.status = status;
        }
        
        if (restaurantId) {
            query.restaurant = restaurantId;
        }

        // Get total count for pagination
        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate('user', 'name email contactNumber')
            .populate('restaurant', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        logger.info(`Admin ${req.user.id} fetched orders`, { page, limit, total, count: orders.length, role: req.user.role });
            
        res.json({ 
            success: true, 
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: orders 
        });
    } catch (error) {
        logger.error('Failed to fetch orders:', { error: error.message, stack: error.stack, userId: req.user.id });
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
        
        // If the status changed to 'Delivered', award credits (2% of order value)
        if (status === 'Delivered' && oldStatus !== 'Delivered' && !order.creditsEarned) {
            const creditsToAward = Math.floor(order.totalPrice * 0.02); // 2% of order value
            order.creditsEarned = creditsToAward;
            
            // Add credits to user account
            await User.findByIdAndUpdate(order.user, {
                $inc: { credits: creditsToAward }
            });
            
            logger.info(`Awarded ${creditsToAward} credits to user ${order.user} for order ${order._id}`);
        }
        
        const updatedOrder = await order.save();

        // If the status changed to 'Delivered', send an email with the invoice
        if (status === 'Delivered' && oldStatus !== 'Delivered') {
            try {
                const pdfBuffer = await generateInvoicePdf(order);
                
                // Build email message with credits information
                let emailHtml = `<p>Hi ${order.user.name},</p><p>Thank you for your order! We're pleased to let you know that your order has been delivered. Your invoice is attached to this email.</p>`;
                
                if (order.creditsEarned && order.creditsEarned > 0) {
                    emailHtml += `<p><strong>🎉 Great news!</strong> You have earned <strong>${order.creditsEarned} FoodFreaky credits</strong> (2% of your order value) which have been added to your account. You can use these credits on your next order (up to 5% of the order value).</p>`;
                }
                
                emailHtml += `<p>We hope you enjoy your meal!</p>`;
                
                await sendEmail({
                    email: order.user.email,
                    subject: `Your FoodFreaky Order #${order._id.toString().substring(0, 8)} has been delivered!`,
                    html: emailHtml,
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
