const ReviewModel = require('../models/reviewModel');

exports.addReview = async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const userId = req.user.id; // Assumes Auth middleware populates req.user

        const review = await ReviewModel.create({
            userId,
            productId: product_id,
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
    try {
        const reviews = await ReviewModel.findByProductId(req.params.productId);
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};
