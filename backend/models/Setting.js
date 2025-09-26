const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'appSettings'
    },
    isOrderingEnabled: {
        type: Boolean,
        default: true
    },
    orderClosingTime: {
        type: String, // Storing as "HH:MM"
        default: "22:00" // Default to 10 PM
    }
});

module.exports = mongoose.model('Setting', SettingSchema);
