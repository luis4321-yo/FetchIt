const { Account } = require('../models/accounts');

// ── GET /signup ──────────────────────────────────────────────
const getSignup = (req, res) => {
  if (req.session.accountId) return res.redirect('/');
  res.render('accounts/signup', {
    pageTitle: 'Create Account',
    path: '/signup',
    error: null,
    formData: {}
  });
};

// ── POST /signup ─────────────────────────────────────────────
const postSignup = async (req, res) => {
  const { name, email, password, confirmPassword, contact_number,
          street_number, city, district, province, postal_code } = req.body;

  // Basic validation
  const errors = [];
  if (!name || !name.trim())          errors.push('Full name is required.');
  if (!email || !email.trim())        errors.push('Email is required.');
  if (!password)                      errors.push('Password is required.');
  if (password && password.length < 6) errors.push('Password must be at least 6 characters.');
  if (password !== confirmPassword)   errors.push('Passwords do not match.');

  if (errors.length > 0) {
    return res.render('accounts/signup', {
      pageTitle: 'Create Account',
      path: '/signup',
      error: errors.join(' '),
      formData: req.body
    });
  }

  try {
    const accountId = await Account.create({
      name: name.trim(), email: email.trim().toLowerCase(), password,
      contact_number, street_number, city, district, province, postal_code
    });

    // Award welcome bonus
    const Loyalty = require('../models/loyalty');
    await Loyalty.awardWelcomeBonus(accountId);

    req.session.accountId = accountId;
    req.session.accountName = name.trim();
    res.redirect('/');
  } catch (err) {
    const msg = err.message === 'EMAIL_TAKEN'
      ? 'An account with this email already exists.'
      : 'Something went wrong. Please try again.';

    res.render('accounts/signup', {
      pageTitle: 'Create Account',
      path: '/signup',
      error: msg,
      formData: req.body
    });
  }
};

// ── GET /login ───────────────────────────────────────────────
const getLogin = (req, res) => {
  if (req.session.accountId) return res.redirect('/');
  res.render('accounts/login', {
    pageTitle: 'Sign In',
    path: '/login',
    error: null,
    formData: {}
  });
};

// ── POST /login ──────────────────────────────────────────────
const postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('accounts/login', {
      pageTitle: 'Sign In',
      path: '/login',
      error: 'Email and password are required.',
      formData: req.body
    });
  }

  try {
    const account = await Account.login(email.trim().toLowerCase(), password);

    if (!account) {
      return res.render('accounts/login', {
        pageTitle: 'Sign In',
        path: '/login',
        error: 'Incorrect email or password.',
        formData: req.body
      });
    }

    req.session.accountId = account.account_id;
    req.session.accountName = account.name;

    // Redirect to originally requested page if any
    const redirect = req.session.redirectAfterLogin || '/';
    delete req.session.redirectAfterLogin;
    res.redirect(redirect);
  } catch (err) {
    res.render('accounts/login', {
      pageTitle: 'Sign In',
      path: '/login',
      error: 'Something went wrong. Please try again.',
      formData: req.body
    });
  }
};

// ── POST /logout ─────────────────────────────────────────────
const postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// ── GET /account ─────────────────────────────────────────────
const getAccount = async (req, res) => {
  if (!req.session.accountId) return res.redirect('/login');

  try {
    const account = await Account.findById(req.session.accountId);
    if (!account) {
      req.session.destroy();
      return res.redirect('/login');
    }

    const Loyalty = require('../models/loyalty');
    const loyaltyBalance = await Loyalty.getBalance(req.session.accountId);
    const loyaltyValue = Loyalty.pointsToValue(loyaltyBalance);

    res.render('accounts/account', {
      pageTitle: 'My Account',
      path: '/account',
      account,
      loyaltyBalance,
      loyaltyValue,
      error: null,
      success: null
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Server Error' });
  }
};

// ── PATCH /account ───────────────────────────────────────────
const patchAccount = async (req, res) => {
  if (!req.session.accountId) return res.redirect('/login');

  const { password, confirmPassword, contact_number,
          street_number, city, district, province, postal_code } = req.body;

  // If password provided, validate it
  if (password) {
    if (password.length < 6) {
      const account = await Account.findById(req.session.accountId);
      const Loyalty = require('../models/loyalty');
      const loyaltyBalance = await Loyalty.getBalance(req.session.accountId);
      return res.render('accounts/account', {
        pageTitle: 'My Account', path: '/account', account,
        loyaltyBalance, loyaltyValue: Loyalty.pointsToValue(loyaltyBalance),
        error: 'Password must be at least 6 characters.', success: null
      });
    }
    if (password !== confirmPassword) {
      const account = await Account.findById(req.session.accountId);
      const Loyalty = require('../models/loyalty');
      const loyaltyBalance = await Loyalty.getBalance(req.session.accountId);
      return res.render('accounts/account', {
        pageTitle: 'My Account', path: '/account', account,
        loyaltyBalance, loyaltyValue: Loyalty.pointsToValue(loyaltyBalance),
        error: 'Passwords do not match.', success: null
      });
    }
  }

  try {
    const updated = await Account.update(req.session.accountId, {
      password: password || undefined,
      contact_number, street_number, city, district, province, postal_code
    });

    const Loyalty = require('../models/loyalty');
    const loyaltyBalance = await Loyalty.getBalance(req.session.accountId);

    res.render('accounts/account', {
      pageTitle: 'My Account', path: '/account',
      account: updated,
      loyaltyBalance,
      loyaltyValue: Loyalty.pointsToValue(loyaltyBalance),
      error: null,
      success: 'Your account has been updated successfully.'
    });
  } catch (err) {
    const account = await Account.findById(req.session.accountId);
    const Loyalty = require('../models/loyalty');
    const loyaltyBalance = await Loyalty.getBalance(req.session.accountId);
    res.render('accounts/account', {
      pageTitle: 'My Account', path: '/account', account,
      loyaltyBalance, loyaltyValue: Loyalty.pointsToValue(loyaltyBalance),
      error: 'Failed to update account. Please try again.', success: null
    });
  }
};

// ── POST /account/delete ─────────────────────────────────────
const deleteAccount = async (req, res) => {
  if (!req.session.accountId) return res.redirect('/login');

  try {
    await Account.delete(req.session.accountId);
    req.session.destroy(() => {
      res.redirect('/');
    });
  } catch (err) {
    res.status(500).render('500', { pageTitle: 'Server Error' });
  }
};

module.exports = {
  getSignup, postSignup,
  getLogin, postLogin,
  postLogout,
  getAccount, patchAccount,
  deleteAccount
};
