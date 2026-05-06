/**
 * ================================================================================
 * FETCHIT CHECKOUT/ORDER SYSTEM - DATABASE SCHEMA
 * ================================================================================
 * 
 * DESIGN OVERVIEW:
 * - Orders are linked to session_id for guest checkout support
 * - account_id is nullable to support both guest and authenticated users
 * - Order items are normalized in a separate table (order_items)
 * - Prices are stored at purchase time for historical accuracy
 * - Timestamps track creation and last modification
 * 
 * ================================================================================
 * CREATE TABLE STATEMENTS
 * ================================================================================
 */

/*
-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

-- Create orders table
CREATE TABLE orders (
  order_id              INT           NOT NULL AUTO_INCREMENT,
  session_id            VARCHAR(255)   NOT NULL,
  account_id            INT           DEFAULT NULL,
  
  -- Customer Information
  first_name            VARCHAR(100)  NOT NULL,
  last_name             VARCHAR(100)  NOT NULL,
  phone_number          VARCHAR(20)   NOT NULL,
  email_address         VARCHAR(150)  NOT NULL,
  
  -- Delivery Method
  delivery_method       ENUM('pickup', 'delivery') NOT NULL,
  
  -- Delivery Details (if delivery method selected)
  delivery_date         DATE          DEFAULT NULL,
  delivery_time_window  ENUM('morning', 'afternoon', 'evening') DEFAULT NULL,
  -- morning: 8AM-12PM, afternoon: 12PM-5PM, evening: 5PM-9PM
  delivery_city         VARCHAR(100)  DEFAULT NULL,
  delivery_street       VARCHAR(255)  DEFAULT NULL,
  delivery_postal_code  VARCHAR(20)   DEFAULT NULL,
  
  -- Payment Information
  payment_method        ENUM('cash', 'card', 'ewallet') NOT NULL,
  payment_status        ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  
  -- Order Totals
  subtotal_amount       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Order Status Tracking
  -- pending: Order received, awaiting confirmation
  -- confirmed: Order confirmed by staff
  -- preparing: Order is being prepared
  -- ready: Order ready for pickup/delivery
  -- delivered: Order delivered (for delivery) or picked up (for pickup)
  -- cancelled: Order cancelled
  order_status          ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  
  -- Notes
  customer_notes        TEXT          DEFAULT NULL,
  
  -- Timestamps
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Primary Key and Indexes
  PRIMARY KEY (order_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
  INDEX idx_session_id (session_id),
  INDEX idx_account_id (account_id),
  INDEX idx_order_status (order_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_delivery_date (delivery_date)
);

-- Create order_items table (line items for each order)
CREATE TABLE order_items (
  order_item_id     INT             NOT NULL AUTO_INCREMENT,
  order_id          INT             NOT NULL,
  product_id        INT             NOT NULL,
  
  -- Product details at time of purchase (snapshot for historical accuracy)
  product_name      VARCHAR(150)    NOT NULL,
  product_price     DECIMAL(10, 2)  NOT NULL,
  quantity          INT             NOT NULL DEFAULT 1,
  line_total        DECIMAL(10, 2)  NOT NULL,
  
  -- Timestamps
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Primary Key and Indexes
  PRIMARY KEY (order_item_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id)
);
*/

/**
 * ================================================================================
 * SAMPLE INSERT STATEMENTS (for testing)
 * ================================================================================
 */

/*
-- Sample order with delivery
INSERT INTO orders (
  session_id,
  account_id,
  first_name,
  last_name,
  phone_number,
  email_address,
  delivery_method,
  delivery_date,
  delivery_time_window,
  delivery_city,
  delivery_street,
  delivery_postal_code,
  payment_method,
  payment_status,
  subtotal_amount,
  delivery_fee,
  total_amount,
  order_status,
  customer_notes
) VALUES (
  'guest-session-abc123',
  NULL,
  'Juan',
  'Dela Cruz',
  '09171234567',
  'juan.delacru@example.com',
  'delivery',
  '2026-04-05',
  'afternoon',
  'Quezon City',
  '123 Mabini Street, Project 6',
  '1105',
  'cash',
  'pending',
  1249.00,
  100.00,
  1349.00,
  'pending',
  'Please call before delivery'
);

-- Sample order with in-store pickup
INSERT INTO orders (
  session_id,
  account_id,
  first_name,
  last_name,
  phone_number,
  email_address,
  delivery_method,
  delivery_date,
  delivery_time_window,
  payment_method,
  payment_status,
  subtotal_amount,
  delivery_fee,
  total_amount,
  order_status
) VALUES (
  'guest-session-xyz789',
  NULL,
  'Maria',
  'Santos',
  '09189876543',
  'maria.santos@example.com',
  'pickup',
  '2026-04-03',
  'morning',
  'card',
  'paid',
  2197.00,
  0.00,
  2197.00,
  'confirmed'
);

-- Sample order items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, line_total) VALUES
  (1, 2, 'Blue Buffalo Life Protection – Chicken & Brown Rice', 1249.00, 1, 1249.00),
  (2, 1, 'Purina ONE Dry Dog Food – Lamb & Rice', 899.00, 1, 899.00),
  (2, 4, 'Purina Friskies Gravy Wet Cat Food – Variety Pack', 799.00, 1, 799.00),
  (2, 6, 'KONG Classic Dog Toy – Medium', 449.00, 1, 449.00),
  (2, 8, 'PetBusy Interactive Catnip Kicker Fish', 199.00, 1, 199.00);
*/


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
        order_id, product_id, product_name, product_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        itemData.product_id,
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
    this.product_name = item.product_name;
    this.product_price = item.product_price;
    this.quantity = item.quantity;
    this.line_total = item.line_total;
    this.created_at = item.created_at;
  }
}

module.exports = { Order, OrderItem };