const mysql = require("mysql2");

const connect = mysql.createPool({
  host: "database",
  user: "root",
  password: "rootpassword",
  database: "aplikacje",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = connect.promise();

module.exports = promisePool;
