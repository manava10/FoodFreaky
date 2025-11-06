const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/admin');
const { getCoupons, createCoupon, deleteCoupon } = require('../controllers/coupons');
const { 
    getAllRestaurants,
    createRestaurant, 
    updateRestaurant, 
    deleteRestaurant, 
    getRestaurantById, 
    updateMenuItem,
    addMenuItem,
    toggleAcceptingOrders
} = require('../controllers/restaurantsAdmin');
const { updateSettings } = require('../controllers/settings');
const { protect, authorize } = require('../middleware/auth');

// Note: All routes in this file are automatically prefixed with /api/admin

// Order Management Routes (for admin & deliveryadmin)
router.route('/orders')
    .get(protect, authorize('admin', 'deliveryadmin'), getAllOrders);
router.route('/orders/:id')
    .put(protect, authorize('admin', 'deliveryadmin'), updateOrderStatus);
    
// Settings Management (for admin ONLY)
router.route('/settings')
    .put(protect, authorize('admin'), updateSettings);

// Coupon Management Routes (for admin ONLY)
router.route('/coupons')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);
router.route('/coupons/:id')
    .delete(protect, authorize('admin'), deleteCoupon);
    
// Restaurant Management Routes (for admin ONLY)
router.route('/restaurants')
    .get(protect, authorize('admin'), getAllRestaurants)
    .post(protect, authorize('admin'), createRestaurant);
router.route('/restaurants/:id')
    .get(protect, authorize('admin'), getRestaurantById)
    .put(protect, authorize('admin'), updateRestaurant)
    .delete(protect, authorize('admin'), deleteRestaurant);
router.route('/restaurants/:id/accepting-orders')
    .put(protect, authorize('admin'), toggleAcceptingOrders);

router.route('/restaurants/:restaurantId/menu')
    .post(protect, authorize('admin'), addMenuItem);

router.route('/restaurants/:restaurantId/menu/:itemId')
    .put(protect, authorize('admin'), updateMenuItem);

module.exports = router;
