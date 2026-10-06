const ReviewModel = require('../models/reviewModel');
const ProductModel = require('../models/productModel');
const { parseId, isValidRating } = require('../utils/validation');

exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = parseId(req.body.product_id);
        const userId = req.user.id; // Assumes Auth middleware populates req.user

        if (productId === null) {
            return res.status(400).json({ message: 'A valid product_id is required' });
        }
        if (!isValidRating(rating)) {
            return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
        }
        if (comment !== undefined && comment !== null && typeof comment !== 'string') {
            return res.status(400).json({ message: 'Comment must be text' });
        }
        if (!(await ProductModel.findById(productId))) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const review = await ReviewModel.create({
            userId,
            productId,
            rating,
            comment
        });
        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding review' });
    }
};

exports.getProductReviews = async (req, res) => {
    const productId = parseId(req.params.productId);
    if (productId === null) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    try {
        const reviews = await ReviewModel.findByProductId(productId);
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};
