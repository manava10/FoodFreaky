const express = require('express');
const router = express.Router();
const { getAppSettings } = require('../controllers/settings');

// @desc    Get all app settings
// @route   GET /api/settings
// @access  Public
router.get('/', getAppSettings);

module.exports = router;
