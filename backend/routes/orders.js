const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    cancelOrder,
    getOrderInvoice,
    rateOrder,
    getReorderData,
} = require('../controllers/orders');
const { protect } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { validateOrderId } = require('../middleware/sanitizer');
const { validate, schemas } = require('../middleware/validate');

// All routes here are protected
router.use(protect);

// POST /api/orders - Create order (with strict rate limiting and validation)
router.route('/').post(orderLimiter, validate(schemas.createOrder), createOrder);

// GET /api/orders/myorders - Get user's orders
router.route('/myorders').get(getMyOrders);

// PUT /api/orders/:id/cancel - Cancel order (with ID validation)
router.route('/:id/cancel').put(validateOrderId, cancelOrder);

// GET /api/orders/:id/invoice - Get order invoice (with ID validation)
router.route('/:id/invoice').get(validateOrderId, getOrderInvoice);

// PUT /api/orders/:id/rate - Rate order (with ID validation and schema validation)
router.route('/:id/rate').put(validateOrderId, validate(schemas.rateOrder), rateOrder);

// GET /api/orders/:id/reorder - Get order data for reorder (with ID validation)
router.route('/:id/reorder').get(validateOrderId, getReorderData);

module.exports = router;
