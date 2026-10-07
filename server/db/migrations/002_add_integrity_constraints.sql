-- Integrity constraints the schema was missing (found by the database test suite).
-- Idempotent: safe to run more than once. Rows that already violate a rule make the migration fail, which is
-- intended: fix the data first.

-- products: stock is never missing or negative, price is never negative
UPDATE products SET stock = 0 WHERE stock IS NULL;
ALTER TABLE products ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN stock SET NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_nonnegative;
ALTER TABLE products ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_nonnegative;
ALTER TABLE products ADD CONSTRAINT products_price_nonnegative CHECK (price >= 0);

-- order lines belong to an order and a product, with a positive quantity and a non-negative price
ALTER TABLE order_items ALTER COLUMN order_id SET NOT NULL;
ALTER TABLE order_items ALTER COLUMN product_id SET NOT NULL;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_quantity_positive;
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_price_nonnegative;
ALTER TABLE order_items ADD CONSTRAINT order_items_price_nonnegative CHECK (price_at_purchase >= 0);

-- orders belong to a user and have a non-negative total
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_nonnegative;
ALTER TABLE orders ADD CONSTRAINT orders_total_nonnegative CHECK (total_amount >= 0);

-- users have a known role
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_known;
ALTER TABLE users ADD CONSTRAINT users_role_known CHECK (role IN ('user', 'admin'));
