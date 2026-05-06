const db = require('../data/db');

const POINTS_PER_PESO = 1;        // ₱1 spent = 1 point
const POINTS_PER_REDEEM = 100;    // 100 points = ₱10 off
const REDEEM_VALUE = 10;          // peso value per 100 points
const WELCOME_BONUS = 100;        // points awarded on signup

class Loyalty {
  // Reset points to what was earned from this order
  static async awardPoints(accountId, totalAmountSpent) {
    const pointsEarned = Math.floor(totalAmountSpent * POINTS_PER_PESO);

    await db.promise().query(
      'UPDATE accounts SET loyalty_points = ? WHERE account_id = ?',
      [pointsEarned, accountId]
    );

    return pointsEarned;
  }

  // Award welcome bonus on signup
  static async awardWelcomeBonus(accountId) {
    await db.promise().query(
      'UPDATE accounts SET loyalty_points = loyalty_points + ? WHERE account_id = ?',
      [WELCOME_BONUS, accountId]
    );
    return WELCOME_BONUS;
  }

  // Redeem points — deduct from account and return peso discount
  static async redeemPoints(accountId, pointsToRedeem) {
    // Check balance
    const [rows] = await db.promise().query(
      'SELECT loyalty_points FROM accounts WHERE account_id = ?',
      [accountId]
    );

    if (rows.length === 0) throw new Error('Account not found');

    const balance = rows[0].loyalty_points;
    if (balance < pointsToRedeem) throw new Error('INSUFFICIENT_POINTS');
    if (pointsToRedeem % POINTS_PER_REDEEM !== 0) throw new Error('INVALID_REDEEM_AMOUNT');

    const pesoDiscount = (pointsToRedeem / POINTS_PER_REDEEM) * REDEEM_VALUE;

    await db.promise().query(
      'UPDATE accounts SET loyalty_points = loyalty_points - ? WHERE account_id = ?',
      [pointsToRedeem, accountId]
    );

    return pesoDiscount;
  }

  // Get current balance
  static async getBalance(accountId) {
    const [rows] = await db.promise().query(
      'SELECT loyalty_points FROM accounts WHERE account_id = ?',
      [accountId]
    );
    return rows.length > 0 ? rows[0].loyalty_points : 0;
  }

  // Calculate peso value of points without redeeming
  static pointsToValue(points) {
    return Math.floor(points / POINTS_PER_REDEEM) * REDEEM_VALUE;
  }

  // How many points will be earned from a purchase
  static pointsFromPurchase(totalAmount) {
    return Math.floor(totalAmount * POINTS_PER_PESO);
  }

  static get WELCOME_BONUS() { return WELCOME_BONUS; }
  static get POINTS_PER_REDEEM() { return POINTS_PER_REDEEM; }
  static get REDEEM_VALUE() { return REDEEM_VALUE; }
}

module.exports = Loyalty;
