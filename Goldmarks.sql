CREATE DATABASE IF NOT EXISTS capstone_db;
USE capstone_db;

-- Users
CREATE TABLE roles(
    roles_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    phoneNumber VARCHAR(15),
    password_hash VARCHAR(255),
    roles_id INT DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE;
    FOREIGN KEY (roles_id) REFERENCES roles(roles_id)
);

CREATE TABLE address(
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    postcode VARCHAR(20) NOT NULL,
    states VARCHAR(20),
    country VARCHAR(50)
);

CREATE TABLE user_address(
    user_address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_id INT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (address_id) REFERENCES address(address_id) ON DELETE CASCADE
);

-- Products Inventory
CREATE TABLE categories(
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    parent_categories_id INT NULL,
    FOREIGN KEY (parent_categories_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE suppliers(
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_info TEXT
);

CREATE TABLE products(
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    productname VARCHAR(100),
    description TEXT,
    product_image TEXT,
    is_featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category_id INT,
    supplier_id INT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

CREATE TABLE product_item(
    product_item_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    sku VARCHAR(50) UNIQUE,
    qty_in_stock INT NOT NULL,
    product_image TEXT,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE variation(
    variation_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255)
);

CREATE TABLE variation_option(
    variation_option_id INT PRIMARY KEY AUTO_INCREMENT,
    variation_id INT NOT NULL,
    value VARCHAR(255),
    FOREIGN KEY (variation_id) REFERENCES variation(variation_id) ON DELETE CASCADE
);

CREATE TABLE product_configuration(
    product_item_id INT NOT NULL,
    variation_option_id INT NOT NULL,
    FOREIGN KEY (product_item_id) REFERENCES product_item(product_item_id) ON DELETE CASCADE,
    FOREIGN KEY (variation_option_id) REFERENCES variation_option(variation_option_id) ON DELETE CASCADE
);

CREATE TABLE product_variation(
    product_id INT NOT NULL,
    variation_id INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (variation_id) REFERENCES variation(variation_id) ON DELETE CASCADE
);

-- PROMOTION
CREATE TABLE promotion(
    promotion_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_rate DECIMAL(5,2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    promotion_code VARCHAR(50) UNIQUE,
    discount_type ENUM('percentage', 'fixed_amount', 'category_specific') DEFAULT 'percentage',
    minimum_order_value DECIMAL(10,2) DEFAULT 0,
    usage_limit INT DEFAULT NULL,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_categories TEXT NULL
);

-- Wishlist
CREATE TABLE wishlist(
    wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE wishlist_items(    
    wishlist_item_id INT PRIMARY KEY AUTO_INCREMENT,
    wishlist_id INT NOT NULL,
    product_id INT NOT NULL,
    FOREIGN KEY (wishlist_id) REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE shipping_method(
    shipping_method_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_status(
    order_status_id INT PRIMARY KEY AUTO_INCREMENT,
    status VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE shop_orders(
    shop_order_id INT PRIMARY KEY AUTO_INCREMENT,
    promotion_id INT,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_total DECIMAL(10, 2) NOT NULL,
    shipping_method_id INT NOT NULL,
    shipping_address_id INT NOT NULL,
    payment_status VARCHAR(50),
    order_status_id INT NOT NULL,
    tracking_number VARCHAR(100) NULL,
    actual_shipping_cost DECIMAL(10,2) NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (promotion_id) REFERENCES promotion(promotion_id),
    FOREIGN KEY (shipping_address_id) REFERENCES address(address_id),
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_method(shipping_method_id),
    FOREIGN KEY (order_status_id) REFERENCES order_status(order_status_id)
);

CREATE TABLE order_line(
    order_line_id INT PRIMARY KEY AUTO_INCREMENT,
    product_item_id INT NOT NULL,
    shop_order_id INT NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (shop_order_id) REFERENCES shop_orders(shop_order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_item_id) REFERENCES product_item(product_item_id) 
);

-- Payment
CREATE TABLE payment(
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    shop_order_id INT NOT NULL,
    amount DECIMAL(10,2),
    payment_method VARCHAR(100),
    payment_status VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_order_id) REFERENCES shop_orders(shop_order_id)
);

CREATE TABLE refund(
    refund_id INT PRIMARY KEY AUTO_INCREMENT,
    order_line_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_transaction_id VARCHAR(255),
    FOREIGN KEY (order_line_id) REFERENCES order_line(order_line_id)
);

-- CART
CREATE TABLE cart(
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    session_id VARCHAR(255) UNIQUE NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE cart_items(
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_item_id INT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_item_id) REFERENCES product_item(product_item_id) ON DELETE CASCADE
);

-- REVIEW
CREATE TABLE reviews(
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >=1 AND rating <=5),
    comment TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);


-- Tickets
CREATE TABLE support_tickets(
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE ticket_replies(
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    responder_id INT NOT NULL,
    message TEXT NOT NULL,
    response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ADMIN
CREATE TABLE audit_logs(
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE content_pages(
    page_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES users(user_id)
);

-- Stock Notificaion
CREATE TABLE stock_notification(
    stock_notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    product_item_id INT NULL, -- Specific product variant (optional)
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    email_notification BOOLEAN DEFAULT TRUE,
    sms_notification BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'notified', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_item_id) REFERENCES product_item(product_item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id, product_item_id)
);


-- Stock Movements for Inventory Tracking
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_item_id INT NOT NULL,
    movement_type ENUM('sale', 'restock', 'adjustment', 'return', 'damaged') NOT NULL,
    quantity_change INT NOT NULL, -- positive for increases, negative for decreases
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_id INT NULL, -- order_id for sales, purchase_order_id for restocks, etc.
    reason VARCHAR(255),
    created_by INT, -- user_id of who made the change
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_item_id) REFERENCES product_item(product_item_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_product_item_id (product_item_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_created_at (created_at)
);

-- Create promotion usage tracking table
CREATE TABLE promotion_usage (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    promotion_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotion(promotion_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (order_id) REFERENCES shop_orders(shop_order_id)
);

-- Insert data into roles
INSERT INTO roles (role_name)
VALUES (CUSTOMER), (ADMIN);

-- CREATE index
CREATE INDEX idx_stock_notifications_status ON stock_notifications(status);
CREATE INDEX idx_stock_notifications_product ON stock_notifications(product_id, status);