const express = require('express');
const router = express.Router();
const { getCredits } = require('../controllers/credits');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getCredits);

module.exports = router;
