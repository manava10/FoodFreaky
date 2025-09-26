const Setting = require('../models/Setting');

// A helper function to get or create the settings document
const getSettings = async () => {
    // Using findOne and upsert to ensure a single settings document
    const settings = await Setting.findOneAndUpdate(
        { key: 'appSettings' },
        { $setOnInsert: { isOrderingEnabled: true, orderClosingTime: "22:00" } },
        { new: true, upsert: true }
    );
    return settings;
};

// @desc    Get the current app settings
// @route   GET /api/settings
// @access  Public
exports.getAppSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update app settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    try {
        const { isOrderingEnabled, orderClosingTime } = req.body;

        const settings = await getSettings();

        if (typeof isOrderingEnabled === 'boolean') {
            settings.isOrderingEnabled = isOrderingEnabled;
        }

        if (orderClosingTime) {
            // Basic validation for "HH:MM" format
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(orderClosingTime)) {
                return res.status(400).json({ msg: 'Invalid time format. Please use HH:MM.' });
            }
            settings.orderClosingTime = orderClosingTime;
        }

        await settings.save();

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
