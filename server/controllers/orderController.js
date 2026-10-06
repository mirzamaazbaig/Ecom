const OrderModel = require('../models/orderModel');
const { OrderError } = OrderModel;

exports.createOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        // Prices and totals sent by the client are ignored: the server prices the order
        const { items, transactionHash } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const newOrder = await OrderModel.create(userId, items, transactionHash);
        res.status(201).json({ message: 'Order created', order: newOrder });
    } catch (error) {
        if (error instanceof OrderError) {
            return res.status(error.status).json({ message: error.message });
        }
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
