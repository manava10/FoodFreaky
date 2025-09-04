const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurant } = require('../controllers/restaurants');

router.route('/').get(getRestaurants);
router.route('/:id').get(getRestaurant);

module.exports = router;
