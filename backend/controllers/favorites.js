const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// @desc    Add restaurant to favorites
// @route   POST /api/favorites/:restaurantId
// @access  Private
exports.addToFavorites = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user.id;

        // Check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, msg: 'Restaurant not found' });
        }

        // Get user and check if already favorited
        const user = await User.findById(userId);
        if (user.favorites.includes(restaurantId)) {
            return res.status(400).json({ success: false, msg: 'Restaurant already in favorites' });
        }

        // Add to favorites
        user.favorites.push(restaurantId);
        await user.save();

        logger.info(`User ${userId} added restaurant ${restaurantId} to favorites`);

        res.status(200).json({
            success: true,
            msg: 'Restaurant added to favorites',
            data: user.favorites
        });
    } catch (error) {
        logger.error('Add to favorites error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id,
            restaurantId: req.params.restaurantId
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Remove restaurant from favorites
// @route   DELETE /api/favorites/:restaurantId
// @access  Private
exports.removeFromFavorites = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user.id;

        // Remove from favorites
        const user = await User.findById(userId);
        user.favorites = user.favorites.filter(
            fav => fav.toString() !== restaurantId
        );
        await user.save();

        logger.info(`User ${userId} removed restaurant ${restaurantId} from favorites`);

        res.status(200).json({
            success: true,
            msg: 'Restaurant removed from favorites',
            data: user.favorites
        });
    } catch (error) {
        logger.error('Remove from favorites error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id,
            restaurantId: req.params.restaurantId
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Get user's favorite restaurants
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        
        res.status(200).json({
            success: true,
            count: user.favorites.length,
            data: user.favorites
        });
    } catch (error) {
        logger.error('Get favorites error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Check if restaurant is favorited
// @route   GET /api/favorites/check/:restaurantId
// @access  Private
exports.checkFavorite = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const user = await User.findById(req.user.id);
        
        const isFavorited = user.favorites.some(
            fav => fav.toString() === restaurantId
        );

        res.status(200).json({
            success: true,
            isFavorited
        });
    } catch (error) {
        logger.error('Check favorite error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.id,
            restaurantId: req.params.restaurantId
        });
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
