const WishlistModel = require('../models/wishlistModel');
const ProductModel = require('../models/productModel');
const { parseId } = require('../utils/validation');

exports.addToWishlist = async (req, res) => {
    try {
        const productId = parseId(req.body.product_id);
        const userId = req.user.id;

        if (productId === null) {
            return res.status(400).json({ message: 'A valid product_id is required' });
        }
        if (!(await ProductModel.findById(productId))) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const item = await WishlistModel.add({ userId, productId });
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
        const productId = parseId(req.params.productId);
        const userId = req.user.id;

        if (productId === null) {
            return res.status(400).json({ message: 'Invalid product id' });
        }
        await WishlistModel.remove({ userId, productId });
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error removing form wishlist' });
    }
};
