const db = require('../data/db');

class Product {
  constructor(product) {
    this.product_id = product.product_id;
    this.name = product.name;
    this.description = product.description;
    this.price = product.price;
    this.category = product.category;
    this.image_url = product.image_url;
    this.is_active = product.is_active;
    this.created_at = product.created_at;
  }

  static async findAll() {
    const [rows] = await db.promise().query('SELECT * FROM products WHERE is_active = 1');
    return rows.map(row => new Product(row));
  }

  static async findById(id) {
    const [rows] = await db.promise().query('SELECT * FROM products WHERE product_id = ? AND is_active = 1', [id]);
    return rows.length > 0 ? new Product(rows[0]) : null;
  }
}

module.exports = Product;