const mongoose = require('mongoose');

// Keep anonymous visit records permanently so cumulative totals survive restarts.
const schema = new mongoose.Schema({
    _id: { type: String },
    firstSeen: { type: Date, required: true, index: true },
    lastSeen: { type: Date, required: true, index: true },
}, { versionKey: false });
module.exports = mongoose.model('SiteVisit', schema);
