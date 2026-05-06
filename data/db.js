require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'fetchit_user',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || 'FetchIt@2024!',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'fetchit',
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

module.exports = db;