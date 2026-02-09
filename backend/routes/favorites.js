const express = require('express');
const router = express.Router();
const {
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    checkFavorite
} = require('../controllers/favorites');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getFavorites);

router.route('/check/:restaurantId')
    .get(checkFavorite);

router.route('/:restaurantId')
    .post(addToFavorites)
    .delete(removeFromFavorites);

module.exports = router;
