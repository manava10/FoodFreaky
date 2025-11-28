const Restaurant = require('../models/Restaurant');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
    try {
        const { type } = req.query;
        
        let query = {};
        
        // If requesting fruit stalls, strictly filter for them
        if (type === 'fruit_stall') {
            query.type = 'fruit_stall';
        } else {
            // If requesting restaurants (or default), include both explicit 'restaurant' type
            // AND documents that don't have a type field yet (backward compatibility for existing data)
            query.$or = [
                { type: 'restaurant' },
                { type: { $exists: false } }
            ];
        }

        const restaurants = await Restaurant.find(query);

        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants,
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Get a single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, msg: 'Restaurant not found' });
        }

        res.status(200).json({
            success: true,
            data: restaurant,
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
