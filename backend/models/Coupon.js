const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    value: {
        type: Number,
        required: [true, 'Please add a discount value']
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Coupon', CouponSchema);
