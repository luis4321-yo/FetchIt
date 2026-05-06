const db = require('../data/db');

class Cart {
  constructor(cart) {
    this.cart_id = cart.cart_id;
    this.session_id = cart.session_id;
    this.account_id = cart.account_id;
    this.product_id = cart.product_id;
    this.service_id = cart.service_id;
    this.quantity = cart.quantity;
    this.version = cart.version;
    this.created_at = cart.created_at;
    this.updated_at = cart.updated_at;
    // Joined item data (optional)
    this.item_name = cart.item_name;
    this.item_price = cart.item_price;
    this.item_image = cart.item_image;
    this.item_type = cart.item_type;
  }

  /**
   * Get cart items for a session with product/service details
   */
  static async getCartBySession(sessionId) {
    const [rows] = await db.promise().query(
      `SELECT 
         c.*,
         COALESCE(p.name, s.service_name) as item_name,
         COALESCE(p.price, s.price) as item_price,
         COALESCE(p.image_url, s.image_url) as item_image,
         CASE WHEN c.product_id IS NOT NULL THEN 'product' ELSE 'service' END as item_type
       FROM carts c
       LEFT JOIN products p ON c.product_id = p.product_id
       LEFT JOIN services s ON c.service_id = s.service_id
       WHERE c.session_id = ?`,
      [sessionId]
    );
    return rows.map(row => new Cart(row));
  }

  /**
   * Get a specific cart item by session and product/service
   */
  static async getCartItem(sessionId, productId, serviceId) {
    let query = 'SELECT * FROM carts WHERE session_id = ? AND ';
    let params = [sessionId];
    
    if (productId) {
      query += 'product_id = ?';
      params.push(productId);
    } else if (serviceId) {
      query += 'service_id = ?';
      params.push(serviceId);
    } else {
      return null;
    }
    
    const [rows] = await db.promise().query(query, params);
    return rows.length > 0 ? new Cart(rows[0]) : null;
  }

  /**
   * Add item to cart or update quantity if already exists
   */
  static async addToCart(sessionId, itemId, quantity = 1, itemType = 'product') {
    const isProduct = itemType === 'product';
    const productId = isProduct ? itemId : null;
    const serviceId = isProduct ? null : itemId;
    
    // Check if item already exists in cart
    const existingItem = await Cart.getCartItem(sessionId, productId, serviceId);
    
    if (existingItem) {
      // Update quantity
      return Cart.updateQuantity(sessionId, productId, serviceId, existingItem.quantity + quantity, existingItem.version);
    }
    
    // Insert new item
    const [result] = await db.promise().query(
      'INSERT INTO carts (session_id, product_id, service_id, quantity, version) VALUES (?, ?, ?, ?, 1)',
      [sessionId, productId, serviceId, quantity]
    );
    
    return { cart_id: result.insertId, quantity, version: 1, isNew: true };
  }

  /**
   * Update item quantity with optimistic concurrency control
   * Returns the updated cart item or null if version mismatch (concurrent update)
   */
  static async updateQuantity(sessionId, productId, serviceId, newQuantity, currentVersion) {
    let query = `UPDATE carts 
       SET quantity = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE session_id = ? AND version = ? AND `;
    let params = [newQuantity, sessionId, currentVersion];
    
    if (productId) {
      query += 'product_id = ?';
      params.push(productId);
    } else if (serviceId) {
      query += 'service_id = ?';
      params.push(serviceId);
    } else {
      return null;
    }
    
    const [result] = await db.promise().query(query, params);
    
    if (result.affectedRows === 0) {
      // Version mismatch - concurrent update detected
      return null;
    }
    
    // Return updated item
    return Cart.getCartItem(sessionId, productId, serviceId);
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(sessionId, productId, serviceId) {
    let query = 'DELETE FROM carts WHERE session_id = ? AND ';
    let params = [sessionId];
    
    if (productId) {
      query += 'product_id = ?';
      params.push(productId);
    } else if (serviceId) {
      query += 'service_id = ?';
      params.push(serviceId);
    } else {
      return false;
    }
    
    const [result] = await db.promise().query(query, params);
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
         COALESCE(SUM(c.quantity * COALESCE(p.price, s.price)), 0) as total_price
       FROM carts c
       LEFT JOIN products p ON c.product_id = p.product_id
       LEFT JOIN services s ON c.service_id = s.service_id
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