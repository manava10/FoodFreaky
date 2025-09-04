const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, cancelOrder } = require('../controllers/orders');
const { protect } = require('../middleware/auth');

router.route('/')
    .post(protect, createOrder);

router.route('/myorders')
    .get(protect, getMyOrders);
    
router.route('/:id/cancel')
    .put(protect, cancelOrder);

module.exports = router;
