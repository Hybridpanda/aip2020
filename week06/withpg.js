const express = require('express');
const { Pool } = require('pg');
const port = 4000;
const app = express();

const COUNTER_NOT_FOUND = 'COUNTER_NOT_FOUND';
const DATABASE_ERROR = 'DATABASE_ERROR';

const pool = new Pool({
    database: 'postgres'
});

// Initialize the database connection
// by ensuring the counter table is declared
// and there is a primary counter (counter id 1)
async function initialize() {
    // Ensure the counter table is defined
    await pool.query(
        `create table if not exists counter(
            id integer primary key,
            count integer
        )`
    );

    // Add the primary counter if one does not already exist
    await pool.query(
        `insert into counter(id, count) values (1, 0) on conflict do nothing`
    );
}

// Retreive the current value of the primary counter (counter id 1)
// { success: true, count: ... } on success
// { success: false, error: ... } on error, with either a COUNTER_NOT_FOUND error or a DATABASE_ERROR
app.get('/api/count', async (_req, res) => {
    try {
        let result = await pool.query(
            `select count
             from counter
             where id = 1`
        );
        if (result.rowCount > 0) {
            res.json({ count: result.rows[0].count, success: true });
        } else {
            res.json({ success: false, error: COUNTER_NOT_FOUND });
        }
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: DATABASE_ERROR });
    }
});

// Increments and returns the current value of the primary counter (counter id 1)
// { success: true, count: ... } on success
// { success: false, error: ... } on error, with either a COUNTER_NOT_FOUND error or a DATABASE_ERROR
app.post('/api/increment', async (_req, res) => {
    try {
        let result = await pool.query(
            `update counter
             set count = count + 1
             where id = 1
             returning count`
        );
        if (result.rowCount > 0) {
            res.json({ count: result.rows[0].count, success: true });
        } else {
            res.json({ success: false, error: COUNTER_NOT_FOUND });
        }
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: DATABASE_ERROR });
    }
});

// Initialize and start the server
async function start() {
    await initialize();
    app.listen(port, () => {
        console.log(`API available at http://localhost:${port}/api`);
    });
}

start();
