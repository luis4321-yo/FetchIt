const db = require('../data/db');

class Order {
  constructor(order) {
    this.order_id = order.order_id;
    this.session_id = order.session_id;
    this.account_id = order.account_id;
    
    // Customer Information
    this.first_name = order.first_name;
    this.last_name = order.last_name;
    this.phone_number = order.phone_number;
    this.email_address = order.email_address;
    
    // Delivery Method
    this.delivery_method = order.delivery_method;
    
    // Delivery Details
    this.delivery_date = order.delivery_date;
    this.delivery_time_window = order.delivery_time_window;
    this.delivery_city = order.delivery_city;
    this.delivery_street = order.delivery_street;
    this.delivery_postal_code = order.delivery_postal_code;
    
    // Payment Information
    this.payment_method = order.payment_method;
    this.payment_status = order.payment_status;
    
    // Order Totals
    this.subtotal_amount = order.subtotal_amount;
    this.delivery_fee = order.delivery_fee;
    this.total_amount = order.total_amount;
    
    // Order Status
    this.order_status = order.order_status;
    
    // Notes
    this.customer_notes = order.customer_notes;
    
    // Timestamps
    this.created_at = order.created_at;
    this.updated_at = order.updated_at;
  }

  /**
   * Get full name accessor
   */
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  /**
   * Check if order is for delivery
   */
  isDelivery() {
    return this.delivery_method === 'delivery';
  }

  /**
   * Create a new order
   */
  static async create(orderData) {
    const [result] = await db.promise().query(
      `INSERT INTO orders (
        session_id, account_id,
        first_name, last_name, phone_number, email_address,
        delivery_method, delivery_date, delivery_time_window,
        delivery_city, delivery_street, delivery_postal_code,
        payment_method, payment_status,
        subtotal_amount, delivery_fee, discount_amount, promo_code, points_redeemed, total_amount,
        order_status, customer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.session_id,
        orderData.account_id || null,
        orderData.first_name,
        orderData.last_name,
        orderData.phone_number,
        orderData.email_address,
        orderData.delivery_method,
        orderData.delivery_date || null,
        orderData.delivery_time_window || null,
        orderData.delivery_city || null,
        orderData.delivery_street || null,
        orderData.delivery_postal_code || null,
        orderData.payment_method,
        orderData.payment_status || 'pending',
        orderData.subtotal_amount || 0,
        orderData.delivery_fee || 0,
        orderData.discount_amount || 0,
        orderData.promo_code || null,
        orderData.points_redeemed || 0,
        orderData.total_amount,
        orderData.order_status || 'pending',
        orderData.customer_notes || null
      ]
    );
    return { order_id: result.insertId, ...orderData };
  }

  /**
   * Find order by ID
   */
  static async findById(orderId) {
    const [rows] = await db.promise().query(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );
    return rows.length > 0 ? new Order(rows[0]) : null;
  }

  /**
   * Find orders by session ID
   */
  static async findBySessionId(sessionId) {
    const [rows] = await db.promise().query(
      'SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );
    return rows.map(row => new Order(row));
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, newStatus) {
    const [result] = await db.promise().query(
      'UPDATE orders SET order_status = ? WHERE order_id = ?',
      [newStatus, orderId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(orderId, paymentStatus) {
    const [result] = await db.promise().query(
      'UPDATE orders SET payment_status = ? WHERE order_id = ?',
      [paymentStatus, orderId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Add item to order
   */
  static async addItem(orderId, itemData) {
    const lineTotal = itemData.product_price * itemData.quantity;
    
    const [result] = await db.promise().query(
      `INSERT INTO order_items (
        order_id, product_id, service_id, product_name, product_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        itemData.product_id || null,
        itemData.service_id || null,
        itemData.product_name,
        itemData.product_price,
        itemData.quantity,
        lineTotal
      ]
    );
    
    return { order_item_id: result.insertId, ...itemData, line_total: lineTotal };
  }

  /**
   * Get items for an order
   */
  static async getItems(orderId) {
    const [rows] = await db.promise().query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    return rows;
  }
}

class OrderItem {
  constructor(item) {
    this.order_item_id = item.order_item_id;
    this.order_id = item.order_id;
    this.product_id = item.product_id;
    this.service_id = item.service_id;
    this.product_name = item.product_name;
    this.product_price = item.product_price;
    this.quantity = item.quantity;
    this.line_total = item.line_total;
    this.created_at = item.created_at;
  }
}

module.exports = { Order, OrderItem };