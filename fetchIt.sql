CREATE DATABASE IF NOT EXISTS fetchit;
USE fetchit;

-- Drop in correct order (child → parent)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS accounts;

-- Accounts
CREATE TABLE accounts (
  account_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL DEFAULT '',
  contact_number VARCHAR(20),
  street_number VARCHAR(100),
  city VARCHAR(100),
  district VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id)
);

-- Promo Codes
CREATE TABLE promo_codes (
  code VARCHAR(50) PRIMARY KEY,
  discount_type ENUM('percent', 'fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed promo codes
INSERT INTO promo_codes VALUES
  ('FETCHIT10', 'percent', 10.00, TRUE),
  ('FETCHPET', 'fixed', 50.00, TRUE),
  ('WELCOME50', 'fixed', 50.00, TRUE);

-- Products
CREATE TABLE products (
  product_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category ENUM('food','toys','accessories','hygiene','medicine') NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id)
);

-- Cart
CREATE TABLE carts (
  cart_id INT AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  account_id INT,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (cart_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE orders (
  order_id INT NOT NULL AUTO_INCREMENT,
  session_id VARCHAR(255) NOT NULL,
  account_id INT DEFAULT NULL,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email_address VARCHAR(150) NOT NULL,

  delivery_method ENUM('pickup', 'delivery') NOT NULL,

  delivery_date DATE DEFAULT NULL,
  delivery_time_window ENUM('morning', 'afternoon', 'evening') DEFAULT NULL,
  delivery_city VARCHAR(100) DEFAULT NULL,
  delivery_street VARCHAR(255) DEFAULT NULL,
  delivery_postal_code VARCHAR(20) DEFAULT NULL,

  payment_method ENUM('cash', 'card', 'ewallet') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',

  subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  promo_code VARCHAR(50) DEFAULT NULL,
  points_redeemed INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',

  customer_notes TEXT DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (order_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
  INDEX idx_session_id (session_id),
  INDEX idx_account_id (account_id),
  INDEX idx_order_status (order_status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_delivery_date (delivery_date)
);

CREATE TABLE order_items (
  order_item_id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,

  product_name VARCHAR(150) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (order_item_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id)
);

--  SEED: 1 Guest Account
INSERT INTO accounts (name, email, contact_number, street_number, city, district, province, postal_code)
VALUES (
  'Guest User',
  'guest@fetchit.com',
  '09171234567',
  '123 Mabini Street',
  'Quezon City',
  'Project 6',
  'Metro Manila',
  '1105'
);


INSERT INTO products (name, description, price, category, image_url) VALUES

-- FOOD (5)
('Purina ONE Dry Dog Food – Lamb & Rice',
 'Complete and balanced dry dog food made with lamb as the first ingredient. Supports strong muscles and a healthy coat.',
 899.00, 'food',
 'https://images-na.ssl-images-amazon.com/images/I/81v7U4CfHiL._AC_SL1500_.jpg'),

('Blue Buffalo Life Protection – Chicken & Brown Rice',
 'Natural dry dog food with real chicken, garden vegetables, and fruit. No artificial preservatives or flavors.',
 1249.00, 'food',
 'https://images-na.ssl-images-amazon.com/images/I/81Dz9QRLhPL._AC_SL1500_.jpg'),

('INABA Churu Cat Treats – Tuna & Chicken Variety',
 'Grain-free squeezable purée cat treats enriched with Vitamin E and Taurine. 50 tubes per pack.',
 649.00, 'food',
 'https://images-na.ssl-images-amazon.com/images/I/71C0w7-sXfL._AC_SL1500_.jpg'),

('Purina Friskies Gravy Wet Cat Food – Variety Pack',
 'Pack of 40 cans featuring a surf-and-turf variety of prime filet flavors in savory gravy.',
 799.00, 'food',
 'https://images-na.ssl-images-amazon.com/images/I/81g4vRA0uYL._AC_SL1500_.jpg'),

('Wild Alaskan Salmon Oil for Dogs & Cats',
 'Pure fish oil supplement with Omega-3 EPA & DHA. Supports skin, coat, joints, and immune health. 16 oz liquid.',
 549.00, 'food',
 'https://images-na.ssl-images-amazon.com/images/I/71mMFaM6HQL._AC_SL1500_.jpg'),

-- TOYS (5)
('KONG Classic Dog Toy – Medium',
 'Durable natural rubber chew toy with hollow center for stuffing treats. Ideal for medium breeds. Vet recommended.',
 449.00, 'toys',
 'https://images-na.ssl-images-amazon.com/images/I/71CpILBJRCL._AC_SL1500_.jpg'),

('Chuckit! Ultra Ball – Medium 2-Pack',
 'High-bounce rubber fetch balls designed for dogs 20–60 lbs. Floats in water and compatible with Chuckit! launchers.',
 299.00, 'toys',
 'https://images-na.ssl-images-amazon.com/images/I/71GbU0ZKDWL._AC_SL1500_.jpg'),

('PetBusy Interactive Catnip Kicker Fish',
 'Soft crinkle fish toy filled with premium catnip and silvervine. Features bell inside for extra stimulation.',
 199.00, 'toys',
 'https://images-na.ssl-images-amazon.com/images/I/71Ws6LBiLML._AC_SL1500_.jpg'),

('Jkanti Automatic Cat Ball Toy',
 'Motion-activated rolling ball with elastic mesh tail. Stimulates hunting instincts for indoor cats.',
 349.00, 'toys',
 'https://images-na.ssl-images-amazon.com/images/I/61hT4i7YQKL._AC_SL1500_.jpg'),

('Best Pet Supplies Squeaky Crinkle Duck Dog Toy – Large',
 'Interactive plush chew toy with squeaker and crinkle material. Safe for small, medium, and large dogs.',
 249.00, 'toys',
 'https://images-na.ssl-images-amazon.com/images/I/71T1F1YLPML._AC_SL1500_.jpg'),

-- ACCESSORIES (4)
('Pet Hair Comb for Dogs and Cats',
 'Bamboo-handled grooming brush with stainless steel pins. Gently removes tangles, loose fur, and debris from all coat types.',
 149.00, 'accessories',
 'https://images-na.ssl-images-amazon.com/images/I/71kizv2gYRL._AC_SL1500_.jpg'),

('Amazon Basics Dog Puppy Pee Pads – 100 Count',
 '5-layer leak-proof training pads with quick-dry surface. Regular 22x22 inch size. Blue and white.',
 599.00, 'accessories',
 'https://images-na.ssl-images-amazon.com/images/I/81k3VkZcnvL._AC_SL1500_.jpg'),

('Muddy Mat Super Absorbent Dog Door Mat – Grey 30x19"',
 'Microfiber chenille mat that traps mud and moisture from paws. Non-slip, machine washable.',
 699.00, 'accessories',
 'https://images-na.ssl-images-amazon.com/images/I/81XBm7TMWPL._AC_SL1500_.jpg'),

('Ruffwear Front Range Dog Harness',
 'Trail-tested padded harness with two leash attachment points. Reflective trim for low-light visibility. Durable and escape-resistant.',
 1499.00, 'accessories',
 'https://images-na.ssl-images-amazon.com/images/I/61j4I5xOaYL._AC_SL1500_.jpg'),

-- HYGIENE (3)
('Dr. Elsey\'s Ultra Unscented Clumping Cat Litter – 40 lb',
 'Hard clumping, low-dust clay litter with superior odor control. Suitable for multi-cat households.',
 1099.00, 'hygiene',
 'https://images-na.ssl-images-amazon.com/images/I/81qoaBWTM7L._AC_SL1500_.jpg'),

('Vetericyn FoamCare Pet Shampoo',
 'Spray-on foam shampoo that conditions skin, shines coat, and rinses out easily. Available in regular and thick coat formulas.',
 399.00, 'hygiene',
 'https://images-na.ssl-images-amazon.com/images/I/61vIKbMKOXL._AC_SL1500_.jpg'),

('TropiClean Fresh Breath Water Additive for Dogs – 33.8 oz',
 'Simply add to your pet\'s water bowl for clean teeth and fresh breath. No brushing required.',
 449.00, 'hygiene',
 'https://images-na.ssl-images-amazon.com/images/I/71kqe3JDWPL._AC_SL1500_.jpg'),

-- MEDICINE (3)
('Zymox Otic Enzymatic Ear Solution – 1% Hydrocortisone',
 'Veterinarian-recommended ear treatment for dogs and cats. Relieves bacterial, viral, and yeast ear infections. 1.25 oz.',
 649.00, 'medicine',
 'https://images-na.ssl-images-amazon.com/images/I/71gg1h3NSEL._AC_SL1500_.jpg'),

('Nutramax Dasuquin Joint Supplement for Dogs – 84 Soft Chews',
 'Contains glucosamine, chondroitin, ASU, and MSM for comprehensive joint support. Suitable for small to medium dogs.',
 899.00, 'medicine',
 'https://images-na.ssl-images-amazon.com/images/I/81mGi0TjJFL._AC_SL1500_.jpg'),

('Purina FortiFlora Daily Probiotic for Dogs – 30 ct',
 'Veterinary-recommended probiotic supplement that promotes digestive health and microflora balance.',
 549.00, 'medicine',
 'https://images-na.ssl-images-amazon.com/images/I/71kO1gkHm0L._AC_SL1500_.jpg');

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