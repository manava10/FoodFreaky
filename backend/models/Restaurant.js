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
    menu: [MenuSchema],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
