const db = require('../db');

class ReviewModel {
    static async create({ userId, productId, rating, comment }) {
        const query = `
            INSERT INTO reviews (user_id, product_id, rating, comment)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const { rows } = await db.query(query, [userId, productId, rating, comment]);
        return rows[0];
    }

    static async findByProductId(productId) {
        const query = `
            SELECT r.*, u.email 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = $1
            ORDER BY r.created_at DESC;
        `;
        const { rows } = await db.query(query, [productId]);
        return rows;
    }
}

module.exports = ReviewModel;
