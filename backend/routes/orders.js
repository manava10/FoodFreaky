const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    cancelOrder,
    getOrderInvoice
} = require('../controllers/orders');
const { protect } = require('../middleware/auth');

// All routes here are protected
router.use(protect);

router.route('/').post(createOrder);
router.route('/myorders').get(getMyOrders);
router.route('/:id/cancel').put(cancelOrder);
router.route('/:id/invoice').get(getOrderInvoice);

module.exports = router;
