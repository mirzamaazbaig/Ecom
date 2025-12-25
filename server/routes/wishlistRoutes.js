const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, wishlistController.getWishlist);
router.post('/', isAuthenticated, wishlistController.addToWishlist);
router.delete('/:productId', isAuthenticated, wishlistController.removeFromWishlist);

module.exports = router;
