const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accounts');

// Signup
router.get('/signup', accountsController.getSignup);
router.post('/signup', accountsController.postSignup);

// Login / Logout
router.get('/login', accountsController.getLogin);
router.post('/login', accountsController.postLogin);
router.post('/logout', accountsController.postLogout);

// Account management (view + update + delete)
router.get('/account', accountsController.getAccount);
router.post('/account', accountsController.patchAccount);           // HTML forms can't send PATCH, so use POST
router.post('/account/delete', accountsController.deleteAccount);   // DELETE via POST for HTML form

module.exports = router;
