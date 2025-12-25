const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const products = [
    {
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Experience pure silence with our top-tier noise cancelling technology. 30-hour battery life.',
        price: 299.99,
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        category: 'Electronics'
    },
    {
        name: 'Smartphone 15 Pro',
        description: 'The latest in smartphone technology. Titanium design, A17 Pro chip.',
        price: 999.00,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500&auto=format&fit=crop&q=60',
        category: 'Electronics'
    },
    {
        name: '4K Ultra HD Monitor',
        description: '27-inch IPS display with 144Hz refresh rate. Perfect for gaming and professional work.',
        price: 449.50,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
        category: 'Electronics'
    },
    {
        name: 'Premium Cotton T-Shirt',
        description: '100% organic cotton, breathable and durable. Available in multiple colors.',
        price: 24.99,
        stock: 100,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60',
        category: 'Clothing'
    },
    {
        name: 'Denim Jacket',
        description: 'Classic vintage style denim jacket. Perfect for all seasons.',
        price: 89.95,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60',
        category: 'Clothing'
    },
    {
        name: 'Running Sneakers',
        description: 'Lightweight, comfortable, and designed for high performance running.',
        price: 119.99,
        stock: 60,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
        category: 'Clothing'
    },
    {
        name: 'The Great Gatsby',
        description: 'F. Scott Fitzgeralds classic novel of the Jazz Age.',
        price: 12.50,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60',
        category: 'Books'
    },
    {
        name: 'Clean Code',
        description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin.',
        price: 45.00,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=500&auto=format&fit=crop&q=60',
        category: 'Books'
    }
];

async function seed() {
    try {
        console.log('Fetching Categories...');
        const { rows: categories } = await pool.query('SELECT * FROM categories');
        const catMap = categories.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.id }), {});

        console.log('Seeding Products...');
        for (const p of products) {
            const catId = catMap[p.category];
            if (!catId) {
                console.warn(`Category ${p.category} not found, skipping ${p.name}`);
                continue;
            }

            // Check if exists to avoid duplicates (optional, based on name)
            const { rows: existing } = await pool.query('SELECT id FROM products WHERE name = $1', [p.name]);
            if (existing.length > 0) {
                console.log(`Product "${p.name}" already exists, skipping.`);
                continue;
            }

            await pool.query(`
                INSERT INTO products (name, description, price, stock, image_url, category_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [p.name, p.description, p.price, p.stock, p.image_url, catId]);
            console.log(`Added: ${p.name}`);
        }

        console.log('Seeding Complete!');
    } catch (err) {
        console.error('Seeding Failed:', err);
    } finally {
        pool.end();
    }
}

seed();
