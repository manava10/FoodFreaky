const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// @desc    Get all restaurants (for admins)
// @route   GET /api/admin/restaurants
// @access  Private (Admin)
exports.getAllRestaurants = async (req, res) => {
    try {
        // Optimize: Exclude menu data for list view (can be fetched separately if needed)
        // Use lean() for faster queries (returns plain JS objects instead of Mongoose documents)
        const startTime = Date.now();
        const restaurants = await Restaurant.find()
            .select('-menu') // Exclude menu data for list view - this is the key optimization!
            .lean() // Use lean() for 2-3x faster queries
            .sort({ createdAt: -1 });
        const queryTime = Date.now() - startTime;

        // Log slow queries for monitoring
        if (queryTime > 1000) {
            logger.warn('Slow admin restaurants query detected', { queryTime, count: restaurants.length });
        }

        logger.info(`Admin ${req.user.id} fetched restaurants`, { count: restaurants.length, queryTime });
        
        res.json({ success: true, data: restaurants });
    } catch (error) {
        logger.error('Get all restaurants error:', { error: error.message, stack: error.stack, userId: req.user?.id });
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get a single restaurant by ID (for admins)
// @route   GET /api/admin/restaurants/:id
// @access  Private (Admin)
exports.getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }
        // This admin route sends back the full restaurant object, including the menu
        res.json({ success: true, data: restaurant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Create a restaurant
// @route   POST /api/admin/restaurants
// @access  Private (Admin)
exports.createRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.create(req.body);
        res.status(201).json({ success: true, data: restaurant });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update a restaurant
// @route   PUT /api/admin/restaurants/:id
// @access  Private (Admin)
exports.updateRestaurant = async (req, res) => {
    try {
        let restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }
        restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.json({ success: true, data: restaurant });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a restaurant
// @route   DELETE /api/admin/restaurants/:id
// @access  Private (Admin)
exports.deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }
        await restaurant.deleteOne();
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Toggle restaurant accepting orders status
// @route   PUT /api/admin/restaurants/:id/accepting-orders
// @access  Private (Admin)
exports.toggleAcceptingOrders = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }
        
        restaurant.isAcceptingOrders = !restaurant.isAcceptingOrders;
        await restaurant.save();
        
        res.json({ 
            success: true, 
            data: restaurant,
            message: restaurant.isAcceptingOrders 
                ? 'Restaurant is now accepting orders' 
                : 'Restaurant is no longer accepting orders'
        });
    } catch (error) {
        console.error('Error toggling accepting orders:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Add a new menu item to a restaurant's category
// @route   POST /api/admin/restaurants/:restaurantId/menu
// @access  Private (Admin)
exports.addMenuItem = async (req, res) => {
    try {
        const { category, name, price, description, emoji, imageUrl } = req.body;
        const { restaurantId } = req.params;

        const item = { name, price, description, emoji, imageUrl };
        const options = { new: true, runValidators: true };
        // Each push resolves the category against the current document. A stale
        // array index must never send an item to another category after deletion.
        for (let attempt = 0; attempt < 3; attempt++) {
            let restaurant = await Restaurant.findOneAndUpdate(
                { _id: restaurantId, 'menu.category': category },
                { $push: { 'menu.$.items': item } },
                options
            ).lean();
            if (restaurant) return res.status(201).json({ success: true, data: restaurant });

            // Create the category only if another writer has not created it.
            restaurant = await Restaurant.findOneAndUpdate(
                { _id: restaurantId, 'menu.category': { $ne: category } },
                { $push: { menu: { category, items: [item] } } },
                options
            ).lean();
            if (restaurant) return res.status(201).json({ success: true, data: restaurant });
            // A competing addition/deletion can change the category between the
            // two conditional operations. Recheck instead of replacing the menu.
        }
        if (!await Restaurant.exists({ _id: restaurantId })) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }
        res.status(409).json({ msg: 'Menu changed during this request. Please try again.' });

    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update a menu item
// @route   PUT /api/admin/restaurants/:restaurantId/menu/:itemId
// @access  Private (Admin)
exports.updateMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const fields = {};
        for (const field of ['name', 'price', 'description', 'emoji', 'imageUrl']) {
            if (req.body[field] !== undefined) {
                fields[`menu.$[category].items.$[item].${field}`] = req.body[field];
            }
        }
        const restaurant = await Restaurant.findOneAndUpdate(
            { _id: restaurantId, 'menu.items._id': itemId },
            { $set: fields },
            {
                new: true,
                runValidators: true,
                arrayFilters: [{ 'category.items._id': itemId }, { 'item._id': itemId }],
            }
        ).lean();
        if (!restaurant) return res.status(404).json({ msg: 'Restaurant or menu item not found' });
        res.json({ success: true, data: restaurant });
    } catch (error) {
        logger.error('Error updating menu item', { error: error.message });
        res.status(error.name === 'ValidationError' ? 400 : 500).json({ msg: 'Failed to update menu item' });
    }
};

// Remove the item and empty categories atomically, without replacing other edits.
exports.deleteMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const mongoose = require('mongoose');
        const restaurant = await Restaurant.findOneAndUpdate(
            { _id: restaurantId, 'menu.items._id': itemId },
            [{ $set: { menu: {
                $filter: {
                    input: { $map: {
                        input: '$menu', as: 'category',
                        in: { $mergeObjects: ['$$category', { items: { $filter: {
                            input: '$$category.items', as: 'item',
                            cond: { $ne: ['$$item._id', new mongoose.Types.ObjectId(itemId)] },
                        } } }] },
                    } },
                    as: 'category', cond: { $gt: [{ $size: '$$category.items' }, 0] },
                },
            } } }],
            { new: true }
        ).lean();
        if (!restaurant) return res.status(404).json({ msg: 'Restaurant or menu item not found' });
        res.json({ success: true, data: restaurant });
    } catch (error) {
        logger.error('Error deleting menu item', { error: error.message });
        res.status(500).json({ msg: 'Failed to delete menu item' });
    }
};
