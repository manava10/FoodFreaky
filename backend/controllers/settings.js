const Setting = require('../models/Setting');

// A helper function to get or create the settings document
const getSettings = async () => {
    // Using findOne and upsert to ensure a single settings document
    const settings = await Setting.findOneAndUpdate(
        { key: 'appSettings' },
        { $setOnInsert: { isOrderingEnabled: true } },
        { new: true, upsert: true }
    );
    return settings;
};

// @desc    Get the current ordering status
// @route   GET /api/settings/ordering
// @access  Public
exports.getOrderingStatus = async (req, res) => {
    try {
        const settings = await getSettings();
        res.json({ success: true, isOrderingEnabled: settings.isOrderingEnabled });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update the ordering status
// @route   PUT /api/admin/settings/ordering
// @access  Private (Admin)
exports.updateOrderingStatus = async (req, res) => {
    try {
        const { isOrderingEnabled } = req.body;

        if (typeof isOrderingEnabled !== 'boolean') {
            return res.status(400).json({ msg: 'Invalid value for isOrderingEnabled' });
        }

        const settings = await getSettings();
        settings.isOrderingEnabled = isOrderingEnabled;
        await settings.save();

        res.json({ success: true, isOrderingEnabled: settings.isOrderingEnabled });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
