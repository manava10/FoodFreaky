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
    }
});

module.exports = mongoose.model('Setting', SettingSchema);
