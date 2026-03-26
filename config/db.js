/**
 * config/db.js
 * -------------
 * Shared Postgres connection pool.
 * Import this in any controller that needs database access.
 *
 * Usage:
 *   const pool = require("../config/db");
 */

const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;