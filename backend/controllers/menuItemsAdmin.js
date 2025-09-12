const Restaurant = require('../models/Restaurant');

// @desc    Update a specific menu item within a restaurant
// @route   PUT /api/admin/restaurants/:restaurantId/menu/:itemId
// @access  Private (Admin)
exports.updateMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const { name, price, description, imageUrl, category } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ msg: 'Restaurant not found' });
        }

        // Find the menu item and update it
        let itemUpdated = false;
        restaurant.menu.forEach(menuCategory => {
            const item = menuCategory.items.id(itemId);
            if (item) {
                item.name = name || item.name;
                item.price = price || item.price;
                item.description = description !== undefined ? description : item.description;
                item.imageUrl = imageUrl !== undefined ? imageUrl : item.imageUrl;
                // Note: Changing category is a more complex operation (move item) and is omitted here for simplicity.
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
