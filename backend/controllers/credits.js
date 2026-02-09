const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get user's FoodFreaky credits
// @route   GET /api/credits
// @access  Private
exports.getCredits = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('credits');
        
        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        res.status(200).json({
            success: true,
            credits: user.credits || 0
        });
    } catch (error) {
        logger.error('Get credits error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
