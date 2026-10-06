const ProductModel = require('../models/productModel');
const { parseId } = require('../utils/validation');

exports.getAllProducts = async (req, res) => {
    try {
        const { category_id, limit, offset, sort_by, order, search, max_price } = req.query;
        const products = await ProductModel.findAll({
            categoryId: category_id,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
            sortBy: sort_by,
            order: order,
            search: search,
            maxPrice: max_price ? parseFloat(max_price) : null
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProductById = async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    try {
        const product = await ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const newProduct = await ProductModel.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProduct = async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    try {
        const updatedProduct = await ProductModel.update(id, req.body);
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteProduct = async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    try {
        const result = await ProductModel.delete(id);
        if (!result) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
