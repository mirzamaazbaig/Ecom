-- Add Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Seed some dummy reviews for existing products
INSERT INTO reviews (user_id, product_id, rating, comment) 
SELECT id, (SELECT id FROM products ORDER BY RANDOM() LIMIT 1), 5, 'Amazing product! Highly recommended.'
FROM users LIMIT 5;

INSERT INTO reviews (user_id, product_id, rating, comment) 
SELECT id, (SELECT id FROM products ORDER BY RANDOM() LIMIT 1), 4, 'Good quality but shipping was slow.'
FROM users LIMIT 5;
