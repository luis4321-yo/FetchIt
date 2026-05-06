require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');


const app = express();
const db = require('./data/db');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parser for JSON and URL-encoded forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for cart persistence
app.use(session({
  secret: 'fetchit-cart-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true
  }
}));

const shopRoutes = require('./routes/shop');
const accountRoutes = require('./routes/accounts');

app.use(shopRoutes);
app.use(accountRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { pageTitle: 'Server Error' });
});

app.listen(3000);