const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    items: [{
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        emoji: String,
        imageUrl: {
            type: String, // Field for the dish image URL
        },
    }],
});

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
    },
    cuisine: {
        type: String,
        required: [true, 'Please add a cuisine type'],
    },
    deliveryTime: {
        type: String,
        required: true,
    },
    tags: [String],
    imageUrl: {
        type: String,
    },
    menu: [MenuSchema],
    averageRating: {
        type: Number,
        default: 0,
    },
    numberOfReviews: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes for better query performance
RestaurantSchema.index({ name: 1 });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ tags: 1 });
RestaurantSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
