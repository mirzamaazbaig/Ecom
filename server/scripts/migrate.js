const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Runs every file in db/migrations in name order (001_..., 002_...).
async function runMigrations() {
    const dir = path.join(__dirname, '../db/migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    try {
        for (const file of files) {
            console.log(`Running Migration: ${file}`);
            await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        }
        console.log('Migrations executed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigrations();
