import pg from 'pg';

/** Run a query against the application database (DATABASE_URL). Used for test setup and persistence checks. */
export async function sql(text, params = []) {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set; these tests need it for setup and persistence checks (see README).');
    }
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        return (await client.query(text, params)).rows;
    } finally {
        await client.end();
    }
}
