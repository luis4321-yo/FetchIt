USE fetchit;

-- Create services table if not exists
CREATE TABLE IF NOT EXISTS services (
  service_id INT NOT NULL AUTO_INCREMENT,
  person_name VARCHAR(150) NOT NULL,
  service_name VARCHAR(150) NOT NULL,
  service_type ENUM('bathing','brushing','nail trimming','ear cleaning','haircuts') NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 3.0,
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id)
);

-- Alter carts table to support services
-- First check if service_id column exists
SET @dbname = 'fetchit';
SET @tablename = 'carts';
SET @columnname = 'service_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tablename
    AND TABLE_SCHEMA = @dbname
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE carts ADD COLUMN service_id INT DEFAULT NULL AFTER product_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Make product_id nullable in carts
ALTER TABLE carts MODIFY COLUMN product_id INT DEFAULT NULL;

-- Add version column to carts if not exists
SET @columnname = 'version';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tablename
    AND TABLE_SCHEMA = @dbname
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE carts ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER quantity'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key for carts.service_id if not exists
SET @fkname = 'fk_carts_service';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_NAME = @tablename
    AND TABLE_SCHEMA = @dbname
    AND CONSTRAINT_NAME = @fkname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE carts ADD CONSTRAINT fk_carts_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Alter order_items table to support services
SET @tablename = 'order_items';
SET @columnname = 'service_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tablename
    AND TABLE_SCHEMA = @dbname
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD COLUMN service_id INT DEFAULT NULL AFTER product_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Make product_id nullable in order_items
ALTER TABLE order_items MODIFY COLUMN product_id INT DEFAULT NULL;

-- Add foreign key for order_items.service_id if not exists
SET @fkname = 'fk_order_items_service';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_NAME = @tablename
    AND TABLE_SCHEMA = @dbname
    AND CONSTRAINT_NAME = @fkname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE order_items ADD CONSTRAINT fk_order_items_service FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Seed services (15 records, all types covered)
INSERT INTO services (person_name, service_name, service_type, rating, contact_number, email, price, description) VALUES
('Maria Santos', 'Premium Dog Bathing', 'bathing', 4.5, '09171234567', 'maria.santos@fetchit.com', 450.00, 'Full-body bathing with premium hypoallergenic shampoo, blow-dry, and brush-out for dogs of all sizes.'),
('Juan Dela Cruz', 'Cat Spa Bathing', 'bathing', 4.0, '09189876543', 'juan.delacruz@fetchit.com', 350.00, 'Gentle bathing service for cats using feline-safe products. Includes nail trim and ear wipe.'),
('Ana Reyes', 'Puppy First Bath', 'bathing', 5.0, '09192345678', 'ana.reyes@fetchit.com', 300.00, 'Specialized bathing for puppies under 6 months. Extra gentle handling and puppy-safe shampoo.'),
('Carlos Mendoza', 'Deep Coat Brushing', 'brushing', 4.5, '09193456789', 'carlos.mendoza@fetchit.com', 250.00, 'Thorough de-shedding and brushing session for long-haired breeds. Reduces shedding by up to 90%.'),
('Liza Tan', 'Mat Removal & Detangling', 'brushing', 4.0, '09194567890', 'liza.tan@fetchit.com', 400.00, 'Expert mat removal without shaving. Gentle detangling for severely matted coats.'),
('Roberto Lim', 'Quick Nail Trim', 'nail trimming', 3.5, '09195678901', 'roberto.lim@fetchit.com', 150.00, 'Fast and safe nail trimming for dogs and cats. Includes nail filing to smooth edges.'),
('Grace Villanueva', 'Deluxe Paw Care', 'nail trimming', 4.5, '09196789012', 'grace.villanueva@fetchit.com', 280.00, 'Complete paw care including nail trim, paw pad moisturizing, and fur trimming between pads.'),
('Dennis Cruz', 'Ear Cleaning & Check', 'ear cleaning', 4.0, '09197890123', 'dennis.cruz@fetchit.com', 200.00, 'Gentle ear cleaning with vet-approved solution. Includes visual inspection for infections or mites.'),
('Patricia Go', 'Full Ear Treatment', 'ear cleaning', 4.5, '09198901234', 'patricia.go@fetchit.com', 350.00, 'Deep ear cleaning with medicated flush for pets prone to ear issues. Plucking of ear hair if needed.'),
('Ramon Garcia', 'Breed-Specific Haircut', 'haircuts', 5.0, '09199012345', 'ramon.garcia@fetchit.com', 600.00, 'Professional styling according to breed standards. Includes bath, cut, and finishing spray.'),
('Sophia Lee', 'Teddy Bear Trim', 'haircuts', 4.5, '09190123456', 'sophia.lee@fetchit.com', 550.00, 'Adorable rounded trim popular for Poodles, Bichons, and mixed breeds. Very cute and low maintenance.'),
('Kevin Ong', 'Puppy Cut', 'haircuts', 4.0, '09191234567', 'kevin.ong@fetchit.com', 500.00, 'Uniform short cut all over, perfect for hot weather and easy maintenance. Suitable for all breeds.'),
('Angela Cruz', 'Show Grooming Package', 'haircuts', 5.0, '09192345679', 'angela.cruz@fetchit.com', 1200.00, 'Complete show preparation including bath, blow-dry, scissor cut, and finishing. For competition-ready pets.'),
('Mark Santos', 'Express Brush & Bath', 'brushing', 3.5, '09193456780', 'mark.santos@fetchit.com', 380.00, 'Quick brush-out followed by a refreshing bath. Great for maintenance between full grooming sessions.'),
('Jenny Lim', 'Senior Pet Gentle Groom', 'bathing', 4.5, '09194567891', 'jenny.lim@fetchit.com', 500.00, 'Specialized gentle grooming for senior pets (7+ years). Extra care for joints, skin, and anxiety.');