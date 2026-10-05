const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const targetUrl = new URL(process.env.DATABASE_URL);
const dbName = targetUrl.pathname.slice(1);

// Admin connection: same server and credentials, but the default 'postgres' database
const adminUrl = new URL(targetUrl);
adminUrl.pathname = '/postgres';

const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        category_id INTEGER REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        transaction_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL
    );
`;

const seedDataQuery = `
    INSERT INTO categories (name) VALUES 
    ('Electronics'), ('Clothing'), ('Books') 
    ON CONFLICT (name) DO NOTHING;
`;

async function setupDatabase() {
    const adminPool = new Pool({ connectionString: adminUrl.toString() });
    try {
        const res = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (res.rowCount === 0) {
            console.log(`${dbName} does not exist. Creating...`);
            // Identifiers cannot be parameterised; dbName comes from our own DATABASE_URL
            await adminPool.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        } else {
            console.log(`${dbName} already exists.`);
        }
    } finally {
        await adminPool.end();
    }

    const appPool = new Pool({ connectionString: targetUrl.toString() });
    try {
        console.log('Creating tables...');
        await appPool.query(createTablesQuery);
        console.log('Seeding initial data...');
        await appPool.query(seedDataQuery);
        console.log('Database ready.');
    } finally {
        await appPool.end();
    }
}

setupDatabase().catch((err) => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
