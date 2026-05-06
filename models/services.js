const db = require('../data/db');

class Service {
  constructor(service) {
    this.service_id = service.service_id;
    this.person_name = service.person_name;
    this.service_name = service.service_name;
    this.service_type = service.service_type;
    this.rating = service.rating;
    this.contact_number = service.contact_number;
    this.email = service.email;
    this.price = service.price;
    this.description = service.description;
    this.image_url = service.image_url;
    this.is_active = service.is_active;
    this.created_at = service.created_at;
  }

  static async findAll() {
    const [rows] = await db.promise().query('SELECT * FROM services WHERE is_active = 1');
    return rows.map(row => new Service(row));
  }

  static async findById(id) {
    const [rows] = await db.promise().query('SELECT * FROM services WHERE service_id = ? AND is_active = 1', [id]);
    return rows.length > 0 ? new Service(rows[0]) : null;
  }
}

module.exports = Service;