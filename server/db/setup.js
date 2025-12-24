const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: 'postgres',
    password: 'password', // Default/Dev password
    host: 'localhost',
    port: 5432,
    database: 'postgres' // Connect to default DB first to create ecom_db
};

const createDbQuery = `CREATE DATABASE ecom_db;`;

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

// Seed Admin? Maybe later.

async function setupDatabase() {
    let pool = new Pool(config);

    try {
        // 1. Create Database if strictly needed (Handling "already exists" is tricky in raw SQL without error catching)
        // We will just try to connect to ecom_db directly first. If it fails, we create it.

        // Actually simplest is check if db exists
        const res = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'ecom_db'");
        if (res.rowCount === 0) {
            console.log('ecom_db does not exist. Creating...');
            await pool.query(createDbQuery);
            console.log('ecom_db created.');
        } else {
            console.log('ecom_db already exists.');
        }

    } catch (err) {
        console.error('Error during DB check/creation:', err);
    } finally {
        await pool.end();
    }

    // 2. Connect to ecom_db and create tables
    const appPool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Connecting to ecom_db...');
        await appPool.connect();
        console.log('Creating tables...');
        await appPool.query(createTablesQuery);
        console.log('Tables created.');

        console.log('Seeding initial data...');
        await appPool.query(seedDataQuery);
        console.log('Seed data inserted.');

    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await appPool.end();
    }
}

setupDatabase();
