const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/admin');
const { getCoupons, createCoupon, deleteCoupon } = require('../controllers/coupons');
const { createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantById, updateMenuItem } = require('../controllers/restaurantsAdmin');
const { updateOrderingStatus } = require('../controllers/settings');
const { protect, authorize } = require('../middleware/auth');

// Note: All routes in this file are automatically prefixed with /api/admin

// Order Management Routes (for admin & deliveryadmin)
router.route('/orders')
    .get(protect, authorize('admin', 'deliveryadmin'), getAllOrders);
router.route('/orders/:id')
    .put(protect, authorize('admin', 'deliveryadmin'), updateOrderStatus);
    
// Settings Management (for admin ONLY)
router.route('/settings/ordering')
    .put(protect, authorize('admin'), updateOrderingStatus);

// Coupon Management Routes (for admin ONLY)
router.route('/coupons')
    .get(protect, authorize('admin'), getCoupons)
    .post(protect, authorize('admin'), createCoupon);
router.route('/coupons/:id')
    .delete(protect, authorize('admin'), deleteCoupon);
    
// Restaurant Management Routes (for admin ONLY)
router.route('/restaurants')
    .post(protect, authorize('admin'), createRestaurant);
router.route('/restaurants/:id')
    .get(protect, authorize('admin'), getRestaurantById)
    .put(protect, authorize('admin'), updateRestaurant)
    .delete(protect, authorize('admin'), deleteRestaurant);

router.route('/restaurants/:restaurantId/menu/:itemId')
    .put(protect, authorize('admin'), updateMenuItem);

module.exports = router;
