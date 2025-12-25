const db = require('../db');

class ProductModel {
    static async findAll({ categoryId, limit = 20, offset = 0, sortBy = 'created_at', order = 'DESC', search = '', maxPrice = null }) {
        let query = `
      SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0)::FLOAT as avg_rating, COUNT(r.id)::INT as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE 1=1
    `;
        const params = [];

        // Search
        if (search) {
            query += ` AND (p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        // Filtering
        if (categoryId) {
            query += ` AND p.category_id = $${params.length + 1}`;
            params.push(categoryId);
        }

        if (maxPrice) {
            query += ` AND p.price <= $${params.length + 1}`;
            params.push(maxPrice);
        }

        // Group By for Aggregates
        query += ` GROUP BY p.id, c.name`;

        // Sorting 
        const allowedSorts = ['price', 'created_at', 'name', 'avg_rating'];
        let sortCol = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
        if (sortCol === 'price' || sortCol === 'created_at' || sortCol === 'name') {
            sortCol = `p.${sortCol}`;
        }
        // avg_rating is an alias, so we use it directly in ORDER BY (Postgres supports alias in ORDER BY)

        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortCol} ${sortOrder}`;

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
