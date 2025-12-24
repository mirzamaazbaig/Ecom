
const db = require('../db');

class OrderModel {
    static async create(userId, totalAmount, items, transactionHash = null) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Order
            const insertOrderQuery = `
        INSERT INTO orders(user_id, total_amount, transaction_hash)
VALUES($1, $2, $3)
        RETURNING id, created_at, status;
`;
            const { rows: orderRows } = await client.query(insertOrderQuery, [userId, totalAmount, transactionHash]);
            const order = orderRows[0];

            // 2. Create Order Items and Update Stock
            const insertItemQuery = `
        INSERT INTO order_items(order_id, product_id, quantity, price_at_purchase)
VALUES($1, $2, $3, $4)
    `;
            const updateStockQuery = `
        UPDATE products SET stock = stock - $1 WHERE id = $2
    `;

            for (const item of items) {
                await client.query(insertItemQuery, [order.id, item.productId, item.quantity, item.price]);
                await client.query(updateStockQuery, [item.quantity, item.productId]);
            }

            await client.query('COMMIT');
            return order;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async findByUserId(userId) {
        const query = `
      SELECT o.id, o.total_amount, o.status, o.created_at,
    json_agg(json_build_object(
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'price', oi.price_at_purchase,
        'name', p.name,
        'image', p.image_url
    )) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;
`;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }

    static async findAll() {
        const query = `
      SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC;
`;
        const { rows } = await db.query(query);
        return rows;
    }
}

module.exports = OrderModel;
