const express = require('express');
const router = express.Router();
const { getOrderingStatus } = require('../controllers/settings');

// @desc    Get the current ordering status
// @route   GET /api/settings/ordering
// @access  Public
router.get('/ordering', getOrderingStatus);

module.exports = router;
