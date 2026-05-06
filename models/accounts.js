const db = require('../data/db');
const crypto = require('crypto');

// Simple hash using SHA-256 (no bcrypt dependency needed)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'fetchit-salt-2024').digest('hex');
}

class Account {
  constructor(account) {
    this.account_id = account.account_id;
    this.name = account.name;
    this.email = account.email;
    this.contact_number = account.contact_number;
    this.street_number = account.street_number;
    this.city = account.city;
    this.district = account.district;
    this.province = account.province;
    this.postal_code = account.postal_code;
    this.created_at = account.created_at;
  }

  // POST /accounts/signup — create a new account
  static async create({ name, email, password, contact_number, street_number, city, district, province, postal_code }) {
    // Check if email already exists
    const [existing] = await db.promise().query(
      'SELECT account_id FROM accounts WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      throw new Error('EMAIL_TAKEN');
    }

    const hashed = hashPassword(password);

    const [result] = await db.promise().query(
      `INSERT INTO accounts (name, email, password, contact_number, street_number, city, district, province, postal_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, contact_number || null, street_number || null, city || null, district || null, province || null, postal_code || null]
    );

    return result.insertId;
  }

  // POST /accounts/login — verify credentials
  static async login(email, password) {
    const hashed = hashPassword(password);
    const [rows] = await db.promise().query(
      'SELECT * FROM accounts WHERE email = ? AND password = ?',
      [email, hashed]
    );
    if (rows.length === 0) return null;
    return new Account(rows[0]);
  }

  // Find by ID (used internally)
  static async findById(id) {
    const [rows] = await db.promise().query(
      'SELECT * FROM accounts WHERE account_id = ?', [id]
    );
    if (rows.length === 0) return null;
    return new Account(rows[0]);
  }

  // PATCH /accounts/:id — update allowed fields only (no email change)
  static async update(id, { password, contact_number, street_number, city, district, province, postal_code }) {
    const fields = [];
    const values = [];

    if (password) {
      fields.push('password = ?');
      values.push(hashPassword(password));
    }
    if (contact_number !== undefined) { fields.push('contact_number = ?'); values.push(contact_number); }
    if (street_number !== undefined) { fields.push('street_number = ?'); values.push(street_number); }
    if (city !== undefined)          { fields.push('city = ?');          values.push(city); }
    if (district !== undefined)      { fields.push('district = ?');      values.push(district); }
    if (province !== undefined)      { fields.push('province = ?');      values.push(province); }
    if (postal_code !== undefined)   { fields.push('postal_code = ?');   values.push(postal_code); }

    if (fields.length === 0) throw new Error('NO_FIELDS');

    values.push(id);
    await db.promise().query(
      `UPDATE accounts SET ${fields.join(', ')} WHERE account_id = ?`,
      values
    );

    return Account.findById(id);
  }

  // DELETE /accounts/:id — remove account
  static async delete(id) {
    const [result] = await db.promise().query(
      'DELETE FROM accounts WHERE account_id = ?', [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = { Account, hashPassword };
