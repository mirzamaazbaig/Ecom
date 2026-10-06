
const db = require('../db');

/** Error carrying the HTTP status the controller should respond with. */
class OrderError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'OrderError';
        this.status = status;
    }
}

class OrderModel {
    /**
     * Create an order from the requested { productId, quantity } lines.
     *
     * Prices and the total are always taken from the catalogue, never from the client.
     * Product rows are locked for the duration of the transaction so concurrent orders
     * cannot oversell stock. Everything is validated before anything is written, and
     * the whole order is rolled back on any failure.
     */
    static async create(userId, items, transactionHash = null) {
        // Merge duplicate lines for the same product
        const requested = new Map();
        for (const item of items) {
            const productId = Number(item?.productId);
            const quantity = Number(item?.quantity);
            if (!Number.isInteger(productId) || productId <= 0 || productId > 2147483647) {
                throw new OrderError(400, 'Each item needs a valid productId');
            }
            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new OrderError(400, 'Each item needs a quantity that is a positive whole number');
            }
            requested.set(productId, (requested.get(productId) || 0) + quantity);
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Lock in id order so concurrent orders cannot deadlock each other
            const productIds = [...requested.keys()].sort((a, b) => a - b);
            const { rows: products } = await client.query(
                'SELECT id, name, price, stock FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
                [productIds]
            );
            const byId = new Map(products.map(p => [p.id, p]));

            for (const [productId, quantity] of requested) {
                const product = byId.get(productId);
                if (!product) {
                    throw new OrderError(404, `Product ${productId} not found`);
                }
                if (product.stock < quantity) {
                    throw new OrderError(409, `Insufficient stock for "${product.name}": ${product.stock} available, ${quantity} requested`);
                }
            }

            // Total in cents to avoid floating point drift
            let totalCents = 0;
            for (const [productId, quantity] of requested) {
                totalCents += Math.round(Number(byId.get(productId).price) * 100) * quantity;
            }
            const totalAmount = totalCents / 100;

            const { rows: orderRows } = await client.query(
                `INSERT INTO orders(user_id, total_amount, transaction_hash)
                 VALUES($1, $2, $3)
                 RETURNING id, total_amount, created_at, status`,
                [userId, totalAmount, transactionHash]
            );
            const order = orderRows[0];

            for (const [productId, quantity] of requested) {
                await client.query(
                    `INSERT INTO order_items(order_id, product_id, quantity, price_at_purchase)
                     VALUES($1, $2, $3, $4)`,
                    [order.id, productId, quantity, byId.get(productId).price]
                );
                await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);
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
module.exports.OrderError = OrderError;
