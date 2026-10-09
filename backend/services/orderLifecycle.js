const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

// Every balance change and its order state commit together. No external side
// effects belong in this callback: MongoDB may retry it after a write conflict.
const runOrderTransaction = async (callback) => {
    try {
        // Ensure the checkout uniqueness index exists before accepting writes.
        await Order.init();
        return await mongoose.connection.transaction(callback, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
        });
    } catch (error) {
        if (error.code === 20 || error.codeName === 'IllegalOperation') {
            throw new ErrorResponse('Order processing is temporarily unavailable', 503);
        }
        throw error;
    }
};

const progress = ['Waiting for Acceptance', 'Accepted', 'Preparing Food', 'Out for Delivery', 'Delivered'];

const changeOrderStatus = async ({ orderId, status, customerId }) => {
    const result = await runOrderTransaction(async (session) => {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw new ErrorResponse('Order not found', 404);
        if (customerId && order.user.toString() !== customerId.toString()) {
            throw new ErrorResponse('Not authorized', 403);
        }
        const oldStatus = order.status;
        // A retry after an already committed transition has no financial effects.
        if (oldStatus === status) return { order, changed: false };
        if (oldStatus === 'Delivered' || oldStatus === 'Cancelled') {
            throw new ErrorResponse('Delivered and cancelled orders cannot change status', 409);
        }
        if (customerId && (status !== 'Cancelled' || oldStatus !== 'Waiting for Acceptance')) {
            throw new ErrorResponse('Order cannot be cancelled at this stage', 400);
        }
        if (status !== 'Cancelled' &&
            (progress.indexOf(status) === -1 || progress.indexOf(status) <= progress.indexOf(oldStatus))) {
            throw new ErrorResponse('Order status must move forward', 400);
        }

        let balanceChange = 0;
        if (status === 'Delivered' && !order.creditsEarned) {
            order.creditsEarned = Math.floor(order.totalPrice * 0.02);
            balanceChange = order.creditsEarned;
        }
        if (status === 'Cancelled') {
            const refund = Math.max(0, (order.creditsUsed || 0) - (order.creditsRefunded || 0));
            order.creditsRefunded = (order.creditsRefunded || 0) + refund;
            balanceChange = refund;
        }
        // Save first; a subsequent balance failure aborts this write as well.
        order.status = status;
        await order.save({ session });
        if (balanceChange > 0) {
            const result = await User.updateOne({ _id: order.user }, { $inc: { credits: balanceChange } }, { session });
            if (result.matchedCount !== 1) {
                throw new ErrorResponse('Order account no longer exists', 409);
            }
        }
        // Coupon usage is retained on cancellation, preserving the existing policy.
        return { order, changed: true };
    });
    result.order.$session(null);
    return result;
};

module.exports = { runOrderTransaction, changeOrderStatus };
