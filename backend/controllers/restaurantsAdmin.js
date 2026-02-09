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
        const { category, name, price, emoji, imageUrl } = req.body;
        const { restaurantId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }

        // Find the menu category
        const menuCategory = restaurant.menu.find(m => m.category === category);

        if (menuCategory) {
            // Add item to existing category
            menuCategory.items.push({ name, price, emoji, imageUrl });
        } else {
            // Create new category and add item
            restaurant.menu.push({
                category,
                items: [{ name, price, emoji, imageUrl }]
            });
        }

        await restaurant.save();
        res.status(201).json({ success: true, data: restaurant });

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
        const { name, price, description, imageUrl } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }

        let itemUpdated = false;
        restaurant.menu.forEach(menuCategory => {
            const item = menuCategory.items.id(itemId);
            if (item) {
                item.name = name !== undefined ? name : item.name;
                item.price = price !== undefined ? price : item.price;
                item.description = description !== undefined ? description : item.description;
                item.imageUrl = imageUrl !== undefined ? imageUrl : item.imageUrl;
                itemUpdated = true;
            }
        });

        if (!itemUpdated) {
            return res.status(404).json({ msg: 'Menu item not found' });
        }

        const updatedRestaurant = await restaurant.save();

        res.json({
            success: true,
            data: updatedRestaurant,
        });

    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
