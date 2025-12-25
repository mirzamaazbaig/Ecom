const db = require('../db');

class WishlistModel {
    static async add({ userId, productId }) {
        const query = `
            INSERT INTO wishlist (user_id, product_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, product_id) DO NOTHING
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId, productId]);
        return rows[0];
    }

    static async findByUserId(userId) {
        const query = `
            SELECT w.*, p.name, p.price, p.image_url
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows;
    }

    static async remove({ userId, productId }) {
        const query = 'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id';
        const { rows } = await db.query(query, [userId, productId]);
        return rows[0];
    }
}

module.exports = WishlistModel;
