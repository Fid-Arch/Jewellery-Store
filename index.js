// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const notificationService = require('./services/notificationService');
const { pool } = require('..');
const notificationService = require('./services/notificationService');

// 2. Initialize Express APP
const app = express();
const port = process.env.PORT || 3000;

// 3. Middleware
app.use(cors());

// Raw body parser for Stripe webhooks (must be before express.json())
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

// Regular JSON parser for all other routes
app.use(express.json());

// 4.Database Connection Configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {rejectUnauthorized: false
    }
};

const pool = mysql.createPool(dbConfig);

// 4. Connect to the Database
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// Generate JWT Token
function generateToken(user_id, role = 'user'){
    return jwt.sign(
        {user_id, role},
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        {expiresIn: process.env.JWT_EXPIRES_IN || '24h'}
    );
};

// Middleware to authenticate JWT
function authenticateJWT(req,res,next) {
    try{
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if(!token) {
            return res.status(401).json({Message: 'Missing Authorization Token'});
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, decoded) => {
            if (err) {
                return res.status(403).json({Message: 'Invalid Token'});
            }
            req.user = {
                user_id : decoded.user_id,
                role: decoded.role
            };
            next();
        });
    }
    catch(error){
        console.error('ERROR Authenticating JWT:', error);
        res.status(500).json({Message: 'Error Authenticating JWT'});
    }
};

// Admin authorization
function authorizeAdminJWT(req,res,next) {
    if (req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({Message: 'Forbidden'});
    }
    next();
};

// Refresh Token
function refreshToken(req,res) {
    try{
        const {token} = req.body;
        if(!token) {
            return res.status(400).json({Message: 'Missing Token'});
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) {
                return res.status(403).json({Message: 'Invalid Token'});
            }
            const newToken = generateToken(decoded.user_Id, decoded.role);
            res.status(200).json({token: newToken});
        });
    }
    catch(error) {
        console.error('ERROR Refreshing Token:', error);
        res.status(500).json({Message: 'Error Refreshing Token'});
    }
}

// 5. API
// Create Roles
async function createRoles(req,res) {
    try{
        const { role_name } = req.body;
        if(!role_name) {
            return res.status(400).send('Missing required fields');
        }
        const [InputRole] = await pool.query('INSERT INTO roles (role_name) VALUES (?)', [role_name]);
        res.status(201).json({
            Message: 'Role created successfully',
            roleId: InputRole.insertId
        })
    }
    catch(error) {
        console.error("ERROR Creating Role:", error);
        res.status(500).send('Error Inserting data into the database');
    }
};

//Delete Role
async function deleteRole(req,res) {
    try{
        const { id } = req.params;
        const [deleteRole] = await pool.query('DELETE FROM roles WHERE roles_id = ?', [id]);
        if(deleteRole.affectedRows === 0) {
            return res.status(400).json({Message: 'Role not found'});
        }
        res.status(200).json({Message: 'Role deleted successfully'});
    }
    catch(error) {
        console.error("ERROR Deleting Role:", error);
        res.status(500).send('Error Deleting data from the database');
    }
};

// Register User
async function registerUser(req,res) {
    try {
        const {firstName, lastName, email, password, roles_id} = req.body;
        if(!firstName || !lastName || !email || !password) {
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [existingUser] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({Message: 'User already exists'});
        }
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 11;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const [newUser] = await pool.query('INSERT INTO users (firstName,lastName,email,password_hash,roles_id) VALUES (?,?,?,?,?)', [firstName, lastName, email, password_hash, roles_id]);

        // Send welcome email to new user
        const userForEmail = {
            user_id: newUser.insertId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            email_notifications: true, // New users have email notifications enabled by default
            sms_notifications: true,
            marketing_emails: false
        };

        try {
            await notificationService.sendWelcomeEmail(userForEmail);
            console.log('Welcome email sent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            Message: 'User created successfully',
            userId: newUser.insertId,
            user: {
                id: newUser.insertId,
                firstName,
                lastName,
                email,
                roles_id
            }
        });
    }
    catch(error) {
        console.error("ERROR Creating User:", error);
        res.status(500).send('Error Inserting data into the database');
    }
};

// User Login
async function loginUser(req,res) {
    try {
        console.log("login liao")
        const {email,password} = req.body

        if(!email || !password) {
            return res.status(400).json({Message: 'Email and Password are required'});
        }
        const [users] = await pool.query(`
            SELECT u.user_id, u.firstName, u.lastName, u.email, u.password_hash, u.roles_id, r.role_name
            FROM users u
            LEFT JOIN roles r ON u.roles_id = r.roles_id
            WHERE u.email = ?`, [email]);
        console.log("every", users)
        if (users.length === 0) {
            return res.status(401).json({Message: 'Invalid Email or Password'});
        }
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({Message: 'Invalid Email or Password'});
        }
        const sessionToken = generateToken(user.user_id, user.role_name);
        res.status(200).json({
            Message: 'Login successful',
            token: sessionToken,
            user: {
                id: user.user_id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role_name
            }
        });
    }
    catch(error) {
        console.error("ERROR logging in User:", error);
        res.status(500).send('Error logging in the user');
    }
};

// Change Password
async function changePassword(req,res) {
    try{
        const user_id = req.user.user_id;
        const { currentPassword, newPassword } = req.body;

        if(!currentPassword || !newPassword) {  
            return res.status(400).json({Message: 'Current and New Password are required'});
        }

        const [users] = await pool.query('SELECT password_hash FROM users WHERE user_id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({Message: 'Current Password is incorrect'});
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 11;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newPasswordHash, user_id]);
        res.status(200).json({Message: 'Password changed successfully'});
    }
    catch(error){
        console.error("ERROR Changing Password:", error);
        res.status(500).send('Error Changing Password');
    }
};

//Logout User
async function logoutUser(req,res) {
    try{
        const user_id = req.user.user_id;
        const sessionToken = req.body.token;
        if(!sessionToken) {
            return res.status(400).json({Message: 'Missing Token'});
        }

        // Verify the token belongs to the user
        const decoded = jwt.decode(sessionToken);
        if(decoded.user_id !== user_id) {
            return res.status(403).json({Message: 'Token does not belong to user'});
        }

        // For now, we'll just respond with success
        // In a production app, you'd typically blacklist the token
        res.status(200).json({
            Message: 'User logged out successfully',
            timestamp: new Date().toISOString()
        });

    }
    catch(error){
        console.error("ERROR Logging out User:", error);
        res.status(500).json({Message: 'Error Logging out User'});
    }
};

// Get All Users
async function getAllUsers(req,res) {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        res.status(200).json(users);
    }
    catch(error) {
        console.error("ERROR Fetching Users:", error);
        res.status(500).send('Error Fetching data from the database');
    }
};
// Get User Profile
async function getUserProfile(req,res) {
    try {
        const {id} = req.params;
        const [users] = await pool.query(
            `SELECT u.user_id, u.firstName, u.lastName, u.email, u.phoneNumber, 
                    u.createdAt, r.role_name 
             FROM users u 
             LEFT JOIN roles r ON u.roles_id = r.roles_id 
             WHERE u.user_id = ?`, 
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ Message: 'User not found'});
        }

        const user = users[0];
        res.status(200).json({
            user: {
                id: user.user_id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role_name,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        console.error('ERROR Fetching User Profile:', error);
        res.status(500).json({ Message: 'Error fetching user profile' });
    }
};

//Input Address
async function createAddress(req,res) {
    try {
        const {address_line1,address_line2,postcode,state,country} = req.body;
        if( !address_line1) {
            return res.status(400).send('Missing required fields');
        }
        const [InputAddress] = await pool.query('INSERT INTO address (address_line1,address_line2,postcode,states,country) VALUES (?,?,?,?,?)', [address_line1,address_line2,postcode,state,country]);
        res.status(201).json({
            Message: 'Address added successfully', 
            addressId: InputAddress.insertId
        });
    }
    catch(error) {
        console.error("ERROR Adding Address:", error);
        res.status(500).send('Error Inserting data into the database');
    }
};

//Delete Address
async function deleteAddress(req,res){
    try{
        const{id} = req.params;
        const[deleteAddress] = await pool.query('DELETE FROM address WHERE address_id = ?', [id]);
        if(deleteAddress.affectedRows === 0){
            return res.status(404).json({Message: 'Address not found'});
        }
        res.status(200).json({Message: 'Address deleted successfully'});
    }
    catch(error){
        console.log("ERROR Deleting Address:",error);
        res.status(500).send('Error Deleting data from the database');
    }
}

//Update Address
async function updateAddress(req,res){
    try{
        const{id}=req.params;
        const fieldaddress = req.body;
        if(Object.keys(fieldaddress).length === 0){
            return res.status(400).send('No fields to update');
        }
        const[uptAddress] = await pool.query(`UPDATE address SET ? WHERE address_id = ?`, [fieldaddress,id]);

        if(uptAddress.affectedRows === 0){
            res.status(404).json({Message: `Address ID ${id} update failed`})
        }
        else{
            res.status(200).json({Message: `Address ID ${id} updated successfully`});
        }
    }
    catch(error){
        console.error('ERROR Updating Address:',error);
        res.status(500).send('Error Updating data in the database');
    }
};

// Linking User and Address
async function userAddress (req,res){
    try{
        const {user_id} = req.params;
        const {address_id} = req.body;

        if(!address_id){
            return res.status(400).send('Address ID is required');
        }
        const[linked] = await pool.query('INSERT INTO user_address (user_id,address_id) VALUES (?,?)', [user_id,address_id]);
        res.status(201).json({
            Message: 'Address linked to user successfully',
            linkId: linked.insertId
        });
    }
    catch(error){
        console.error('ERROR Linking Address to USER:', error);
        res.status(500).send('Error Linking Address to User in the database');
    }
};

//Create Product
async function createProduct(req,res){
    try{
        const {productname, description, product_image, is_featured = true, category_id, supplier_id} = req.body;

        if(!productname || !description){
            return res.status(400).json({Message: 'Missing required fields: productname and description are required'});
        }
        
        const[product] = await pool.query(`
            INSERT INTO products (productname, description, product_image, is_featured, category_id, supplier_id) 
            VALUES (?,?,?,?,?,?)`, 
            [productname, description, product_image, is_featured, category_id, supplier_id]);
            
        res.status(201).json({
            Message: 'Product created successfully',
            productId: product.insertId,
            product: {
                id: product.insertId,
                productname,
                description,
                product_image,
                is_featured,
                category_id,
                supplier_id
            }
        });
    }
    catch(error){
        console.error('ERROR Creating Product:', error);
        res.status(500).json({Message: 'Error creating product', error: error.message});
    }
};

// // Get All Products with pagination
async function getAllProducts(req,res){
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page-1)*limit;

        const [results] = await pool.query('SELECT COUNT(*) as total FROM products');
        const totalProducts = results[0].total;

        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description,p.product_image, p.is_featured, p.created_at, p.updated_at, c.name as category_name, s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, [limit, offset]);
            
        res.status(200).json({
            data: {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalItems: totalProducts,
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching Products:', error);
        res.status(500).json({Error: 'Error Fetching data from the database'});
    }
};

// Get Product by ID
async function getProductById(req,res){
    try{
        const {id} = req.params;
        const[products] = await pool.query(`
            SELECT p.product_id, p.product_name, p.product_description, p.product_image, p.is_featured, p.created_at, p.updated_at, c.name as category_name, s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.product_id = ?`, [id]);

        if(products.length === 0){
            return res.status(404).json({Message: 'Product not found'});
        }

        const [productItems] = await pool.query(`
            SELECT product_item_id, sku, qty_in_stock, product_image, price
            FROM product_item
            WHERE product_id = ?`, [id]);

        const [variations] = await pool.query(`
            SELECT v.variation_id, v.name, vo.variation_option_id, vo.value
            FROM product_variation pv
            JOIN variation v ON pv.variation_id = v.variation_id
            LEFT JOIN variation_option vo ON v.variation_id = vo.variation_id
            WHERE pv.product_id = ?`, [id]);

        const product = {...products[0], items: productItems, variations: variations};
        res.status(200).json({data: product});
    }
    catch(error){
        console.error('ERROR Fetching Product by ID:', error);
        res.status(500).json({Error: 'Error Fetching data from the database'});
    }
};

//Update Product
async function updateProduct(req,res){
    try{
        const{id} = req.params;
        const updateFields = req.body;

        if(Object.keys(updateFields).length === 0){
            return res.status(400).json({Message: 'No fields to update'});
        }

        const allowedFields = ['product_name','description','product_image','is_featured','category_id','supplier_id'];
        const validFields = {};

        Object.keys(updateFields).forEach(key => {
            if(allowedFields.includes(key)){
                validFields[key] = updateFields[key];
            }
        });
        const[result] = await pool.query('UPDATE products SET ? WHERE product_id = ?', [validFields,id]);

        if(result.affectedRows === 0){
            return res.status(404).json({Message: 'Product not found or no changes made'});
        }
        res.status(200).json()({Message: 'Product updated successfully'});
    }
    catch(error){
        console.error('ERROR Updating Product:', error);
        res.status(500).json({Error: 'Error Updating data in the database'});
    }
};

// Delete Product
async function deleteProduct(req,res){
    try{
        const{id} = req.params;
        const[product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [id]);

        if(product.length === 0){
            return res.status(404).json({Message: 'Product not found'});
        };
        await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
        res.status(200).json({Message: 'Product deleted successfully'});
    }
    catch(error){
        console.error('ERROR Deleting Product:', error);
        res.status(500).json({Error: 'Error Deleting data from the database'});
    }
};

// Create Product Item
async function createProductItem(req,res){
    try{
        const {productID} = req.params;
        const {sku,qty,price} = req.body;
        
        if(!sku||!qty||!price){
            return res.status(400).json({Error: 'Missing required fields'});
        }
        const[item]= await pool.query('INSERT INTO product_item (product_id,sku,qty_in_stock,price) VALUES (?,?,?,?)', [productID,sku,qty,price]);
        res.status(201).json({
            Message: 'Product Item created successfully',
            itemID: item.insertId
        });
    }
    catch(error){
        console.error('ERROR Creating Product Item:', error);
        res.status(500).json({Error: 'Error Inserting data into the database'});
    }
};

// Create Variation
async function createVariation(req,res){
    try{
        const {name} = req.body;
        if(!name){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[variation] = await pool.query('INSERT INTO variation (name) VALUES (?)', [name]);
        res.status(201).json({
            Message: 'Variation created successfully',
            variationId: variation.insertId
        }); 
    }
    catch(error){
        console.error('ERROR Creating Variation:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

// Create Variation Options
async function createVariationOptions(req,res){
    try{
        const {variationId} = req.params;
        const {value} = req.body;
        if(!value){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [option] = await pool.query('INSERT INTO variation_option (variation_id,value) VALUES (?,?)', [variationId, value]);
        res.status(201).json({
            Message: 'Variation Option created successfully',
            optionID: option.insertId
        });
    }
    catch(error){
        console.error('ERROR Creating Variation Option:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

// Product Configuration
async function productConfiguration(req,res){
    try{
        const {productItemID} = req.params;
        const {variationOptionID}= req.body;

        if(!variationOptionID){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [config]= await pool.query('INSERT INTO product_configurations (product_item_id,variation_option_id) VALUES (?,?)', [productItemID, variationOptionID]);
        res.status(201).json({ Message: 'Product Configuration created successfully'})
    }
    catch(error){
        console.error('ERROR Creating Product Configuration:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

// Product Variation
async function productVariation(req,res){
    try{
        const {productID} = req.params;
        const {variationID} = req.body;

        if(!variationID){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[prodVar] = await pool.query('INSERT INTO product_variations (product_id,variation_id) VALUES (?,?)', [productID, variationID]);
        res.status(201).json({Message: 'Product Variation created successfully'});
    }
    catch(error){
        console.error('ERROR Creating Product Variation:', error);
        res.status(500).json({Error:'Error Inserting data into the datebase'})
    }
};

// Create Category
async function createCategory(req,res){
    try{
        const { name, parent_categories_id } = req.body;
        if(!name){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[category] = await pool.query('INSERT INTO categories (name,parent_categories_id) VALUES (?,?)', [name,parent_categories_id]);
        res.status(201).json({
            Message: 'Category created successfully',
            categoryId: category.insertId
        });
    }
    catch(error){
        console.error('ERROR Creating Category:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

//Create All Categories
async function getAllCategories(req,res){
    try{
        const [categories] = await pool.query(`
            SELECT c1.category_id, c1.name, c1.parent_categories_id, c2.name as parent_categories_id
            FROM categories c1
            LEFT JOIN categories c2 ON c1.parent_category_id = c2.category_id
            ORDER BY c1.name`);

            res.status(200).json({Data: categories});
    }
    catch(error){
        console.error('ERROR Fetching Categories:', error);
        res.status(500).json({Error:'Error Fetching data from the database'});
    }
};

//Get Product by Category
async function getProductByCategory(req,res){
    try{
        const {categoryId} = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page-1)*limit;

        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            WHERE p.category_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, [categoryId, limit, offset]);
        res.status(200).json({Data: products});
    }
    catch(error){
        console.error('ERROR Fetching Products by Category:', error);
        res.status(500).json({Error:'Error Fetching Products by Category from the database'});
    }
};

//Create Supplier
async function createSupplier(req,res){
    try{
        const { name,contact_info } = req.body;
        if(!name){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[supplier] = await pool.query('INSERT INTO suppliers (name,contact_info) VALUES (?,?)', [name,contact_info]);
        res.status(201).json({
            Message: 'Supplier created successfully',
            supplierId: supplier.insertId
        });
    }
    catch(error){
        console.error('ERROR Creating Supplier:',error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

//Add item to cart
async function addItemToCart(req,res){
    try{
        const user_id = req.user.user_id;
        const{product_item_id,qty} = req.body;
        
        if(!product_item_id || !qty){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [user_id]);
        let cart_id;

        if(cart.length === 0){
            const[newCart] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            cart_id = newCart.insertId;
        }
        else{
            cart_id = cart[0].cart_id;
        }

        const[existingItem] = await pool.query('SELECT * FROM cart_items WHERE cart_id = ? AND product_item_id = ?', [cart_id, product_item_id]);
        if(existingItem.length === 0){
            await pool.query('INSERT INTO cart_items (cart_id, product_item_id, qty) VALUES (?,?,?)', [cart_id, product_item_id,qty]);
            res.status(201).json({Message: 'Item added to cart successfully'});
        }
        else{
            const newQty = existingItem[0].qty + qty;
            await pool.query('UPDATE cart_items SET qty = ? WHERE cart_item_id = ?', [newQty, existingItem[0].cart_item_id]);
            res.status(200).json({Message: 'Cart Item quantity updated successfully'});
        }
    }
    catch(error){
        console.error('ERROR Adding Item to Cart:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
    }
};

//Get User Cart
async function getUserCart(req,res){
    try{
        const user_id = req.user.user_id;

        let [carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            const [newCart] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            const cart_id = newCart.insertId;
            return res.status(200).json({
                Data:{
                    cart_id,
                    items: [],
                    total_amount: 0
                },
                Message: 'New cart created for the user'
            });
        }

        const cart_id = carts[0].cart_id;
        const [cartItems] = await pool.query(`
            SELECT  ci.cart_item_id, ci.qty, ci.product_item_id, pi.price, pi.sku, pi.product_image, p.productname, p.description
            FROM cart_items ci
            JOIN product_items pi ON ci.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            WHERE ci.cart_id = ?`, [cart_id]);

        const total_amount = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        res.status(200).json({Data: cart_id, items: cartItems, total: total_amount.toFixed(2), itemCount: cartItems.length});
    }
    catch(error){
        console.error('ERROR Fetching User Cart:', error);
        res.status(500).json({Error:'Error Fetching User Cart from the database'});
    }
};

//Update Cart Item
async function updateCartItem(req,res){
    try{
        const {cartItemId} = req.params;
        const {qty} = req.body;

        if (!qty || qty < 1){
            return res.status(400).json({Message: 'Quantity must be at least 1'});
        }
        const[updateItem] = await pool.query('UPDATE cart_items SET qty = ? WHERE cart_item_id = ?', [qty, cartItemId]);

        if(updateItem.affectedRows === 0){
            return res.status(404).json({Message: 'Cart Item not found or no changes made'});
        }
    }
    catch(error){
        console.error('ERROR Updating Cart Item:', error);
        res.status(500).json({Error:'Error Updating Cart Item in the database'});
    }
};

//Remove Cart Item
async function removeCartItem(req,res){
    try{
        const {cartItemId} = req.params;
        const[deleteItem] = await pool.query('DELETE FROM cart_items WHERE cart_item_id = ?', [cartItemId]);

        if(deleteItem.affectedRows === 0){
            return res.status(404).json({Message: 'Cart Item not found'});
        }
        res.status(200).json({Message: 'Cart Item removed successfully'});
    }
    catch(error){
        console.error('ERROR Removing Cart Item:', error);
        res.status(500).json({Error:'Error Removing Cart Item from the database'});
    }
};

// Clear Cart
async function clearCart(req,res){
    try{
        const user_id = req.user.user_id;
        const[carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            return res.status(404).json({Message: 'No Active Cart Found for the User'});
        }

        const cart_id = carts[0].cart_id;
        await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);

        res.status(200).json({Message: 'Cart Cleared Successfully'});
    }
    catch(error){
        console.error('ERROR Clearing Cart:', error);
        res.status(500).json({Error:'Error Clearing Cart from the database'});
    }
};

// Payment Using Stripe
async function processPayment(req,res){
    try{
        const user_id = req.user.user_id;

        const [carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            return res.status(404).json({Message: 'No Active Cart Found for the User'});
        }
        const cart_id = carts[0].cart_id;
        const get_items = `
        SELECT SUM(ci.qty * pi.price) AS total_amount
        FROM cart_items ci
        JOIN product_item pi ON ci.product_item_id = pi.product_item_id
        WHERE ci.cart_id = ?
        `;
        const [totals] = await pool.query(get_items, [cart_id]);
        const total_amount = totals[0].total_amount || 0;

        if (total_amount <= 0){
            return res.status(400).json({Message: 'Cart is empty'});
        }

        //integrating with stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total_amount * 100), 
            currency: 'aud',
            automatic_payment_methods: {enabled: true}
        });
        res.status(200).json({
            Message: 'Payment Intent Created Successfully',
            clientSecret: paymentIntent.client_secret,
            amount: total_amount
        });
    }
    catch(error){
        console.error('ERROR Processing Payment:', error);
        res.status(500).json({Error: 'Error Processing Payment'});
    }
};

// Create Order
async function createOrder(req,res){
    let connection;
    try{
        const user_id = req.user.user_id;
        const {shipping_method, shipping_address, process_payment_id} = req.body;

        if(!shipping_method || !shipping_address || !process_payment_id === 0){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [carts] = await connection.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            await connection.rollback();
            return res.status(404).json({Message: 'No active cart found for the user'});
        }
        const cart_id = carts[0].cart_id;
        const get_items = `
        SELECT ci.product_item_id, ci.qty, pi.price
        FROM cart_items ci
        JOIN product_item pi ON ci.product_item_id = pi.product_item_id
        WHERE ci.cart_id = ?
        `;
        const [items] = await connection.query(get_items, [cart_id]);

        if(items.length === 0){
            await connection.rollback();
            return res.status(400).json({Message: 'Cart is Empty'});
        }   
        const total_amount = items.reduce((total, item) => total + (item.price * item.qty), 0);

        const order = 'INSERT INTO shop_orders (user_id, total_amount, shipping_method, shipping_address, transaction_id, payment_status, order_status) VALUES (?,?,?,?,?,?,?)';
        const orderValues = [user_id, total_amount, shipping_method, shipping_address, process_payment_id, 'Pending', 1];
        const [orderResult] = await connection.query(order, orderValues);
        const shop_order_id = orderResult.insertId;
        //Record payment
        const payment = 'INSERT INTO payment (shop_order_id, amount, payment_method, payment_status,transaction_id) VALUES (?,?,?,?,?)';
        await connection.query(payment, [shop_order_id, total_amount, 'Stripe', 'Pending', process_payment_id]);
        
        //Record into the orderline
        const orderline = 'INSERT INTO order_line (shop_order_id, product_item_id, qty, price) VALUES (?,?,?,?)';
        const orderlinevalues = items.map(item => [shop_order_id, item.product_item_id, item.qty, item.price]);
        await connection.query(orderline, [orderlinevalues]);

        // Record stock movements for each ordered item
        for (const item of items) {
            // Get product_id from product_item
            const [productInfo] = await connection.query(
                'SELECT pi.product_id FROM product_item pi WHERE pi.product_item_id = ?',
                [item.product_item_id]
            );
            
            if (productInfo.length > 0) {
                const productId = productInfo[0].product_id;
                // Record negative stock movement for sale
                await recordStockMovement(
                    item.product_item_id,
                    'sale',
                    -item.qty, // negative because it's a sale
                    shop_order_id,
                    `Sale - Order #${shop_order_id}`,
                    user_id
                );
            }
        }

        const deleteCartItems = 'DELETE FROM cart_items WHERE cart_id = ?';
        await connection.query(deleteCartItems, [cart_id]);

        await connection.commit();

        // Send order confirmation email and SMS
        try {
            // Get user details for notifications
            const [userDetails] = await pool.query(
                'SELECT firstName, lastName, email, phoneNumber, email_notifications, sms_notifications FROM users WHERE user_id = ?', 
                [user_id]
            );
            
            if (userDetails.length > 0) {
                const user = {
                    first_name: userDetails[0].firstName,
                    last_name: userDetails[0].lastName,
                    email: userDetails[0].email,
                    phone: userDetails[0].phone,
                    email_notifications: userDetails[0].email_notifications,
                    sms_notifications: userDetails[0].sms_notifications
                };

                // Prepare order details for email
                const orderDetails = {
                    order_id: shop_order_id,
                    total_amount: total_amount,
                    created_at: new Date(),
                    items: items.map(item => ({
                        name: `Product Item #${item.product_item_id}`, // You might want to get actual product names
                        quantity: item.qty,
                        price: item.price
                    }))
                };

                // Send order confirmation email
                await notificationService.sendOrderConfirmation(user, orderDetails);
                console.log('Order confirmation email sent for order:', shop_order_id);

                // Send SMS notification
                await notificationService.sendOrderStatusSMS(user, shop_order_id, 'processing');
                console.log('Order SMS notification sent for order:', shop_order_id);
            }
        } catch (notificationError) {
            console.error('Failed to send order notifications:', notificationError);
            // Don't fail the order if notifications fail
        }
    }
    catch(error){
        if(connection){
            await connection.rollback();
            console.error('ERROR Creating Order:', error);
            res.status(500).json({Error:'Error Inserting data into the database'});
        }
    }
    finally{
        if(connection) connection.release();
    }
};

async function stripeWebhook(req,res){
    const sig = req.headers['stripe-signature'];
    let event;

    try{
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch(error){
        console.error(`ERROR Verifying Stripe Webhook: ${error.message}`);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    
    try {
        if(event.type === 'payment_intent.succeeded'){
            const paymentIntent = event.data.object;
            console.log('Payment Succeeded:', paymentIntent.id);
            await handleSuccessfulPayment(paymentIntent);
        } else if(event.type === 'payment_intent.payment_failed'){
            const failedPayment = event.data.object;
            console.log('Payment Failed:', failedPayment.id);
            await handleFailedPayment(failedPayment);
        } else {
            console.log('Unhandled webhook event type:', event.type);
        }
        
        res.status(200).json({received: true, eventType: event.type});
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({error: 'Webhook processing failed'});
    }
};

async function handleSuccessfulPayment(paymentIntent){
    let connection;
    try{
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const updateOrder = 'UPDATE shop_orders SET payment_status = "Paid", order_status = ? WHERE transaction_id = ?';
        await connection.query(updateOrder, [2,paymentIntent.id])

        const updatePayment = 'UPDATE payment SET payment_status = "Paid" WHERE transaction_id = ?';
        await connection.query(updatePayment, [paymentIntent.id]);

        const getCart = `
        SELECT c.cart_id FROM cart c
        JOIN users u ON c.user_id = u.user_id
        JOIN shop_orders so ON u.user_id = so.user_id
        WHERE so.transaction_id = ?
        `;

        const [carts] = await connection.query(getCart, [paymentIntent.id]);
        if(carts.length > 0){
            const cart_id = carts[0].cart_id;
            const deleteCartItems = 'DELETE FROM cart_items WHERE cart_id = ?';
            await connection.query(deleteCartItems, [cart_id]);
        }
        
        // Get user email for order confirmation (if needed later)
        const [orderInfo] = await connection.query(`
            SELECT u.email, u.firstName, so.shop_order_id 
            FROM shop_orders so
            JOIN users u ON so.user_id = u.user_id
            WHERE so.transaction_id = ?
        `, [paymentIntent.id]);
        
        await connection.commit();
        console.log(`Order and Payment records updated for Transaction ID: ${paymentIntent.id}`);

        // Send payment confirmation email
        if (orderInfo.length > 0) {
            try {
                // Get full user details for notifications
                const [userDetails] = await pool.query(
                    'SELECT firstName, lastName, email, phoneNumber, email_notifications, sms_notifications FROM users u JOIN shop_orders so ON u.user_id = so.user_id WHERE so.transaction_id = ?', 
                    [paymentIntent.id]
                );

                if (userDetails.length > 0) {
                    const user = {
                        first_name: userDetails[0].firstName,
                        last_name: userDetails[0].lastName,
                        email: userDetails[0].email,
                        phone: userDetails[0].phoneNumber,
                        email_notifications: userDetails[0].email_notifications,
                        sms_notifications: userDetails[0].sms_notifications
                    };

                    // Get order details
                    const [orderDetails] = await pool.query(
                        'SELECT shop_order_id, total_amount FROM shop_orders WHERE transaction_id = ?',
                        [paymentIntent.id]
                    );

                    if (orderDetails.length > 0) {
                        const order = {
                            order_id: orderDetails[0].shop_order_id,
                            total_amount: orderDetails[0].total_amount
                        };

                        // Send payment confirmation email
                        await notificationService.sendPaymentConfirmation(user, order, 'Credit/Debit Card');
                        console.log('Payment confirmation email sent for transaction:', paymentIntent.id);
                    }
                }
            } catch (notificationError) {
                console.error('Failed to send payment confirmation:', notificationError);
                // Don't fail the payment processing if notification fails
            }
        }
        
        // TODO: Send order confirmation email when email system is implemented
        if(orderInfo.length > 0) {
            console.log(`Order confirmation needed for: ${orderInfo[0].email}`);
        }
        
    } catch(error){
        if(connection){
            await connection.rollback();
            console.error('ERROR Handling Successful Payment:', error);
        }
        throw error; // Re-throw to be caught by webhook handler
    } finally{
        if(connection) connection.release();
    }       
};

// Add missing handleFailedPayment function
async function handleFailedPayment(paymentIntent) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Update order status to failed
        await connection.query(
            'UPDATE shop_orders SET payment_status = "Failed", order_status = ? WHERE transaction_id = ?',
            [5, paymentIntent.id]
        );

        // Update payment record
        await connection.query(
            'UPDATE payment SET payment_status = "Failed" WHERE transaction_id = ?',
            [paymentIntent.id]
        );
        // Get user email for notification
        const [orderInfo] = await connection.query(`
            SELECT u.email, u.firstName, so.shop_order_id 
            FROM shop_orders so
            JOIN users u ON so.user_id = u.user_id
            WHERE so.transaction_id = ?
        `, [paymentIntent.id]);

        await connection.commit();
        console.log(`Payment failed for Order: ${orderInfo[0]?.shop_order_id}, Transaction ID: ${paymentIntent.id}`);
        
        // TODO: Send payment failed email when email system is implemented
        if (orderInfo.length > 0) {
            console.log(`Payment failed notification needed for: ${orderInfo[0].email}`);
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error handling failed payment:', error);
        throw error; // Re-throw to be caught by webhook handler
    } finally {
        if (connection) connection.release();
    }
};    

//Get User Orders
async function getUserOrders(req,res){
    try{
        const user_id = req.user.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page-1)*limit;

        const [orders] = await pool.query(`
            SELECT so.shop_order_id, so.order_date, so.order_total, so.payment_status, os.status as order_status, sm.name as shipping_method,
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            WHERE so.user_id = ?
            ORDER BY so.order_date DESC
            LIMIT ? OFFSET ?`, [user_id, limit, offset]);
        
        res.status(200).json({Data: orders});
    }
    catch (error){
        console.error('ERROR Fetching User Orders:', error);
        res.status(500).json({Error:'Error Fetching User Orders from the database'});
    }
};

//Get Order Details
async function getOrderById(req,res){
    try{
        const user_id = req.user.user_id;
        const {orderId} = req.params;

        const [orders] = await pool.query(`
            SELECT 
                so.shop_order_id, so.order_date, so.order_total, so.payment_status, 
                os.status as order_status, sm.name as shipping_method, sm.price as shipping_cost,
                a.address_line1, a.address_line2, a.postcode, a.states, a.country
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            JOIN address a ON so.shipping_address = a.address_id
            WHERE so.user_id = ? AND so.shop_order_id = ?`, [user_id, orderId]);

        if(orders.length === 0){
            return res.status(404).json({Message: 'Order not found'});
        }
        const [orderItems] = await pool.query(`
            SELECT ol.qty, ol.price, pi.sku, p.product_image, p.productname, p.description
            FROM order_line ol
            JOIN product_items pi ON ol.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            WHERE ol.shop_order_id = ?`, [orderId]);

        const orderDetails = {...orders[0], items: orderItems};

        res.status(200).json({Order: orderDetails});
    }
    catch(error){
        console.error('ERROR Fetching Order Details:', error);
        res.status(500).json({Error:'Error Fetching Order Details'});
    }
};

// Update Order Status (Admin only)
async function updateOrderStatus(req,res) {
    try {
        const { order_id } = req.params;
        const { order_status_id, tracking_number } = req.body;

        // Map status strings to numeric IDs used in database
        const statusMapping = {
            'processing': 1,
            'paid': 2, 
            'shipped': 3,
            'delivered': 4,
            'cancelled': 5,
            'refunded': 6
        };
        const nextStatusId = statusMapping[order_status_id];
        if (!nextStatusId) {
             return res.status(400).json({Message: 'Invalid order status'});
         }

        // Update order status with numeric ID
        await pool.query('UPDATE shop_orders SET order_status_id = ? WHERE shop_order_id = ?', [nextStatusId, order_id]);

        // If status is shipped and tracking number provided, update that too
        if (nextStatusId === statusMapping['shipped'] && tracking_number) {
            await pool.query('UPDATE shop_orders SET tracking_number = ? WHERE shop_order_id = ?', [tracking_number, order_id]);
        }

        // Get order and user details for notification
        const [orderDetails] = await pool.query(`
            SELECT so.*, u.firstName, u.lastName, u.email, u.phoneNumber, u.email_notifications, u.sms_notifications
            FROM shop_orders so
            JOIN users u ON so.user_id = u.user_id
            WHERE so.shop_order_id = ?
        `, [order_id]);

        if (orderDetails.length > 0) {
            const order = orderDetails[0];
            const user = {
                first_name: order.firstName,
                last_name: order.lastName,
                email: order.email,
                phone: order.phoneNumber,
                email_notifications: order.email_notifications,
                sms_notifications: order.sms_notifications
            };

            try {
                // Send email notification
                await notificationService.sendOrderStatusEmail(user, order, order_status_id, tracking_number);

                // Send SMS notification
                await notificationService.sendOrderStatusSMS(user, order_id, order_status_id);
                console.log('Order status notifications sent for order:', order_id);
            } catch (notificationError) {
                console.error('Failed to send order status notifications:', notificationError);
                // Don't fail the status update if notifications fail
            }
        }

        res.status(200).json({Message: 'Order status updated and notifications sent'});

    } catch (error) {
        console.error('ERROR updating order status:', error);
        res.status(500).json({Message: 'Failed to update order status'});
    }
};

//Search Products
async function searchProducts(req,res){
    try{
        const {
            query='',category,MinPrice, MaxPrice, featured, page = 1, limit = 12, sortBy = 'created_at', sortOrder = 'desc' 
        } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if(query){
            whereConditions.push('(p.productname LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${query}%`, `%${query}%`);
        }

        if(category){
            whereConditions.push('c.category_id = ?');
            queryParams.push(category);
        }

        if(MinPrice||MaxPrice){
            if(MinPrice){
                whereConditions.push('pi.price >= ?');
                queryParams.push(parseFloat(MinPrice));
            }
            if(MaxPrice){
                whereConditions.push('pi.price <= ?');
                queryParams.push(parseFloat(MaxPrice));
            }
        }
        if(featured !== undefined){
            whereConditions.push('p.is_featured = ?');
            queryParams.push(featured === 'true' ? 1 : 0);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const validSortColumns = ['created_at', 'productname', 'price'];
        const validSortOrder = ['ASC', 'DESC'];

        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const searchQuery = `
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at, 
                c.name as category_name,
                MIN(pi.price) as min_price,
                MAX(pi.price) as max_price,
                COUNT(DISTINCT pi.product_item_id) as variants_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_items pi ON p.product_id = pi.product_id
            ${whereClause}
            GROUP BY p.product_id
            ORDER BY ${finalSortBy} ${finalSortOrder}
            LIMIT ? OFFSET ?`;
            
        queryParams.push(parseInt(limit), parseInt(offset));

        const [products] = await pool.query(searchQuery, queryParams);

        const countQuery = `
            SELECT COUNT(DISTINCT p.product_id) as total
            FROM products p
            LEFT JOIN product_items pi ON p.product_id = pi.product_id
            ${whereClause}`;

        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const totalProducts = countResult[0].total;

        res.status(200).json({
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                },
                appliedFilters: {
                    query,
                    category,
                    MinPrice,
                    MaxPrice,
                    featured,
                    sortBy: finalSortBy,
                    sortOrder: finalSortOrder
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Searching Products:', error);
        res.status(500).json({Error:'Error Searching Products'});
    }
};

// Filer by Price Range
async function filterByPriceRange(req,res){
    try{
        const {MinPrice, MaxPrice, page =1 , limit =12} = req.query;
        const offset = (page - 1) * limit;

        if(!MinPrice && !MaxPrice){
            return res.status(400).json({Message: 'At least one of minPrice or maxPrice is required'});
        }
        let priceConditions = [];
        let queryParams = [];

        if(MinPrice && MaxPrice){
            priceConditions.push('pi.price BETWEEN ? AND ?');
            queryParams.push(parseFloat(MinPrice), parseFloat(MaxPrice));
        } else if(MinPrice){
            priceConditions.push('pi.price >= ?');
            queryParams.push(parseFloat(MinPrice));
        } else if(MaxPrice){
            priceConditions.push('pi.price <= ?');
            queryParams.push(parseFloat(MaxPrice));
        }

        const [products] = await pool.query(`
            SELECT DISTINCT p.product_id, p.productname, p.description, p.product_image, p.is_featured, c.name as category_name, 
                MIN(pi.price) as min_price,MAX(pi.price) as max_price
            FROM products p
            JOIN product_items pi ON p.product_id = pi.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE ${priceConditions}
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, [...queryParams, parseInt(limit), parseInt(offset)]);

            res.status(200).json({
                Data: products,
                priceRange: {MinPrice, MaxPrice},
                resultCount: products.length
            });
    }
    catch(error){
        console.error('ERROR Filtering Products by Price Range:', error);
        res.status(500).json({Error:'Error Filtering Products by Price Range'});
    }
};

// Get Featured Products
async function getFeaturedProducts(req,res){
    try{
        const {limit = 10} = req.query;
        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.created_at, c.name as category_name, MIN(pi.price) as min_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_items pi ON p.product_id = pi.product_id
            WHERE p.is_featured = 1
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ?`, [parseInt(limit)]);

        res.status(200).json({
            Data: products,
            resultCount: products.length
        });
    }
    catch(error){
        console.error('ERROR Fetching Featured Products:', error);
        res.status(500).json({Error:'Error Fetching Featured Products'});
    }
};

// Get Product Suggestions
async function getProductSuggestions(req,res){
    try{
        const {productId} = req.params;
        const {limit = 5} = req.query;

        const [currentProduct] = await pool.query('SELECT category_id FROM products WHERE product_id = ?', [productId]);

        if(currentProduct.length === 0){
            return res.status(404).json({Message: 'Product not found'});
        }

        const categoryId = currentProduct[0].category_id;

        const [suggestions] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, MIN(pi.price) as min_price
            FROM products p
            LEFT JOIN product_items pi ON p.product_id = pi.product_id
            WHERE p.category_id = ? AND p.product_id != ?
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ?`, [categoryId, productId, parseInt(limit)]);

        res.status(200).json({
            Data: suggestions,
            resultCount: suggestions.length
        });
    }
    catch(error){
        console.error('ERROR Fetching Product Suggestions:', error);
        res.status(500).json({Error:'Error Fetching Product Suggestions'});
    }
};

// GET Available Filters
async function getAvailableFilters(req,res){
    try{
        const [priceRange] = await pool.query(`
            SELECT MIN(pi.price) as min_price, MAX(pi.price) as max_price
            FROM products p `);
        
        const [categories] = await pool.query(`
            SELECT c.category_id, c.name, COUNT(p.product_id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id
            GROUP BY c.category_id, c.name
            HAVING product_count > 0
            ORDER BY c.name `);

        const [suppliers] = await pool.query(`
            SELECT s.supplier_id, s.name, COUNT(p.product_id) as product_count
            FROM suppliers s
            LEFT JOIN products p ON s.supplier_id = p.supplier_id
            GROUP BY s.supplier_id, s.name
            HAVING product_count > 0
            ORDER BY s.name`);

        res.status(200).json({
            Data: {
                priceRange: priceRange[0],
                categories,
                suppliers
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching Available Filters:', error);
        res.status(500).json({Error:'Error Fetching Available Filters'});
    }
};

// Product Reviews
async function createProductReview(req,res){
    try{
        const user_id = req.user.user_id;
        const {productId} = req.params; 
        const {rating, comment} = req.body;

        if(!rating || rating < 1 || rating > 5){
            return res.status(400).json({Message: 'Rating must be between 1 and 5'});
        }

        //Check for product
        const [product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [productId]);
        if(product.length === 0){
            return res.status(404).json({Message: 'Product not found'});
        }

        const [existingReview] = await pool.query(`
            SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?`, [user_id, productId]);

        if(existingReview.length > 0){
            return res.status(400).json({Message: 'You have already reviewed this product'});
        } 
    
        if(existingReview.length > 0){
            return res.status(400).json({Message: 'You have already reviewed this product'});
        }

        //verify user purchased the product
        const [purchased] = await pool.query(`
            SELECT COUNT(*) as purchase_count
            FROM shop_orders so
            JOIN order_line ol ON so.shop_order_id = ol.shop_order_id
            JOIN product_items pi ON ol.product_item_id = pi.product_item_id
            WHERE so.user_id = ? AND pi.product_id = ? AND so.payment_status = 'Paid'
            )`, [user_id, productId]);
        
        const verifiedPurchase = purchased[0].purchase_count > 0;

        if(!verifiedPurchase){
            return res.status(400).json({Message: 'You can only review products you have purchased'});
        }
        //Insert review
        const[reviews] = await pool.query(`INSERT INTO product_reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`, [user_id, productId, rating, comment]);

        res.status(201).json({
            Message: 'Review created successfully',
            data: {
                reviewId: reviews.insertId, 
                verifiedPurchase
            }
        });
    }
    catch(error){
        console.error('ERROR Creating Product Review:', error);
        res.status(500).json({Error:'Error Creating Product Review'});
    }
};

//Get Product Reviews
async function getProductReviews(req,res){
    try{
        const {productId} = req.params;
        const {page = 1, limit = 10, sortBy = 'review_date', sortOrder = 'DESC'} = req.query;   
        const offset = (page - 1) * limit;

        const allowedSortBy = ['review_date', 'rating'];
        const allowedSortOrder = ['ASC', 'DESC'];

        if(!allowedSortBy.includes(sortBy)){
            return res.status(400).json({Message: `Invalid sortBy value. Allowed values are: ${allowedSortBy.join(', ')}`});
        }
        if(!allowedSortOrder.includes(sortOrder.toUpperCase())){
            return res.status(400).json({Message: `Invalid sortOrder value. Allowed values are: ${allowedSortOrder.join(', ')}`});
        }

        const [reviews] = await pool.query(`
            SELECT r.review_id, r.rating, r.comment, r.review_date, u.firstName, u.lastName
            CASE 
                WHEN purchases.purchase_count > 0 THEN TRUE
                ELSE FALSE
            END as is_verified_purchase
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN(
            SELECT so.user_id, COUNT(*) as purchase_count
            FROM shop_orders so
            JOIN order_line ol ON so.shop_order_id = ol.shop_order_id
            JOIN product_items pi ON ol.product_item_id = pi.product_item_id
            WHERE pi.product_id = ? AND so.payment_status = 'Paid'
            GROUP BY so.user_id
            ) as purchases ON r.user_id = purchases.user_id
            WHERE r.product_id = ?
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`, [productId, productId, parseInt(limit), parseInt(offset)]);

            const[stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM reviews
                WHERE product_id = ?`, [productId]);

            const avgrating = stats[0].average_rating;

            res.status(200).json({
                Data: {
                    reviews,
                    statistics: {
                        ...stats[0],
                        average_rating: avgrating ? parseFloat(avgrating.toFixed(1)) : 0.0
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(stats[0].total_reviews / limit),
                        totalReviews: stats[0].total_reviews,
                    }
                }
            });
        }
        catch(error){
            console.error('ERROR Fetching Product Reviews:', error);
            res.status(500).json({Error:'Error Fetching Product Reviews'});
        }   
};

//Update Product Review
async function updateProductReview(req,res){
    try{
        const user_id = req.user.user_id;
        const {reviewId} = req.params;
        const {rating, comment} = req.body;

        if(rating && (rating < 1 || rating > 5)){
            return res.status(400).json({Message: 'Rating must be between 1 and 5'});
        }

        const[reviews] = await pool.query('SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?', [reviewId, user_id]);

        if(reviews.length === 0){
            return res.status(404).json({Message: 'Review not found or you are not authorized to update this review'});
        }

        const updateFields = {};
        if(rating) updateFields.rating = rating;
        if(comment !== undefined) updateFields.comment = comment;

        if(Object.keys(updateFields).length === 0){
            return res.status(400).json({Message: 'No fields to update'});
        }

        await pool.query('UPDATE reviews SET ? WHERE review_id = ?', [updateFields, reviewId]);

        res.status(200).json({Message: 'Review updated successfully'});
    }
    catch(error){
        console.error('ERROR Updating Product Review:', error);
        res.status(500).json({Error:'Error Updating Product Review'});
    }
};

// DELETE Product Review
async function deleteProductReview(req,res){
    try{
        const user_id = req.user.user_id;
        const {reviewId} = req.params;

        const[reviews] = await pool.query('SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?', [reviewId, user_id]);

        if(reviews.length === 0){
            return res.status(404).json({Message: 'Review not found or you are not authorized to delete this review'});
        }

        await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
        res.status(200).json({Message: 'Review deleted successfully'});
    }
    catch(error){
        console.error('ERROR Deleting Product Review:', error);
        res.status(500).json({Error:'Error Deleting Product Review'});
    }
};

// GET Average Product Rating
async function getAverageProductRating(req,res){
    try{
        const {productId} = req.params;
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE product_id = ?`, [productId]);

        const avgrating = stats[0].average_rating;

        res.status(200).json({
            Data: {
                productId: parseInt(productId),
                totalReviews: avgrating.total_reviews,
                averageRating: parseFloat(avgrating.average_rating || 0).toFixed(1),
                ratingsBreakdown: {
                    5: stats.five_star,
                    4: stats.four_star,
                    3: stats.three_star,
                    2: stats.two_star,
                    1: stats.one_star
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching Average Product Rating:', error);
        res.status(500).json({Error:'Error Fetching Average Product Rating'});
    }
};

// GET User's Product Reviews
async function getUserProductReviews(req,res){
    try{
        const user_id = req.user.user_id;
        const {page = 1, limit = 10} = req.query;
        const offset = (page - 1) * limit;

        const [reviews] = await pool.query(`
            SELECT r.review_id, r.rating, r.comment, r.review_date, p.product_id, p.productname, p.product_image
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
            LIMIT ? OFFSET ?`, [user_id, parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.query('SELECT COUNT(*) as total_reviews FROM reviews WHERE user_id = ?', [user_id]);

        res.status(200).json({
            Data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total_reviews / limit),
                    totalReviews: countResult[0].total_reviews
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching User Product Reviews:', error);
        res.status(500).json({Error:'Error Fetching User Product Reviews'});
    }
};

// INVENTORY MANAGEMENT FUNCTIONS

// Record stock movement and update product stock
async function recordStockMovement(productItemId, movementType, quantityChange, referenceId = null, reason = '', createdBy = null) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get current stock
        const [productItemResult] = await connection.query(
            'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
            [productItemId]
        );

        if (productItemResult.length === 0) {
            throw new Error('Product not found');
        }

        const quantityBefore = productItemResult[0].qty_in_stock;
        const quantityAfter = quantityBefore + quantityChange;
        
        // Prevent negative stock
        if (quantityAfter < 0) {
            throw new Error('Insufficient stock quantity');
        }
        
        // Update product stock
        await connection.query(
            'UPDATE product_item SET qty_in_stock = ? WHERE product_item_id = ?',
            [quantityAfter, productItemId]
        );
        
        // Record stock movement
        await connection.query(
            `INSERT INTO stock_movements 
             (product_item_id, movement_type, quantity_change, quantity_before, quantity_after, reference_id, reason, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [productItemId, movementType, quantityChange, quantityBefore, quantityAfter, referenceId, reason, createdBy]
        );
        
        await connection.commit();
        return {quantityBefore, quantityAfter};
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Get current stock levels for products
async function getStockLevels(req, res) {
    try {
        const { page = 1, limit = 50, category, lowStock, productId } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT pi.product_item_id, pi.qty_in_stock, pi.sku, pi.price,
                p.product_id, p.productname, p.description, c.name as category_name,
                   CASE 
                       WHEN pi.qty_in_stock <= 10 THEN 'Low'
                       WHEN pi.qty_in_stock <= 50 THEN 'Medium'
                       ELSE 'Good'
                   END as stock_status
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
        `;
        
        const params = [];
        const conditions = [];
        
        if (category) {
            conditions.push('c.name = ?');
            params.push(category);
        }

        if(productId){
            conditions.push('p.product_id = ?');
            params.push(productId);
        }
        
        if (lowStock === 'true') {
            conditions.push('pi.qty_in_stock <= 10');
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY pi.qty_in_stock ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [results] = await pool.query(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id`;

        const countParams = [];
        
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            // Add the same category parameter if it exists
            if (category) countParams.push(category);
            if (productId) countParams.push(productId);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting stock levels:', error);
        res.status(500).json({ Message: 'Failed to get stock levels' });
    }
};

// Update stock quantity for a product
async function updateStock(req, res) {
    try {
        const { productItemId } = req.params;
        const { quantity, reason = 'Manual adjustment' } = req.body;
        const userId = req.user?.user_id;
        
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ Message: 'Valid quantity is required' });
        }
        
        // Get current stock to calculate the change
        const [productItemResult] = await pool.query(
            'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
            [productItemId]
        );

        if (productItemResult.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        const currentStock = productItemResult[0].qty_in_stock;
        const quantityChange = parseInt(quantity) - currentStock;
        const movementType = quantityChange > 0 ? 'restock' : 'adjustment';
        
        const result = await recordStockMovement(
            productItemId,
            movementType, 
            quantityChange, 
            null, 
            reason, 
            userId
        );
        
        res.json({
            Message: 'Stock updated successfully',
            data: {
                productItemId,
                sku: productItemResult[0].sku,
                previousStock: result.quantityBefore,
                newStock: result.quantityAfter,
                change: quantityChange
            }
        });
        
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ 
            Message: error.message || 'Failed to update stock'
        });
    }
};

// Get products with low stock (≤ 10 items)
async function getLowStockProducts(req, res) {
    try {
        const { threshold = 10 } = req.query;
        
        const [results] = await pool.query(`
            SELECT pi.product_item_id, pi.qty_in_stock, pi.sku, pi.price,
                p.product_id, p.productname, p.description, 
                c.name as category_name
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE pi.qty_in_stock <= ?
            ORDER BY pi.qty_in_stock ASC
        `, [threshold]);
        
        res.json({
            data: results,
            count: results.length,
            threshold: parseInt(threshold)
        });
        
    } catch (error) {
        console.error('Error getting low stock products:', error);
        res.status(500).json({ Message: 'Failed to get low stock products' });
    }
}

// Bulk update stock for multiple products
async function bulkUpdateStock(req, res) {
    try {
        const { updates, reason = 'Bulk update' } = req.body;
        const userId = req.user?.user_id;
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({  
                Message: 'Updates array is required' 
            });
        }
        
        const results = [];
        const errors = [];
        
        for (const update of updates) {
            const { productItemId, quantity } = update;
            
            try {
                // Get current stock
                const [productItemResult] = await pool.query(
                    'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
                    [productItemId]
                );
                
                if (productItemResult.length === 0) {
                    errors.push({ productItemId, error: 'Product not found' });
                    continue;
                }

                const currentStock = productItemResult[0].qty_in_stock;
                const quantityChange = parseInt(quantity) - currentStock;
                const movementType = quantityChange > 0 ? 'restock' : 'adjustment';
                
                const result = await recordStockMovement(
                    productItemId, 
                    movementType, 
                    quantityChange, 
                    null, 
                    reason, 
                    userId
                );
                
                results.push({
                    productItemId,
                    sku: productItemResult[0].sku,
                    previousStock: result.quantityBefore,
                    newStock: result.quantityAfter,
                    change: quantityChange
                });
                
            } catch (error) {
                errors.push({ productItemId, ERROR: error.message });
            }
        }
        
        res.json({
            Message: `Updated ${results.length} products`,
            data: {
                successful: results,
                errors: errors,
                successCount: results.length,
                errorCount: errors.length
            }
        });
        
    } catch (error) {
        console.error('Error bulk updating stock:', error);
        res.status(500).json({ Message: 'Failed to bulk update stock' });
    }
};

// Get stock movement history
async function getStockMovements(req, res) {
    try {
        const { productItemId } = req.params;
        const { page = 1, limit = 20, movementType, dateFrom, dateTo } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT sm.*, pi.sku, p.productname, u.firstName, u.lastName
            FROM stock_movements sm
            LEFT JOIN product_item pi ON sm.product_item_id = pi.product_item_id
            LEFT JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN users u ON sm.created_by = u.user_id
            WHERE sm.product_item_id = ?
        `;
        
        const params = [productItemId];
        
        if (movementType) {
            query += ' AND sm.movement_type = ?';
            params.push(movementType);
        }
        
        if (dateFrom) {
            query += ' AND sm.created_at >= ?';
            params.push(dateFrom);
        }
        
        if (dateTo) {
            query += ' AND sm.created_at <= ?';
            params.push(dateTo);
        }
        
        query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [results] = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM stock_movements WHERE product_item_id = ?';
        const countParams = [productItemId];

        if (movementType) {
            countQuery += ' AND movement_type = ?';
            countParams.push(movementType);
        }
        
        if (dateFrom) {
            countQuery += ' AND created_at >= ?';
            countParams.push(dateFrom);
        }
        
        if (dateTo) {
            countQuery += ' AND created_at <= ?';
            countParams.push(dateTo);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            Message: `Found ${results.length} movements`,
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error getting stock movements:', error);
        res.status(500).json({ Message: 'Failed to get stock movements' });
    }
};

// Get Dashboard Stats (Admin only)
async function getDashboardStats(req,res){
    try{
        const [revenueResult] = await pool.query('SELECT SUM(order_total) as total_revenue FROM shop_orders WHERE payment_status = "Paid"');

        const [ordersResult] = await pool.query('SELECT COUNT(*) as total_orders FROM shop_orders');

        const [usersResult] = await pool.query('SELECT COUNT(*) as total_users FROM users');

        const [productsResult] = await pool.query('SELECT COUNT(*) as total_products FROM products');

        res.status(200).json({
            Data: {
                total_revenue: parseFloat(revenueResult[0].total_revenue) || 0,
                total_orders: ordersResult[0].total_orders ,
                total_users: usersResult[0].total_users ,
                total_products: productsResult[0].total_products
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching Dashboard Stats:', error);
        res.status(500).json({Error:'Error Fetching Dashboard Stats'});
    }
};

//Get All orders (Admin only)
async function getAllOrdersAdmin(req,res){
    try{
        const {page = 1, limit = 15, statusId} = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];

        if (statusId) {
            whereClause = 'WHERE so.order_status_id = ? ';
            queryParams.push(statusId);
        }
        
        const [orders] = await pool.query(`
            SELECT so.shop_order_id, so.order_date, so.order_total, so.payment_status, os.status as order_status, u.firstName, u.lastName, u.email
            FROM shop_orders so
            JOIN order_status os ON so.order_status_id = os.order_status_id
            JOIN users u ON so.user_id = u.user_id
            ${whereClause}
            ORDER BY so.order_date DESC
            LIMIT ? OFFSET ?`, [...queryParams, parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM shop_orders so ${whereClause}`, queryParams);

        res.status(200).json({
            Data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total / limit),
                    totalOrders: countResult[0].total
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching All Orders:', error);
        res.status(500).json({Error:'Error Fetching All Orders'});
    }
};

//Get All Users (Admin only)
async function getAllUsersAdmin(req,res){
    try{
        const {page = 1, limit = 15} = req.query;
        const offset = (page - 1) * limit;

        const [users] = await pool.query(`
            SELECT u.user_id, u.firstName, u.lastName, u.email, u.phoneNumber, u.created_at, r.role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?`, [parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');

        res.status(200).json({
            Data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total / limit),
                    totalUsers: countResult[0].total
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching All Users:', error);
        res.status(500).json({Error:'Error Fetching All Users'});
    }
};

// Update User Role (Admin only)
async function updateUserRole(req,res){
    try{
        const {userId} = req.params;
        const {roleId} = req.body;

        if(!roleId){
            return res.status(400).json({Message: 'Role ID is required'});
        }
        const [updateRole] = await pool.query('UPDATE users SET role_id = ? WHERE user_id = ?', [roleId, userId]);
        if(updateRole.affectedRows === 0){
            return res.status(404).json({Message: 'User not found'});
        }
        res.status(200).json({Message: 'User role updated successfully'});
    }
    catch(error){
        console.error('ERROR Updating User Role:', error);
        res.status(500).json({Error:'Error Updating User Role'});
    }
};

//Delete User (Admin only)
async function deleteUserAdmin(req,res){
    try{
        const {userId} = req.params;
        const [deleteUser] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
        if(deleteUser.affectedRows === 0){
            return res.status(404).json({Message: 'User not found'});
        }
        res.status(200).json({Message: 'User deleted successfully'});
    }
    catch(error){
        console.error('ERROR Deleting User:', error);
        res.status(500).json({Error:'Error Deleting User'});
    }
};

// Get Sales Analytics (Admin only)
async function getSalesAnalytics(req,res){
    try{
        const {startDate, endDate, timeframe = '7d'} = req.query;
        let dateFilter = '';
        const queryParams = [];

        if(startDate && endDate){
            dateFilter = 'AND order_date BETWEEN ? AND ? ';
            queryParams.push(startDate, endDate);
        }else {
            let timeframeCondition = {
                "24h": "1 DAY",
                "7d": "7 DAY",
                "30d": "30 DAY",
                "3m": "3 MONTH",
                "6m": "6 MONTH",
                "1y": "1 YEAR"
            };
            const interval = timeframeCondition[timeframe] || '7 DAY';
            dateFilter = `AND order_date >= NOW() - INTERVAL ${interval} `;
        }

        const query = `
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as orders_count,
                SUM(order_total) as daily_revenue
            FROM shop_orders
            WHERE payment_status = 'Paid' 
            ${dateFilter}
            GROUP BY date
            ORDER BY date ASC
        `;

        const [salesData] = await pool.query(query, queryParams);

        res.status(200).json({Data: salesData});
    }  
    catch(error){
        console.error('ERROR Fetching Sales Analytics:', error);
        res.status(500).json({Error:'Error Fetching Sales Analytics'});
    }
};

// WISHLIST MANAGEMENT FUNCTIONS
// ADD Product to Wishlist
async function addToWishlist(req,res){
    try{
        const {productId} = req.body;
        const user_id = req.user.user_id;
        
        const [product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [productId]);

        if(product.length === 0){
            return res.status(404).json({Message: 'Product not found'});
        }

        let [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);

        let wishlistId;
        if(wishlist.length === 0){
            const [newWishlist] = await pool.query('INSERT INTO wishlist (user_id) VALUES (?)', [user_id]);
            wishlistId = newWishlist.insertId;
        }else{
            wishlistId = wishlist[0].wishlist_id;
        }
        // Check if product already in wishlist
        const [existingItem] = await pool.query('SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wishlistId, productId]);
        if(existingItem.length > 0){
            return res.status(409).json({Message: 'Product already in wishlist'});
        }
        // Add product to wishlist
        await pool.query('INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)', [wishlistId, productId]);
        res.status(201).json({
            Message: 'Product added to wishlist',
            Data: {
                wishlistId,
                productId: parseInt(productId)
            }
        });
    }
    catch(error){
        console.error('ERROR Adding to Wishlist:', error);
        res.status(500).json({Error:'Error Adding to Wishlist'});
    }
};

//Remove Product from Wishlist
async function removeFromWishlist(req,res){
    try{
        const {productId} = req.params;
        const user_id = req.user.user_id;

        // Get Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if(wishlist.length === 0){
            return res.status(404).json({Message: 'Wishlist not found'});
        }

        const wishlistId = wishlist[0].wishlist_id;
        
        //Remove Item
        const [deleteItem] = await pool.query('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wishlistId, productId]);
        if(deleteItem.affectedRows === 0){
            return res.status(404).json({Message: 'Product not found in wishlist'});
        }
        res.status(200).json({
            Message: 'Product removed from wishlist',
            Data: {
                productId: parseInt(productId)
            }
        });
    }
    catch(error){
        console.error('ERROR Removing from Wishlist:', error);
        res.status(500).json({Error:'Error Removing from Wishlist'});
    }
};

//Get User's Wishlist
async function getUserWishlist(req,res){
    try{
        const user_id = req.user.user_id;
        const {page = 1, limit = 10} = req.query;
        const offset = (page - 1) * limit;

        // Get Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if(wishlist.length === 0){
            return res.status(200).json({
                Data: {
                    items: [],
                    count: 0,
                    pagination: {
                        currentPage: parseInt(page),
                        pageSize: parseInt(limit),
                        totalPages: 0,
                        totalItems: 0
                    }
                }
            });
        }

        const wishlistId = wishlist[0].wishlist_id;

        // Get Wishlist Items
        const [items] = await pool.query(`
            SELECT wi.wishlist_item_id, wi.product_id, p.productname, p.description, 
                p.product_image, c.name as category_name,
                MIN(pi.price) as min_price, MAX(pi.price) as max_price,
                SUM(pi.qty_in_stock) as total_stock, 
                 wCOUNT(DISTINCT pi.product_item_id) as variants_count,
                CASE
                    WHEN SUM(pi.qty_in_stock) > 0 THEN 'In Stock'
                    ELSE 'Out of Stock'
                END as stock_status
            FROM wishlist_items wi
            JOIN products p ON wi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE wi.wishlist_id = ? 
            GROUP BY wi.wishlist_item_id, wi.product_id, p.productname, p.description, p.product_image, c.name
            ORDER BY wi.wishlist_item_id DESC
            LIMIT ? OFFSET ?`, [wishlistId, parseInt(limit), parseInt(offset)]);
        const [totalCount] = await pool.query('SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = ?', [wishlistId]);

        res.status(200).json({
            Data: {
                items,
                count: totalCount[0].count,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    totalPages: Math.ceil(totalCount[0].count / limit),
                    totalItems: totalCount[0].count
                }
            }
        });
    }
    catch(error){
        console.error('ERROR Fetching Wishlist:', error);
        res.status(500).json({Error:'Error Fetching Wishlist'});
    }
};

// Clear Entire Wishlist
async function clearWishlist(req,res){
    try{
        const user_id = req.user.user_id;

        //Get User's Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if(wishlist.length === 0){
            return res.status(404).json({Message: 'Wishlist not found'});
        }
        const wishlistId = wishlist[0].wishlist_id;

        //Get Count of items Before Clearing
        const [countBefore] = await pool.query('SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = ?', [wishlistId]);

        //Delete Wishlist Items
        await pool.query('DELETE FROM wishlist_items WHERE wishlist_id = ?', [wishlistId]);

        res.status(200).json({
            Message: 'Wishlist cleared successfully',
            Data: {
                itemCount: countBefore[0].count
            }
        });
    }
    catch(error){
        console.error('ERROR Clearing Wishlist:', error);
        res.status(500).json({Error:'Error Clearing Wishlist'});
    }
};

// Check Wishlist Status of a Product
async function checkWishlistStatus(req,res){
    try{
        const user_id = req.user.user_id;
        const {productId} = req.params;

        //Get User's Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        
        if(wishlist.length === 0){
            return res.status(200).json({
                Data: {
                    inWishlist: false,
                    productId: parseInt(productId)
                }
            });
        }
        const wishlistId = wishlist[0].wishlist_id;

        //Check if Product in Wishlist
        const [item] = await pool.query('SELECT wishlist_item_id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wishlistId, productId]);

        res.status(200).json({
            Data: {
                inWishlist: item.length > 0,
                productId: parseInt(productId),
                wishlistItemId: item.length > 0 ? item[0].wishlist_item_id : null
            }
        });
    }
    catch(error){
        console.error('ERROR Checking Wishlist Status:', error);
        res.status(500).json({Error:'Error Checking Wishlist Status'});
    }
};

//Move Wishlist Items to Cart
async function moveWishlistToCart(req,res){
    let connection;
    try{
        const user_id = req.user.user_id;
        const {items} = req.body; // Array of productIds to move

        if(!Array.isArray(items) || items.length === 0){
            return res.status(400).json({Message: 'Items array is required'});
        }
        connection = await pool.getConnection();
        await connection.beginTransaction();

        //Get User's Wishlist
        const [wishlist] = await connection.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if(wishlist.length === 0){
            await connection.rollback();
            return res.status(404).json({Message: 'Wishlist not found'});
        }
        const wishlistId = wishlist[0].wishlist_id;

        //Get or Create User's Cart
        let [cart] = await connection.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        let cartId;
        if(cart.length === 0){
            const [newCart] = await connection.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            cartId = newCart.insertId;
        }
        else{
            cartId = cart[0].cart_id;
        }
        const successfulMoves = [];
        const failedMoves = [];

        //Move Items from Wishlist to Cart
        for(const item of items){
            const {productId, productItemId, quantity = 1} = item;

            try{
                const [wishlistItem] = await connection.query('SELECT * FROM wishlist WHERE wishlist_id = ? AND product_id = ?', [wishlistId, productId]);
                if(wishlistItem.length === 0){
                    failedMoves.push({productId, reason: 'Not found in wishlist'});
                    continue;
                }
                // Check product item stock
                const [productItem] = await connection.query('SELECT qty_in_stock FROM product_item WHERE product_item_id = ?', [productItemId]);
                if(productItem[0].qty_in_stock < quantity){
                    failedMoves.push({productId, reason: 'Insufficient stock'});
                    continue;
                }
                if(productItem.length === 0){
                    failedMoves.push({productId, reason: 'Product variant not found'});
                    continue;
                }

                // Check if item in cart already
                const [existingCartItem] = await connection.query('SELECT cart_item_id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
                if(existingCartItem.length > 0){
                    // Update quantity in cart
                    const newQty = existingCartItem[0].qty + quantity;
                    await connection.query('UPDATE cart_items SET qty = ? WHERE cart_item_id = ?', [newQty, existingCartItem[0].cart_item_id]);
                }
                else{
                    // Add new item to cart
                    await connection.query('INSERT INTO cart_items (cart_id, product_item_id, qty) VALUES (?, ?, ?)', [cartId, productItemId, quantity]);
                }
                // Remove item from wishlist
                await connection.query('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wishlistId, productId]);
                successfulMoves.push({
                    productId: parseInt(productId), 
                    productItemId: parseInt(productItemId), 
                    quantity: quantity
                });
            }    
            catch(ItemError){
                failedMoves.push({productId, reason: ItemError.message});
            }
        }

        await connection.commit();
        res.status(200).json({
            Message: `Moved ${successfulMoves.length} items to cart successfully`, 
            Data: {
                successful: successfulMoves,
                failed: failedMoves,
                successCount: successfulMoves.length,
                failedCount: failedMoves.length
            }
        });
    }
    catch(error){
        console.error('ERROR Moving Wishlist Items to Cart:', error);
        res.status(500).json({Error:'Error Moving Wishlist Items to Cart'});
    }
};

//SHIPPING MANAGEMENT FUNCTIONS

// 1. Australia Post API Integration Helper
async function calculateAustraliaPostRates(fromPostcode, toPostcode, weight, length = 10, width = 10, height = 10) {
    try {
        const apiKey = process.env.AUSPOST_API_KEY;
        if (!apiKey) {
            console.log('Australia Post API key not configured, using manual calculation');
            return null;
        }

        const url = new URL('https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json');
        url.searchParams.append('from_postcode', fromPostcode);
        url.searchParams.append('to_postcode', toPostcode);
        url.searchParams.append('length', length);
        url.searchParams.append('width', width);
        url.searchParams.append('height', height);
        url.searchParams.append('weight', weight);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'AUTH-KEY': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Australia Post API error: ${response.status}`);
        }

        const data = await response.json();
        return data.postage_result?.costs || [];
    } catch (error) {
        console.error('Australia Post API Error:', error);
        return null;
    }
}

// 2. Get Shipping Options for Cart (Essential Function 1)
async function getShippingOptionsForCart(req, res) {
    try {
        const { 
            cartTotal, 
            weight = 1, 
            country = 'Australia',
            postcode,
            fromPostcode = '3000' // Your store postcode
        } = req.query;

        if (!cartTotal) {
            return res.status(400).json({ Message: 'Cart total is required' });
        }

        // Get base shipping methods from database
        const [methods] = await pool.query(`
            SELECT shipping_method_id, name, price 
            FROM shipping_method 
            ORDER BY price ASC
        `);

        let shippingOptions = [];

        // If domestic Australia and postcode provided, try Australia Post API
        if (country.toLowerCase() === 'australia' && postcode && fromPostcode) {
            const ausPostRates = await calculateAustraliaPostRates(
                fromPostcode, 
                postcode, 
                weight
            );

            if (ausPostRates && ausPostRates.length > 0) {
                // Map Australia Post services to our shipping methods
                shippingOptions = ausPostRates.map((rate, index) => {
                    const baseMethod = methods[index] || methods[0];
                    
                    return {
                        methodId: baseMethod.shipping_method_id,
                        name: rate.option || baseMethod.name,
                        originalPrice: parseFloat(rate.cost),
                        finalPrice: parseFloat(rate.cost),
                        isFree: false,
                        estimatedDays: rate.option?.includes('Express') ? 1 : 
                                     rate.option?.includes('Priority') ? 2 : 5,
                        estimatedDeliveryDate: new Date(Date.now() + 
                            (rate.option?.includes('Express') ? 1 : 5) * 24 * 60 * 60 * 1000
                        ).toISOString().split('T')[0],
                        serviceCode: rate.option,
                        apiSource: 'australia_post'
                    };
                });
            }
        }

        // Fallback to manual calculation if API fails or international
        if (shippingOptions.length === 0) {
            shippingOptions = methods.map(method => {
                let shippingCost = parseFloat(method.price);
                let estimatedDays = 5;

                // Apply manual rules
                if (method.name.toLowerCase().includes('express')) {
                    shippingCost *= 1.5;
                    estimatedDays = 1;
                } else if (method.name.toLowerCase().includes('priority')) {
                    shippingCost *= 1.2;
                    estimatedDays = 2;
                }

                // International shipping
                if (country.toLowerCase() !== 'australia') {
                    shippingCost *= 2;
                    estimatedDays += 7;
                }

                return {
                    methodId: method.shipping_method_id,
                    name: method.name,
                    originalPrice: parseFloat(method.price),
                    finalPrice: Math.round(shippingCost * 100) / 100,
                    isFree: false,
                    estimatedDays,
                    estimatedDeliveryDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    apiSource: 'manual'
                };
            });
        }

        // Apply free shipping threshold
        const freeShippingThreshold = 100;
        if (parseFloat(cartTotal) >= freeShippingThreshold && country.toLowerCase() === 'australia') {
            shippingOptions = shippingOptions.map(option => ({
                ...option,
                finalPrice: 0,
                isFree: true,
                freeShippingApplied: true
            }));
        }

        res.status(200).json({
            Data: {
                shippingOptions,
                freeShippingThreshold,
                cartTotal: parseFloat(cartTotal),
                qualifiesForFreeShipping: parseFloat(cartTotal) >= freeShippingThreshold && country.toLowerCase() === 'australia',
                apiUsed: shippingOptions[0]?.apiSource || 'manual'
            }
        });
    } catch (error) {
        console.error('ERROR Getting Shipping Options:', error);
        res.status(500).json({ Error: 'Error Getting Shipping Options' });
    }
}

// 3. Create Shipping Label (Essential Function 2)
async function createShippingLabel(req, res) {
    try {
        const { orderId } = req.params;
        const { 
            shippingService = 'standard',
            weight = 1,
            dimensions = { length: 10, width: 10, height: 10 }
        } = req.body;

        // Get order details
        const [order] = await pool.query(`
            SELECT 
                so.shop_order_id,
                so.order_total,
                so.shipping_method_id,
                sm.name as shipping_method,
                sm.price as shipping_cost,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNumber,
                a.address_line1,
                a.address_line2,
                a.postcode,
                a.states,
                a.country
            FROM shop_orders so
            JOIN shipping_method sm ON so.shipping_method_id = sm.shipping_method_id
            JOIN users u ON so.user_id = u.user_id
            JOIN address a ON so.shipping_address_id = a.address_id
            WHERE so.shop_order_id = ?
        `, [orderId]);

        if (order.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        const orderData = order[0];
        const trackingNumber = `GM${Date.now()}${orderId}`;

        // Get real shipping cost if domestic
        let actualShippingCost = orderData.shipping_cost;
        let estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        if (orderData.country.toLowerCase() === 'australia' && orderData.postcode) {
            const ausPostRates = await calculateAustraliaPostRates(
                '3000', // Your store postcode
                orderData.postcode,
                weight,
                dimensions.length,
                dimensions.width,
                dimensions.height
            );

            if (ausPostRates && ausPostRates.length > 0) {
                const selectedRate = ausPostRates.find(rate => 
                    rate.option?.toLowerCase().includes(shippingService.toLowerCase())
                ) || ausPostRates[0];

                actualShippingCost = parseFloat(selectedRate.cost);
                estimatedDelivery = new Date(Date.now() + 
                    (selectedRate.option?.includes('Express') ? 1 : 5) * 24 * 60 * 60 * 1000);
            }
        }

        // Create shipping label data
        const shippingLabel = {
            trackingNumber,
            orderId: orderData.shop_order_id,
            
            // Sender details (your jewelry store)
            sender: {
                name: 'Goldmarks Jewelry Store',
                address: '123 Collins Street',
                city: 'Melbourne',
                state: 'VIC',
                postcode: '3000',
                country: 'Australia',
                phone: '+61 3 9000 0000'
            },
            
            // Recipient details
            recipient: {
                name: `${orderData.firstName} ${orderData.lastName}`,
                address: orderData.address_line1,
                address2: orderData.address_line2,
                city: orderData.states,
                postcode: orderData.postcode,
                country: orderData.country,
                phone: orderData.phoneNumber,
                email: orderData.email
            },
            
            // Shipping details
            shipping: {
                service: shippingService,
                method: orderData.shipping_method,
                cost: actualShippingCost,
                weight: weight,
                dimensions: dimensions,
                estimatedDelivery: estimatedDelivery.toISOString().split('T')[0]
            },
            
            // Label details
            createdAt: new Date().toISOString(),
            status: 'created',
            carrier: 'Australia Post',
            
            // Label data for printing
            labelData: {
                orderNumber: `#${orderId}`,
                trackingBarcode: trackingNumber,
                serviceType: shippingService,
                postageAmount: actualShippingCost
            }
        };

        // Update order with tracking information
        await pool.query(`
            UPDATE shop_orders 
            SET tracking_number = ?, order_status_id = 3, actual_shipping_cost = ?
            WHERE shop_order_id = ?
        `, [trackingNumber, actualShippingCost, orderId]);

        res.status(201).json({
            Message: 'Shipping label created successfully',
            Data: shippingLabel
        });
    } catch (error) {
        console.error('ERROR Creating Shipping Label:', error);
        res.status(500).json({ Error: 'Error Creating Shipping Label' });
    }
}

// 4. Track Order with Label Info (Essential Function 3)
async function trackOrderWithLabel(req, res) {
    try {
        const { trackingNumber } = req.params;

        const [order] = await pool.query(`
            SELECT 
                so.shop_order_id,
                so.order_date,
                so.tracking_number,
                so.order_status_id,
                so.actual_shipping_cost,
                os.status as order_status,
                sm.name as shipping_method,
                u.firstName,
                u.lastName,
                u.email,
                a.address_line1,
                a.postcode,
                a.states,
                a.country
            FROM shop_orders so
            JOIN order_status os ON so.order_status_id = os.order_status_id
            JOIN shipping_method sm ON so.shipping_method_id = sm.shipping_method_id
            JOIN users u ON so.user_id = u.user_id
            JOIN address a ON so.shipping_address_id = a.address_id
            WHERE so.tracking_number = ?
        `, [trackingNumber]);

        if (order.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        const orderData = order[0];

        // Enhanced status mapping
        const statusInfo = {
            1: { 
                status: 'Processing', 
                description: 'Your jewelry order is being carefully prepared',
                icon: '📦'
            },
            2: { 
                status: 'Paid', 
                description: 'Payment confirmed, preparing for shipment',
                icon: '💳'
            },
            3: { 
                status: 'Shipped', 
                description: 'Your jewelry has been shipped via Australia Post',
                icon: '🚚'
            },
            4: { 
                status: 'Delivered', 
                description: 'Your jewelry order has been delivered',
                icon: '✅'
            }
        };

        const currentStatus = statusInfo[orderData.order_status_id] || 
                            { status: 'Unknown', description: 'Status unknown', icon: '❓' };

        res.status(200).json({
            Data: {
                trackingNumber,
                orderId: orderData.shop_order_id,
                orderDate: orderData.order_date,
                
                customer: {
                    name: `${orderData.firstName} ${orderData.lastName}`,
                    email: orderData.email
                },
                
                shipping: {
                    method: orderData.shipping_method,
                    cost: orderData.actual_shipping_cost || 0,
                    destination: {
                        address: orderData.address_line1,
                        postcode: orderData.postcode,
                        state: orderData.states,
                        country: orderData.country
                    }
                },
                
                status: {
                    current: currentStatus.status,
                    description: currentStatus.description,
                    icon: currentStatus.icon
                },
                
                timeline: [
                    { 
                        status: 'Order Placed', 
                        date: orderData.order_date,
                        completed: true,
                        icon: '🛍️',
                        description: 'Jewelry order successfully placed'
                    },
                    { 
                        status: 'Payment Confirmed', 
                        date: orderData.order_status_id >= 2 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 2,
                        icon: '💳',
                        description: 'Payment processed successfully'
                    },
                    { 
                        status: 'Shipped', 
                        date: orderData.order_status_id >= 3 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 3,
                        icon: '🚚',
                        description: 'Package shipped with Australia Post'
                    },
                    { 
                        status: 'Delivered', 
                        date: orderData.order_status_id >= 4 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 4,
                        icon: '✅',
                        description: 'Jewelry delivered to your address'
                    }
                ]
            }
        });
    } catch (error) {
        console.error('ERROR Tracking Order:', error);
        res.status(500).json({ Error: 'Error Tracking Order' });
    }
};

// SHIPPING ADDRESS MANAGEMENT FUNCTIONS

//  Get User's Shipping Addresses
async function getUserShippingAddresses(req, res) {
    try {
        const user_id = req.user.user_id;
        
        const [addresses] = await pool.query(`
            SELECT 
                a.address_id,
                a.address_line1,
                a.address_line2,
                a.postcode,
                a.states,
                a.country,
                ua.is_default,
                COUNT(so.shop_order_id) as order_count
            FROM user_address ua
            JOIN address a ON ua.address_id = a.address_id
            LEFT JOIN shop_orders so ON a.address_id = so.shipping_address_id
            WHERE ua.user_id = ?
            GROUP BY a.address_id, a.address_line1, a.address_line2, a.postcode, a.states, a.country, ua.is_default
            ORDER BY ua.is_default DESC, order_count DESC
        `, [user_id]);

        res.status(200).json({
            Data: {
                addresses,
                count: addresses.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Shipping Addresses:', error);
        res.status(500).json({ Error: 'Error Fetching Shipping Addresses' });
    }
}

//Add New Shipping Address
async function addShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { 
            address_line1, 
            address_line2, 
            postcode, 
            states, 
            country, 
            is_default = false 
        } = req.body;

        if (!address_line1 || !postcode || !states || !country) {
            return res.status(400).json({ 
                Message: 'Address line 1, postcode, state, and country are required' 
            });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // If setting as default, remove default from other addresses
            if (is_default) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                    [user_id]
                );
            }

            // Create new address
            const [addressResult] = await connection.query(`
                INSERT INTO address (address_line1, address_line2, postcode, states, country)
                VALUES (?, ?, ?, ?, ?)
            `, [address_line1, address_line2, postcode, states, country]);

            // Link to user
            await connection.query(`
                INSERT INTO user_address (user_id, address_id, is_default)
                VALUES (?, ?, ?)
            `, [user_id, addressResult.insertId, is_default ? 1 : 0]);

            await connection.commit();

            res.status(201).json({
                Message: 'Shipping address added successfully',
                Data: {
                    address_id: addressResult.insertId,
                    address_line1,
                    address_line2,
                    postcode,
                    states,
                    country,
                    is_default
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Adding Shipping Address:', error);
        res.status(500).json({ Error: 'Error Adding Shipping Address' });
    }
}

// Update Shipping Address
async function updateShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;
        const { 
            address_line1, 
            address_line2, 
            postcode, 
            states, 
            country, 
            is_default 
        } = req.body;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id 
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // If setting as default, remove default from other addresses
            if (is_default) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                    [user_id]
                );
                await connection.query(
                    'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                    [user_id, addressId]
                );
            }

            // Update address details
            const updateFields = {};
            if (address_line1) updateFields.address_line1 = address_line1;
            if (address_line2 !== undefined) updateFields.address_line2 = address_line2;
            if (postcode) updateFields.postcode = postcode;
            if (states) updateFields.states = states;
            if (country) updateFields.country = country;

            if (Object.keys(updateFields).length > 0) {
                await connection.query(
                    'UPDATE address SET ? WHERE address_id = ?',
                    [updateFields, addressId]
                );
            }

            await connection.commit();

            res.status(200).json({
                Message: 'Shipping address updated successfully',
                Data: {
                    address_id: parseInt(addressId),
                    ...updateFields,
                    is_default
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Updating Shipping Address:', error);
        res.status(500).json({ Error: 'Error Updating Shipping Address' });
    }
}

// Delete Shipping Address
async function deleteShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id, ua.is_default
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        // Check if address is used in any orders
        const [orders] = await pool.query(
            'SELECT COUNT(*) as order_count FROM shop_orders WHERE shipping_address_id = ?',
            [addressId]
        );

        if (orders[0].order_count > 0) {
            return res.status(400).json({ 
                Message: 'Cannot delete address that has been used in orders' 
            });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Remove user-address link
            await connection.query(
                'DELETE FROM user_address WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            // Delete address
            await connection.query('DELETE FROM address WHERE address_id = ?', [addressId]);

            // If this was default address, make another one default
            if (userAddress[0].is_default) {
                const [remainingAddresses] = await connection.query(`
                    SELECT ua.address_id 
                    FROM user_address ua 
                    WHERE ua.user_id = ? 
                    LIMIT 1
                `, [user_id]);

                if (remainingAddresses.length > 0) {
                    await connection.query(
                        'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                        [user_id, remainingAddresses[0].address_id]
                    );
                }
            }

            await connection.commit();

            res.status(200).json({ Message: 'Shipping address deleted successfully' });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Deleting Shipping Address:', error);
        res.status(500).json({ Error: 'Error Deleting Shipping Address' });
    }
}

// 5. Set Default Shipping Address
async function setDefaultShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id 
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Remove default from all addresses
            await connection.query(
                'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                [user_id]
            );

            // Set this address as default
            await connection.query(
                'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            await connection.commit();

            res.status(200).json({
                Message: 'Default shipping address updated successfully',
                Data: {
                    address_id: parseInt(addressId),
                    is_default: true
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Setting Default Shipping Address:', error);
        res.status(500).json({ Error: 'Error Setting Default Shipping Address' });
    }
}

// 6. Validate Shipping Address (with Australia Post)
async function validateShippingAddress(req, res) {
    try {
        const { postcode, country = 'Australia' } = req.body;

        if (!postcode) {
            return res.status(400).json({ Message: 'Postcode is required' });
        }

        let isValid = true;
        let localities = [];
        let validationSource = 'manual';

        // If Australian postcode and API available, validate with Australia Post
        if (country.toLowerCase() === 'australia' && process.env.AUSPOST_API_KEY) {
            try {
                const response = await fetch(`https://digitalapi.auspost.com.au/postcode/search.json?q=${postcode}`, {
                    headers: {
                        'AUTH-KEY': process.env.AUSPOST_API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    localities = data.localities?.locality || [];
                    isValid = localities.length > 0;
                    validationSource = 'australia_post';
                }
            } catch (error) {
                console.error('Australia Post validation error:', error);
                // Fall back to basic validation
            }
        }

        // Basic validation for Australian postcodes
        if (country.toLowerCase() === 'australia' && validationSource === 'manual') {
            isValid = /^[0-9]{4}$/.test(postcode) && 
                     parseInt(postcode) >= 800 && 
                     parseInt(postcode) <= 9999;
        }

        res.status(200).json({
            Data: {
                postcode,
                country,
                isValid,
                localities: localities.slice(0, 5), // Limit results
                validationSource,
                suggestions: isValid ? localities.map(loc => ({
                    suburb: loc.name,
                    state: loc.state,
                    postcode: loc.postcode
                })) : []
            }
        });
    } catch (error) {
        console.error('ERROR Validating Shipping Address:', error);
        res.status(500).json({ Error: 'Error Validating Shipping Address' });
    }
};

// PROMOTION/DISCOUNT SYSTEM

// Get all active promotions
async function getActivePromotions(req,res) {
    try{
        const [promotions] = await pool.query(`
            SELECT * FROM promotion 
            WHERE is_active = TRUE 
                AND (start_date IS NULL OR start_date <= NOW()) 
                AND (end_date IS NULL OR end_date >= NOW())
            ORDER BY discount_rate DESC
        `);
        res.status(200).json({
            Message: 'Active promotions retrieved successfully',
            promotions: promotions
        });
    }
    catch(error) {
        console.error("ERROR Fetching Promotions:", error);
        res.status(500).json({Message: 'Error fetching promotions'});
    }
};

// Validate promotion code
async function validatePromotionCode(req,res) {
    try{
        const { promotionCode, userId, cartTotal, cartItems } = req.body;
        
        if(!promotionCode || !userId || !cartTotal) {
            return res.status(400).json({Message: 'Missing required fields'});
        }

        const validation = await checkPromotionValidity(promotionCode, userId, cartTotal, cartItems);
        res.status(200).json(validation);
    }
    catch(error) {
        console.error("ERROR Validating Promotion:", error);
        res.status(500).json({Message: 'Error validating promotion'});
    }
};

// Apply promotion to order
async function applyPromotionToOrder(req,res) {
    try{
        const { promotionCode, orderId } = req.body;
        const userId = req.user?.user_id;
        
        if(!promotionCode || !userId || !orderId) {
            return res.status(400).json({Message: 'Missing required fields'});
        }
        // CHECK for user authentication
        const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if(userCheck[0].length === 0) {
            return res.status(401).json({Message: 'User not authenticated'});
        }

        const result = await processPromotionApplication(promotionCode, userId, orderId);
        res.status(200).json(result);
    }
    catch(error) {
        console.error("ERROR Applying Promotion:", error);
        res.status(500).json({Message: 'Error applying promotion'});
    }
};

// Admin: Create new promotion
async function createPromotion(req,res) {
    try{
        const {
            name, description, discountRate, discountType, promotionCode,
            startDate, endDate, minimumOrderValue, usageLimit,applicableCategories
        } = req.body;
        
        if(!name || !discountRate || !promotionCode) {
            return res.status(400).json({Message: 'Missing required fields'});
        }

        const [existingPromotion] = await pool.query('SELECT promotion_id FROM promotion WHERE promotion_code = ?', [promotionCode]);
        
        if(existingPromotion.length > 0) {
            return res.status(400).json({Message: 'Promotion code already exists'});
        }

        const [newPromotion] = await pool.query(`
            INSERT INTO promotion (
                name, description, discount_rate, discount_type, promotion_code,
                start_date, end_date, minimum_order_value, usage_limit, 
                applicable_categories, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
            name, description, discountRate, discountType || 'percentage', promotionCode,
            startDate, endDate, minimumOrderValue || 0, usageLimit, applicableCategories ? JSON.stringify(applicableCategories) : null
        ]);
        
        res.status(201).json({ 
            Message: 'Promotion created successfully',
            promotionId: newPromotion.insertId
        });
    }
    catch(error) {
        console.error("ERROR Creating Promotion:", error);
        res.status(500).json({Message: 'Error creating promotion'});
    }
};

// Admin: Update promotion
async function updatePromotion(req,res) {
    try{
        const promotionId = req.params.id;
        const {
            name, description, discountRate, discountType,promotionCode,
            startDate, endDate, minimumOrderValue, usageLimit, applicableCategories, isActive
        } = req.body;
        
        const [existingPromotion] = await pool.query(
            'SELECT promotion_id FROM promotion WHERE promotion_id = ?', 
            [promotionId]
        );
        
        if(existingPromotion.length === 0) {
            return res.status(404).json({Message: 'Promotion not found'});
        }

        await pool.query(`
            UPDATE promotion SET 
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                discount_rate = COALESCE(?, discount_rate),
                discount_type = COALESCE(?, discount_type),
                promotion_code = COALESCE(?, promotion_code),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                minimum_order_value = COALESCE(?, minimum_order_value),
                usage_limit = COALESCE(?, usage_limit),
                applicable_categories = COALESCE(?, applicable_categories),
                is_active = COALESCE(?, is_active)
            WHERE promotion_id = ?
        `, [
            name, description, discountRate, discountType, promotionCode,
            startDate, endDate, minimumOrderValue, usageLimit,
            applicableCategories ? JSON.stringify(applicableCategories) : null, isActive, promotionId
        ]);
        
        res.status(200).json({Message: 'Promotion updated successfully'});
    }
    catch(error) {
        console.error("ERROR Updating Promotion:", error);
        res.status(500).json({Message: 'Error updating promotion'});
    }
};

// Admin: Delete promotion
async function deletePromotion(req,res) {
    try{
        const promotionId = req.params.id;
        
        const [existingPromotion] = await pool.query(
            'SELECT promotion_id FROM promotion WHERE promotion_id = ?', 
            [promotionId]
        );
        
        if(existingPromotion.length === 0) {
            return res.status(404).json({Message: 'Promotion not found'});
        }

        await pool.query('UPDATE promotion SET is_active = FALSE WHERE promotion_id = ?', [promotionId]);
        res.status(200).json({Message: 'Promotion deactivated successfully'});
    }
    catch(error) {
        console.error("ERROR Deactivating Promotion:", error);
        res.status(500).json({Message: 'Error deactivating promotion'});
    }
};

// Get promotion statistics (Admin)
async function getPromotionStats(req,res) {
    try{
        const [stats] = await pool.query(`
            SELECT 
                p.*,
                COALESCE(pu.usage_count, 0) as actual_usage,
                COALESCE(pu.total_discount, 0) as total_discount_given
            FROM promotion p
            LEFT JOIN (
                SELECT 
                    promotion_id,
                    COUNT(*) as usage_count,
                    SUM(
                        CASE 
                            WHEN p2.discount_type = 'percentage' 
                            THEN (so.order_total * p2.discount_rate / 100)
                            ELSE p2.discount_rate
                        END
                    ) as total_discount
                FROM promotion_usage pu2
                JOIN promotion p2 ON pu2.promotion_id = p2.promotion_id
                JOIN shop_orders so ON pu2.order_id = so.shop_order_id
                GROUP BY promotion_id
            ) pu ON p.promotion_id = pu.promotion_id
            ORDER BY p.start_date DESC
        `);
        
        res.status(200).json({
            Message: 'Promotion statistics retrieved successfully',
            stats: stats
        });
    }
    catch(error) {
        console.error("ERROR Fetching Promotion Stats:", error);
        res.status(500).json({Message: 'Error fetching promotion statistics'});
    }
};

//PROMOTION HELPER FUNCTIONS

async function checkPromotionValidity(promotionCode, userId, cartTotal, cartItems = []) {
    try{
        // Get promotion details
        const [promotions] = await pool.query(
            `SELECT * FROM promotion 
             WHERE promotion_code = ? AND is_active = TRUE`,
            [promotionCode]
        );
        
        if(promotions.length === 0) {
            return { valid: false, Message: 'Invalid promotion code' };
        }
        
        const promotion = promotions[0];
        
        // Check if promotion is within date range
        const now = new Date();
        if(promotion.start_date && new Date(promotion.start_date) > now) {
            return { valid: false, Message: 'Promotion has not started yet' };
        }
        
        if(promotion.end_date && new Date(promotion.end_date) < now) {
            return { valid: false, Message: 'Promotion has expired' };
        }
        
        // Check minimum order value
        if(promotion.minimum_order_value && cartTotal < promotion.minimum_order_value) {
            return { 
                valid: false, 
                Message: `Minimum order value of $${promotion.minimum_order_value} required` 
            };
        }
        
        // Check usage limit
        if(promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
            return { valid: false, Message: 'Promotion usage limit reached' };
        }
        
        // Check if user has already used this promotion
        const [userUsage] = await pool.query(
            'SELECT COUNT(*) as count FROM promotion_usage WHERE promotion_id = ? AND user_id = ?',
            [promotion.promotion_id, userId]
        );
        
        if(userUsage[0].count > 0) {
            return { valid: false, Message: 'You have already used this promotion' };
        }
        
        // Check category-specific promotions
        if(promotion.discount_type === 'category_specific' && promotion.applicable_categories) {
            const applicableCategories = JSON.parse(promotion.applicable_categories);
            const hasApplicableItems = cartItems.some(item => 
                applicableCategories.includes(item.category_id)
            );
            
            if(!hasApplicableItems) {
                return { 
                    valid: false, 
                    Message: 'This promotion is not applicable to items in your cart' 
                };
            }
        }
        
        // Calculate discount amount
        let discountAmount = 0;
        if(promotion.discount_type === 'percentage') {
            discountAmount = (cartTotal * promotion.discount_rate) / 100;
        } else if(promotion.discount_type === 'fixed_amount') {
            discountAmount = promotion.discount_rate;
        } else if(promotion.discount_type === 'category_specific') {
            const applicableCategories = JSON.parse(promotion.applicable_categories);
            const applicableItemsTotal = cartItems
                .filter(item => applicableCategories.includes(item.category_id))
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            discountAmount = (applicableItemsTotal * promotion.discount_rate) / 100;
        }
        
        // Ensure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);
        
        return {
            valid: true,
            promotion: promotion,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            finalTotal: parseFloat((cartTotal - discountAmount).toFixed(2)),
            Message: 'Promotion applied successfully'
        };
        
    }
    catch(error) {
        console.error("ERROR Validating Promotion Code:", error);
        return { valid: false, Message: 'Error validating promotion' };
    }
};

async function processPromotionApplication(promotionCode, userId, orderId) {
    const connection = await pool.getConnection();
    
    try{
        await connection.beginTransaction();
        
        // Get promotion details
        const [promotions] = await connection.query(
            'SELECT * FROM promotion WHERE promotion_code = ? AND is_active = TRUE', [promotionCode]
        );
        
        if(promotions.length === 0) {
            throw new Error('Invalid promotion code');
        }
        
        const promotion = promotions[0];
        
        // Update order with promotion
        await connection.query(
            'UPDATE shop_orders SET promotion_id = ? WHERE shop_order_id = ?', [promotion.promotion_id, orderId]
        );
        
        // Record promotion usage
        await connection.query(
            'INSERT INTO promotion_usage (promotion_id, user_id, order_id) VALUES (?, ?, ?)', [promotion.promotion_id, userId, orderId]
        );
        
        // Update promotion usage count
        await connection.query(
            'UPDATE promotion SET usage_count = usage_count + 1 WHERE promotion_id = ?', [promotion.promotion_id]
        );
        
        await connection.commit();
        
        return {

            Message: 'Promotion applied to order successfully',
            promotionName: promotion.name,
            discountRate: promotion.discount_rate
        };
        
    }
    catch(error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
};

// Email Notification Function
async function subscribeBackInStock(req,res) {
    try {
        const user_id = req.user.user_id;
        const { product_id, product_item_id, email_notification = true, sms_notification = false } = req.body;

        if (!product_id) {
            return res.status(400).json({Message: 'Product ID is required'});
        }

        // Get user details
        const [userDetails] = await pool.query(
            'SELECT email, phoneNumber FROM users WHERE user_id = ?',
            [user_id]
        );

        if (userDetails.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        const user = userDetails[0];

        // Check if notification already exists
        const [existing] = await pool.query(
            'SELECT stock_notification_id FROM stock_notification WHERE user_id = ? AND product_id = ? AND (product_item_id = ? OR (product_item_id IS NULL AND ? IS NULL))',
            [user_id, product_id, product_item_id, product_item_id]
        );

        if (existing.length > 0) {
            // Update existing notification
            await pool.query(
                'UPDATE stock_notification SET status = "active", email_notification = ?, sms_notification = ? WHERE stock_notification_id = ?',
                [email_notification, sms_notification, existing[0].stock_notification_id]
            );
        } else {
            // Create new notification
            await pool.query(
                'INSERT INTO stock_notification (user_id, product_id, product_item_id, email, phone, email_notification, sms_notification) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user_id, product_id, product_item_id, user.email, user.phoneNumber, email_notification, sms_notification]
            );
        }

        res.status(201).json({Message: 'Successfully subscribed to back-in-stock notification'});
        
    } catch (error) {
        console.error('ERROR subscribing to back-in-stock notification:', error);
        res.status(500).json({Message: 'Failed to subscribe to notification'});
    }
};

// Unsubscribe from back-in-stock notifications
async function unsubscribeBackInStock(req,res) {
    try {
        const user_id = req.user.user_id;
        const { product_id } = req.params;
        const { product_item_id } = req.query;

        await pool.query(
            'UPDATE stock_notification SET status = "cancelled" WHERE user_id = ? AND product_id = ? AND (product_item_id = ? OR (product_item_id IS NULL AND ? IS NULL))',
            [user_id, product_id, product_item_id, product_item_id]
        );

        res.status(200).json({Message: 'Successfully unsubscribed from back-in-stock notification'});

    } catch (error) {
        console.error('ERROR unsubscribing from back-in-stock notification:', error);
        res.status(500).json({Message: 'Failed to unsubscribe from notification'});
    }
};

// Trigger back-in-stock notifications (called when stock is updated)
async function triggerBackInStockNotifications(product_id, product_item_id = null) {
    try {
        // Get product details
       const productQuery = product_item_id 
        ? `SELECT p.product_id, p.productname, p.product_image, pi.price, pi.qty_in_stock 
            FROM products p JOIN product_item pi ON p.product_id = pi.product_id WHERE p.product_id = ? AND pi.product_item_id = ? `
        : 'SELECT product_id, productname, product_image FROM products WHERE product_id = ?';
        
        const queryParams = product_item_id ? [product_id, product_item_id] : [product_id];
        const [productDetails] = await pool.query(productQuery, queryParams);

        if (productDetails.length === 0 || productDetails[0].qty_in_stock <= 0) {
            return; // Product not found or still out of stock
        }

        const product = productDetails[0];

        // Get all active notifications for this product
        const [notifications] = await pool.query(
            `SELECT sn.*, u.firstName, u.lastName, u.email_notifications, u.sms_notifications 
            FROM stock_notification sn JOIN users u ON sn.user_id = u.user_id WHERE sn.product_id = ? 
            AND (sn.product_item_id = ? OR (sn.product_item_id IS NULL AND ? IS NULL)) 
            AND sn.status = "active"`,
            [product_id, product_item_id, product_item_id]
        );

        // Send notifications to all subscribers
        for (const notification of notifications) {
            try {
                const user = {
                    first_name: notification.firstName,
                    last_name: notification.lastName,
                    email: notification.email,
                    phone: notification.phoneNumber,
                    email_notifications: notification.email_notifications && notification.email_notification,
                    sms_notifications: notification.sms_notifications && notification.sms_notification
                };

                // Send email notification
                if (user.email_notifications) {
                    await notificationService.sendBackInStockEmail(user, product);
                }

                // Send SMS notification
                if (user.sms_notifications && user.phoneNumber) {
                    await notificationService.sendSMS({
                        to: user.phoneNumber,
                        message: `Great news! ${product.productname} is back in stock at Goldmarks Jewellery. Don't miss out - shop now! ${process.env.FRONTEND_URL}/product/${product_id}`
                    });
                }

                // Mark notification as sent
                await pool.query(
                    'UPDATE stock_notification SET status = "notified", notified_at = NOW() WHERE stock_notification_id = ?',
                    [notification.stock_notification_id]
                );

            } catch (notificationError) {
                console.error(`Failed to send back-in-stock notification to user ${notification.user_id}:`, notificationError);
            }
        }

        console.log(`Sent back-in-stock notifications for product ${product_id} to ${notifications.length} users`);

    } catch (error) {
        console.error('Error triggering back-in-stock notifications:', error);
    }
};

// Send promotional campaign
async function sendPromotionalEmail(req,res) {
    try {
        const { title, subject, content, discount_percentage, promo_code, valid_until, target_audience } = req.body;

        if (!title || !subject || !content) {
            return res.status(400).json({Message: 'Title, subject, and content are required'});
        }

        // Get target users based on audience (simplified - no campaign table)
        let userQuery;
        switch (target_audience) {
            case 'all':
                userQuery = 'SELECT user_id, firstName, lastName, email FROM users WHERE marketing_emails = TRUE AND email_notifications = TRUE';
                break;
            case 'customers':
                userQuery = 'SELECT DISTINCT u.user_id, u.firstName, u.lastName, u.email FROM users u JOIN shop_orders so ON u.user_id = so.user_id WHERE u.marketing_emails = TRUE AND u.email_notifications = TRUE';
                break;
            case 'subscribers':
            default:
                userQuery = 'SELECT user_id, firstName, lastName, email FROM users WHERE marketing_emails = TRUE AND email_notifications = TRUE';
                break;
        }

        const [users] = await pool.query(userQuery);

        // Prepare promotion data
        const promotion = {
            title: title,
            subject: subject,
            content: content,
            discount: discount_percentage,
            code: promo_code,
            validUntil: valid_until ? new Date(valid_until).toLocaleDateString() : null,
            ctaUrl: `${process.env.FRONTEND_URL}/shop`,
            ctaText: 'Shop Now'
        };

        // Send emails directly
        const results = await notificationService.sendBulkPromotionalEmails(users, promotion);

        res.status(200).json({
            Message: 'Promotional emails sent successfully',
            results: results
        });

    } catch (error) {
        console.error('ERROR sending promotional emails:', error);
        res.status(500).json({Message: 'Failed to send promotional emails'});
    }
};

// Send promotional email to specific user (for targeted marketing)
async function sendPersonalPromotionalEmail(req,res) {
    try {
        const { user_id } = req.params;
        const { title, subject, content, discount_percentage, promo_code, valid_until } = req.body;

        if (!title || !subject || !content) {
            return res.status(400).json({Message: 'Title, subject, and content are required'});
        }

        // Get user details
        const [userDetails] = await pool.query(
            'SELECT firstName, lastName, email, marketing_emails, email_notifications FROM users WHERE user_id = ?',
            [user_id]
        );

        if (userDetails.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        const user = {
            first_name: userDetails[0].firstName,
            last_name: userDetails[0].lastName,
            email: userDetails[0].email,
            marketing_emails: userDetails[0].marketing_emails,
            email_notifications: userDetails[0].email_notifications
        };

        // Prepare promotion data
        const promotion = {
            title: title,
            subject: subject,
            content: content,
            discount: discount_percentage,
            code: promo_code,
            validUntil: valid_until ? new Date(valid_until).toLocaleDateString() : null,
            ctaUrl: `${process.env.FRONTEND_URL}/shop`,
            ctaText: 'Shop Now'
        };

        // Send promotional email
        const result = await notificationService.sendPromotionalEmail(user, promotion);

        res.status(200).json({
            Message: 'Promotional email sent successfully',
            result: result
        });

    } catch (error) {
        console.error('ERROR sending personal promotional email:', error);
        res.status(500).json({Message: 'Failed to send promotional email'});
    }
};

// Subscribe to newsletter
async function subscribeNewsletter(req,res) {
    try {
        const { email, first_name, last_name } = req.body;

        if (!email) {
            return res.status(400).json({Message: 'Email is required'});
        }

        // Check if user already exists
        const [existing] = await pool.query(
            'SELECT user_id, firstName, lastName, marketing_emails FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            // Update existing user to opt-in to marketing emails
            await pool.query(
                'UPDATE users SET marketing_emails = TRUE WHERE email = ?',
                [email]
            );
        } else {
            // Create new user account (they can set password later)
            await pool.query(
                'INSERT INTO users (firstName, lastName, email, marketing_emails, email_notifications) VALUES (?, ?, ?, TRUE, TRUE)',
                [first_name || 'Valued', last_name || 'Customer', email]
            );
        }

        // Send confirmation email
        const user = {
            first_name: first_name || existing[0]?.firstName || 'Valued Customer',
            email: email,
            email_notifications: true
        };

        try {
            await notificationService.sendNewsletterSubscriptionEmail(user);
            console.log('Newsletter subscription email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send newsletter subscription email:', emailError);
            // Don't fail subscription if email fails
        }

        res.status(201).json({Message: 'Successfully subscribed to newsletter'});

    } catch (error) {
        console.error('ERROR subscribing to newsletter:', error);
        res.status(500).json({Message: 'Failed to subscribe to newsletter'});
    }
};

// Unsubscribe from newsletter (simplified - uses users table)
async function unsubscribeNewsletter(req,res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({Message: 'Email is required'});
        }

        // Update user to opt-out of marketing emails
        await pool.query('UPDATE users SET marketing_emails = FALSE WHERE email = ?', [email]);

        res.status(200).json({Message: 'Successfully unsubscribed from newsletter'});

    } catch (error) {
        console.error('ERROR unsubscribing from newsletter:', error);
        res.status(500).json({Message: 'Failed to unsubscribe from newsletter'});
    }
};

// Get user notification preferences
async function getNotificationPreferences(req,res) {
    try {
        const user_id = req.user.user_id;

        const [preferences] = await pool.query(
            'SELECT email_notifications, sms_notifications, marketing_emails FROM users WHERE user_id = ?',
            [user_id]
        );

        if (preferences.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        res.status(200).json({
            Message: 'Notification preferences retrieved successfully',
            preferences: preferences[0]
        });

    } catch (error) {
        console.error('ERROR getting notification preferences:', error);
        res.status(500).json({Message: 'Failed to get notification preferences'});
    }
};

// Update user notification preferences
async function updateNotificationPreferences(req,res) {
    try {
        const user_id = req.user.user_id;
        const { email_notifications, sms_notifications, marketing_emails } = req.body;

        await pool.query(
            'UPDATE users SET email_notifications = ?, sms_notifications = ?, marketing_emails = ? WHERE user_id = ?',
            [email_notifications, sms_notifications, marketing_emails, user_id]
        );

        res.status(200).json({Message: 'Notification preferences updated successfully'});

    } catch (error) {
        console.error('ERROR updating notification preferences:', error);
        res.status(500).json({Message: 'Failed to update notification preferences'});
    }
};

// Test notification endpoint (for development)
// async function testNotification(req,res) {
//     try {
//         const { type, email, phone } = req.body;
//         const user_id = req.user.user_id;

//         const [userDetails] = await pool.query(
//             'SELECT firstName, lastName, email, phoneNumber, email_notifications, sms_notifications FROM users WHERE user_id = ?',
//             [user_id]
//         );

//         if (userDetails.length === 0) {
//             return res.status(404).json({Message: 'User not found'});
//         }

//         const user = {
//             first_name: userDetails[0].firstName,
//             last_name: userDetails[0].lastName,
//             email: email || userDetails[0].email,
//             phone: phone || userDetails[0].phoneNumber,
//             email_notifications: true,
//             sms_notifications: true,
//             marketing_emails: true
//         };

//         let result;

//         switch (type) {
//             case 'welcome':
//                 result = await notificationService.sendWelcomeEmail(user);
//                 break;
//             case 'promotional':
//                 const promotion = {
//                     title: 'Test Promotion',
//                     subject: 'Test Promotional Email',
//                     content: 'This is a test promotional email to verify the system is working correctly.',
//                     discount: 20,
//                     code: 'TEST20',
//                     validUntil: '2025-12-31',
//                     ctaUrl: process.env.FRONTEND_URL + '/shop',
//                     ctaText: 'Shop Now'
//                 };
//                 result = await notificationService.sendPromotionalEmail(user, promotion);
//                 break;
//             case 'sms':
//                 result = await notificationService.sendSMS({
//                     to: user.phone,
//                     message: 'Test SMS from Goldmarks Jewellery notification system. Everything is working correctly!'
//                 });
//                 break;
//             default:
//                 return res.status(400).json({Message: 'Invalid test type'});
//         }

//         res.status(200).json({Message: 'Test notification sent', result: result});

//     } catch (error) {
//         console.error('ERROR sending test notification:', error);
//         res.status(500).json({Message: 'Failed to send test notification'});
//     }
// };

// 6. API  ROUTES
app.get('/', (req,res) => {
    res.send('Node.js and MYSQL API is running');
});

app.post('/roles', createRoles);
app.delete('/roles/:id', deleteRole);
app.get('/users', getAllUsers);
app.post('/addresses', createAddress);
app.delete('/addresses/:id', deleteAddress);
app.patch('/addresses/:id', updateAddress);
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);
app.get('/users/:id', getUserProfile);

// Stripe webhook route (no authentication needed)
app.post('/webhook/stripe', stripeWebhook);

// Product routes
app.get('/products', getAllProducts);
app.get('/products/:id', getProductById);
app.patch('/products/:id', updateProduct);
app.delete('/products/:id', deleteProduct);

// Category routes
app.get('/categories', getAllCategories);
app.get('/categories/:categoryId/products', getProductByCategory);

// Search and Filter routes
app.get('/products/search', searchProducts);
app.get('/products/filter/price', filterByPriceRange);
app.get('/products/featured', getFeaturedProducts);
app.get('/products/:productId/suggestions', getProductSuggestions);
app.get('/filters', getAvailableFilters);

// Review routes
app.post('/products/:productId/reviews', createProductReview);
app.get('/products/:productId/reviews', getProductReviews);
app.put('/reviews/:reviewId', updateProductReview);
app.delete('/reviews/:reviewId', deleteProductReview);
app.get('/users/reviews', getUserProductReviews);
app.get('/products/:productId/rating', getAverageProductRating);

// Admin routes (should be protected by an isAdmin middleware)
app.get('/admin/dashboard/stats', getDashboardStats);
app.get('/admin/orders', getAllOrdersAdmin);
app.get('/admin/users', getAllUsersAdmin);
app.put('/admin/users/:userId/role', updateUserRole);
app.delete('/admin/users/:userId', deleteUserAdmin);

// Inventory Management routes (Admin only)
app.get('/admin/inventory/stock-levels', getStockLevels);
app.patch('/admin/inventory/products/:productId/stock', updateStock);
app.get('/admin/inventory/low-stock', getLowStockProducts);
app.patch('/admin/inventory/bulk-update', bulkUpdateStock);
app.get('/admin/inventory/products/:productId/movements', getStockMovements);
app.get('/admin/analytics/sales', getSalesAnalytics);

//Wishlist API
app.post('/wishlist', authenticateJWT, addToWishlist);
app.delete('/wishlist/:productId', authenticateJWT, removeFromWishlist);
app.get('/wishlist', authenticateJWT, getUserWishlist);
app.delete('/wishlist', authenticateJWT, clearWishlist);
app.get('/wishlist/check/:productId', authenticateJWT, checkWishlistStatus);
app.post('/wishlist/move-to-cart', authenticateJWT, moveWishlistToCart);

// Essential Shipping API Routes
app.get('/shipping/options', getShippingOptionsForCart);
app.post('/admin/orders/:orderId/ship', authenticateJWT, createShippingLabel);
app.get('/track/:trackingNumber', trackOrderWithLabel);

// Shipping Address Management API Routes
app.get('/shipping/addresses', authenticateJWT, getUserShippingAddresses);
app.post('/shipping/addresses', authenticateJWT, addShippingAddress);
app.put('/shipping/addresses/:addressId', authenticateJWT, updateShippingAddress);
app.delete('/shipping/addresses/:addressId', authenticateJWT, deleteShippingAddress);
app.put('/shipping/addresses/:addressId/default', authenticateJWT, setDefaultShippingAddress);
app.post('/shipping/validate-address', validateShippingAddress);

// CART ROUTES API Routes
app.post('/cart/items', authenticateJWT, addItemToCart);
app.get('/cart', authenticateJWT, getUserCart);
app.patch('/cart/items/:cartItemId', authenticateJWT, updateCartItem);
app.delete('/cart/items/:cartItemId', authenticateJWT, removeCartItem);
app.delete('/cart', authenticateJWT, clearCart);

// PAYMENT & ORDER API Routes
app.post('/payment/process', authenticateJWT, processPayment);
app.post('/orders', authenticateJWT, createOrder);
app.get('/orders', authenticateJWT, getUserOrders);
app.get('/orders/:orderId', authenticateJWT, getOrderById);

// PROMOTION API Routes 
app.get('/api/promotions', getActivePromotions);
app.post('/api/promotions/validate', validatePromotionCode);
app.post('/api/promotions/apply', applyPromotionToOrder);

// Admin API Routes
app.post('/api/admin/promotions', authenticateJWT, authorizeAdminJWT, createPromotion);
app.put('/api/admin/promotions/:id', authenticateJWT, authorizeAdminJWT, updatePromotion);
app.delete('/api/admin/promotions/:id', authenticateJWT, authorizeAdminJWT, deletePromotion);
app.get('/api/admin/promotions/stats', authenticateJWT, authorizeAdminJWT, getPromotionStats);

// Back-in-stock notification routes
app.post('/notifications/back-in-stock', authenticateJWT, subscribeBackInStock);
app.delete('/notifications/back-in-stock/:product_id', authenticateJWT, unsubscribeBackInStock);

// Order status routes (admin only)
app.put('/orders/:order_id/status', authenticateJWT, authorizeAdminJWT, updateOrderStatus);

// Promotional email routes (admin only) - simplified, no campaign tables
app.post('/promotional-emails/send-bulk', authenticateJWT, authorizeAdminJWT, sendPromotionalEmail);
app.post('/promotional-emails/send-personal/:user_id', authenticateJWT, authorizeAdminJWT, sendPersonalPromotionalEmail);

// Newsletter routes (uses users table)
app.post('/newsletter/subscribe', subscribeNewsletter);
app.post('/newsletter/unsubscribe', unsubscribeNewsletter);

// User notification preferences
app.get('/user/notification-preferences', authenticateJWT, getNotificationPreferences);
app.put('/user/notification-preferences', authenticateJWT, updateNotificationPreferences);

// // Test notification (development only)
// app.post('/test-notification', authenticateJWT, testNotification);

//7. RUN
app.listen(3000,()=>{
    console.log(`Server is running on port ${port}`)
});



