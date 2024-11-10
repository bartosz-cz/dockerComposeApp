const mysql = require("mysql2");

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "aplikacje",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// For Promises (async/await)
const promisePool = pool.promise();

module.exports = promisePool;
