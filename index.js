// 1. Import Dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 2. Initialize Express APP
const app = express();
const port = 3000;

// 3. Middleware
app.use(cors());
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
function generateToken(userId, role = 'user'){
    return jwt.sign(
        {userId, role},
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

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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
    if (req.user.role !== 'admin') {
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
            const newToken = generateToken(decoded.userId, decoded.role);
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
        const { firstName, lastName, email, password } = req.body;
        if(!firstName || !lastName || !email || !password) {
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [existingUser] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({Message: 'User already exists'});
        }
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 11;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const [newUser] = await pool.query('INSERT INTO users (firstName,lastName,email,password_hash) VALUES (?,?,?,?)', [firstName, lastName, email, password_hash]);

        res.status(201).json({
            Message: 'User created successfully',
            userId: newUser.insertId,
            user: {
                id: newUser.insertId,
                firstName,
                lastName,
                email,
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
        const {email,password} = req.body

        if(!email || !password) {
            return res.status(400).json({Message: 'Email and Password are required'});
        }
        const [users] = await pool.query(`
            SELECT u.user_id, u.firstName, u.lastName, u.email, u.password_hash, u.roles_id, r.role_name
            FROM users u
            LEFT JOIN roles r ON u.roles_id = r.roles_id
            WHERE u.email = ?`, [email]);

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
        const {product_name, product_description, price} = req.body;

        if(!product_name){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[product] = await pool.query('INSERT INTO products (product_name, product_description) VALUES (?,?)', [product_name, product_description]);
        res.status(201).json({
            Message: 'Product created successfully',
            productId: product.insertId
        });
    }
    catch(error){
        console.error('ERROR Creating Product:', error);
        res.status(500).send('Error Inserting data into the database');
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
            SELECT p.product_id, p.product_name, p.description,p.product_image, p.is_featured, p.created_at, p.updated_at, c.name as category_name, s.name as supplier_name
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
            FROM product_items
            WHERE product_id = ?`, [id]);

        const [variations] = await pool.query(`
            SELECT v.variation_id, v.name, vo.variation_option_id, vo.value
            FROM product_variations pv
            JOIN variations v ON pv.variation_id = v.variation_id
            LEFT JOIN variation_options vo ON v.variation_id = vo.variation_id
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

        if(product.lenth === 0){
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
        const[item]= await pool.query('INSERT INTO product_items (product_id,sku,qty,price) VALUES (?,?,?,?)', [productID,sku,qty,price]);
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
        const {type} = req.body;
        if(!type){
            return res.json(400).json({Message: 'Missing required fields'});
        }
        const[variation] = await pool.query('INSERT INTO variations (type) VALUES (?)', [type]);
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
        const {variationID} = req.params;
        const {option_value} = req.body;
        if(!option_value){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [option] = await pool.query('INSERT INTO variation_options (variation_id,option_value) VALUES (?,?)', [variationID, option_value]);
        res.status(201).json({
            Message: 'Variation Option created successfully',
            optionID: option.insertID
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
            return res.status(400).json({MEssage: 'Missing required fields'});
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
        const { name, parent_category_id } = req.body;
        if(!name){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const[category] = await pool.query('INSERT INTO categories (name,parent_category_id) VALUES (?,?)', [name,parent_category_id]);
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
        const{product_item_id,quantity} = req.body;
        
        if(!product_item_id || !quantity){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        const [carts] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [user_id]);
        let cart_id;

        if(carts.length === 0){
            const[newCart] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            cart_id = newCart.insertId;
        }
        else{
            cart_id = carts[0].cart_id;
        }

        const[existingItem] = await pool.query('SELECT * FROM cart_items WHERE cart_id = ? AND product_item_id = ?', [cart_id, product_item_id]);
        if(existingItem.length === 0){
            await pool.query('INSERT INTO cart_items (cart_id, product_item_id, quantity) VALUES (?,?,?)', [cart_id, product_item_id,quantity]);
            res.status(201).json({Message: 'Item added to cart successfully'});
        }
        else{
            const newQuantity = existingItem[0].quantity + quantity;
            await pool.query('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [newQuantity, existingItem[0].carts_item_id]);
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

        let [carts] = await pool.query('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            const [newCart] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
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
        const[carts] = await pool.query('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
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

        const [carts] = await pool.query('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
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
        const [totals] = await pool.query(get.items, [cart_id]);
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

        const [carts] = await connection.query('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
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
        const total_amount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

        const order = 'INSERT INTO shop_orders (user_id, total_amount, shipping_method, shipping_address, transaction_id, payment_status, order_status) VALUES (?,?,?,?,?,?,?)';
        const orderValues = [user_id, total_amount, shipping_method, shipping_address, process_payment_id, 'Pending', 1];
        const [orderResult] = await connection.query(order, orderValues);
        const shop_order_id = orderResult.insertId;
        //Record payment
        const payment = 'INSERT INTO payment (shop_order_id, amount, payment_method, payment_status,transaction_id) VALUES (?,?,?,?,?)';
        await connection.query(payment, [shop_order_id, total_amount, 'Stripe', 'Pending', process_payment_id]);
        
        //Record into the orderline
        const orderline = 'INSERT INTO order_line (shop_order_id, product_item_id, quantity, price) VALUES (?,?,?,?)';
        const orderlinevalues = items.map(item => [shop_order_id, item.product_item_id, item.quantity, item.price]);
        await connection.query(orderline, [orderlinevalues]);

        const deleteCartItems = 'DELETE FROM cart_items WHERE cart_id = ?';
        await connection.query(deleteCartItems, [cart_id]);

        await connection.commit();
        res.status(201).json({
            Message: 'Order Created Successfully',
            shop_order_id: shop_order_id
        });
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
    if(event.type === 'payment_intent.succeeded'){
        const paymentIntent = event.data.object;
        console.log('Payment Succeeded:', paymentIntent.id);
        await handleSuccessfulPayment(paymentIntent);
    }else{
        const failedPayment = event.data.object;
        console.log('Payment Failed:', failedPayment.id)
        await handleFailedPayment(failedPayment);
    }   
        res.sendStatus(200).json({recieved: true});
    };

async function handleSuccessfulPayment(paymentIntent){
    let connection;
    try{
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const updateOrder = 'UPDATE shop_orders SET payment_status = "Paid", order_status = ? WHERE transaction_id = ?';
        await connection.query(updateOrder, [2,paymentIntent.id])

        const updatePayment = 'UPDATE payments SET payment_status = "Paid" WHERE transaction_id = ?';
        await connection.query(updatePayment, [paymentIntent.id]);

        const getCart = `
        SELECT c.cart_id FROM carts c
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
        await connection.commit();
        console.log(`Order and Payment records updated for Transaction ID: ${paymentIntent.id}`);
        }
    catch(error){
        if(connection){
            await connection.rollback();
            console.error('ERROR Handling Successful Payment:', error);
        }
    }
    finally{
        if(connection) connection.release();
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
async function updateOrderStatus(req,res){
    try{
        const {orderId} = req.params;
        const {statusId} = req.body;

        if(!statusId){
            return res.status(400).json({Message: 'Status ID is required'});
        }
        const [updateStatus] = await pool.query('UPDATE shop_orders SET order_status_id = ? WHERE shop_order_id = ?', [statusId, orderId]);
        if(updateStatus.affectedRows === 0){
            return res.status(404).json({Message: 'Order not found'});
        }
        res.status(200).json({Message: 'Order status updated successfully'});
    }
    catch(error){
        console.error('ERROR Updating Order Status:', error);
        res.status(500).json({Error:'Error Updating Order Status'});
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

// 6. API  ROUTES
app.get('/', (req,res) => {
    res.send('Node.js and MYSQL API is running');
});

app.post('/roles', createRoles);
app.delete('/roles/:id', deleteRole);
app.get('/users', getAllUsers);
app.post('/addresses', createAddress);
app.delete('/addresses/:id', deleteAddress);
app.put('/addresses/:id', updateAddress);
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);
app.get('/users/:id', getUserProfile);

// Product routes
app.get('/products', getAllProducts);
app.get('/products/:id', getProductById);
app.put('/products/:id', updateProduct);
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
app.get('/admin/analytics/sales', getSalesAnalytics);

//7. RUN
app.listen(3000,()=>{
    console.log(`Server is running on port ${port}`)
});

