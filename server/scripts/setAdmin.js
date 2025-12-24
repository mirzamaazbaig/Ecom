const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const email = process.argv[2];

if (!email) {
    console.log('Usage: node scripts/setAdmin.js <email>');
    process.exit(1);
}

async function setAdmin() {
    try {
        const res = await pool.query("UPDATE users SET role = 'admin' WHERE email = $1 RETURNING *", [email]);
        if (res.rowCount === 0) {
            console.log('User not found.');
        } else {
            console.log(`User ${email} promoted to ADMIN.`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

setAdmin();
