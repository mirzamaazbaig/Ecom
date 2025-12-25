const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/:productId', reviewController.getProductReviews);
router.post('/', isAuthenticated, reviewController.addReview);

module.exports = router;
