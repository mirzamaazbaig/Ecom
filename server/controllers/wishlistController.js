const WishlistModel = require('../models/wishlistModel');

exports.addToWishlist = async (req, res) => {
    try {
        const { product_id } = req.body;
        const userId = req.user.id;

        const item = await WishlistModel.add({ userId, productId: product_id });
        if (!item) {
            return res.status(200).json({ message: 'Item already in wishlist' });
        }
        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error adding to wishlist' });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await WishlistModel.findByUserId(userId);
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching wishlist' });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        await WishlistModel.remove({ userId, productId });
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error removing form wishlist' });
    }
};
