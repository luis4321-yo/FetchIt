const db = require('../data/db');

class Promo {
  // Validate a promo code and return its discount info
  static async validate(code) {
    if (!code || !code.trim()) return null;

    const [rows] = await db.promise().query(
      'SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE',
      [code.trim().toUpperCase()]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  // Calculate discounted total given a promo row and subtotal
  static calculate(promo, subtotal) {
    if (!promo) return { discount: 0, discountedSubtotal: subtotal };

    let discount = 0;
    if (promo.discount_type === 'percent') {
      discount = parseFloat((subtotal * promo.discount_value / 100).toFixed(2));
    } else if (promo.discount_type === 'fixed') {
      discount = Math.min(promo.discount_value, subtotal); // can't discount more than subtotal
    }

    return {
      discount: parseFloat(discount.toFixed(2)),
      discountedSubtotal: parseFloat((subtotal - discount).toFixed(2))
    };
  }
}

module.exports = Promo;
