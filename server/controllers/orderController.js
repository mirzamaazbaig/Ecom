const OrderModel = require('../models/orderModel');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { totalAmount, items, transactionHash } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const newOrder = await OrderModel.create(userId, totalAmount, items, transactionHash);
        res.status(201).json({ message: 'Order created', order: newOrder });
    } catch (error) {
        console.error('Order Create Error:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await OrderModel.findByUserId(userId);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.findAll();
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
