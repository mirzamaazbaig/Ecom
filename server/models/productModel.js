const db = require('../db');

class ProductModel {
    static async findAll({ categoryId, limit = 20, offset = 0, sortBy = 'created_at', order = 'DESC' }) {
        let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
        const params = [];

        // Filtering
        if (categoryId) {
            query += ` WHERE p.category_id = $1`;
            params.push(categoryId);
        }

        // Sorting 
        const allowedSorts = ['price', 'created_at', 'name'];
        const sortCol = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY p.${sortCol} ${sortOrder}`;

        // Pagination
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const { rows } = await db.query(query, params);
        return rows;
    }

    static async findById(id) {
        const query = `
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
    `;
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async create({ name, description, price, stock, imageUrl, categoryId }) {
        const query = `
      INSERT INTO products (name, description, price, stock, image_url, category_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
        const { rows } = await db.query(query, [name, description, price, stock, imageUrl, categoryId]);
        return rows[0];
    }

    static async update(id, { name, description, price, stock, imageUrl, categoryId }) {
        const query = `
      UPDATE products 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description), 
          price = COALESCE($3, price), 
          stock = COALESCE($4, stock), 
          image_url = COALESCE($5, image_url), 
          category_id = COALESCE($6, category_id)
      WHERE id = $7
      RETURNING *;
    `;
        const { rows } = await db.query(query, [name, description, price, stock, imageUrl, categoryId, id]);
        return rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = $1 RETURNING id;';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = ProductModel;
