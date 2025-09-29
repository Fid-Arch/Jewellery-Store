require('dotenv').config();
const mysql = require('mysql2/promise');

// Database Connection Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'capstone_db',
    ssl: {rejectUnauthorized: false},
    connectionLimit: 10,
    charset: 'utf8mb4',
    waitForConnections: true,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test the Database Connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

module.exports = pool;