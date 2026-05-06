const db = require('../data/db');

class Cart {
  constructor(cart) {
    this.cart_id = cart.cart_id;
    this.session_id = cart.session_id;
    this.account_id = cart.account_id;
    this.product_id = cart.product_id;
    this.quantity = cart.quantity;
    this.version = cart.version;
    this.created_at = cart.created_at;
    this.updated_at = cart.updated_at;
    // Joined product data (optional)
    this.product_name = cart.product_name;
    this.product_price = cart.product_price;
    this.product_image = cart.product_image;
  }

  /**
   * Get cart items for a session with product details
   */
  static async getCartBySession(sessionId) {
    const [rows] = await db.promise().query(
      `SELECT c.*, p.name as product_name, p.price as product_price, p.image_url as product_image
       FROM carts c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.session_id = ?`,
      [sessionId]
    );
    return rows.map(row => new Cart(row));
  }

  /**
   * Get a specific cart item by session and product
   */
  static async getCartItem(sessionId, productId) {
    const [rows] = await db.promise().query(
      'SELECT * FROM carts WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );
    return rows.length > 0 ? new Cart(rows[0]) : null;
  }

  /**
   * Add item to cart or update quantity if already exists
   */
  static async addToCart(sessionId, productId, quantity = 1) {
    // Check if item already exists in cart
    const existingItem = await Cart.getCartItem(sessionId, productId);
    
    if (existingItem) {
      // Update quantity
      return Cart.updateQuantity(sessionId, productId, existingItem.quantity + quantity, existingItem.version);
    }
    
    // Insert new item
    const [result] = await db.promise().query(
      'INSERT INTO carts (session_id, product_id, quantity, version) VALUES (?, ?, ?, 1)',
      [sessionId, productId, quantity]
    );
    
    return { cart_id: result.insertId, quantity, version: 1, isNew: true };
  }

  /**
   * Update item quantity with optimistic concurrency control
   * Returns the updated cart item or null if version mismatch (concurrent update)
   */
  static async updateQuantity(sessionId, productId, newQuantity, currentVersion) {
    const [result] = await db.promise().query(
      `UPDATE carts 
       SET quantity = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ? AND product_id = ? AND version = ?`,
      [newQuantity, sessionId, productId, currentVersion]
    );
    
    if (result.affectedRows === 0) {
      // Version mismatch - concurrent update detected
      return null;
    }
    
    // Return updated item
    return Cart.getCartItem(sessionId, productId);
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(sessionId, productId) {
    const [result] = await db.promise().query(
      'DELETE FROM carts WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Clear entire cart for a session
   */
  static async clearCart(sessionId) {
    const [result] = await db.promise().query(
      'DELETE FROM carts WHERE session_id = ?',
      [sessionId]
    );
    return result.affectedRows;
  }

  /**
   * Get cart summary (total items and total price)
   */
  static async getCartSummary(sessionId) {
    const [rows] = await db.promise().query(
      `SELECT
         COALESCE(SUM(c.quantity), 0) as total_items,
         COALESCE(SUM(c.quantity * p.price), 0) as total_price
       FROM carts c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.session_id = ?`,
      [sessionId]
    );
    
    return {
      totalItems: Number(rows[0].total_items) || 0,
      totalPrice: Number(rows[0].total_price) || 0
    };
  }

  /**
   * Get item count for cart badge
   */
  static async getItemCount(sessionId) {
    const [rows] = await db.promise().query(
      'SELECT COALESCE(SUM(quantity), 0) as count FROM carts WHERE session_id = ?',
      [sessionId]
    );
    return Number(rows[0].count) || 0;
  }
}

module.exports = Cart;