// 1. Import Dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const password_hash = password + '_hashed'; // In production, hash the password before storing

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
        const [users] = await pool.query('SELECT user_id, firstName, lastName, email, password_hash FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({Message: 'Invalid Email or Password'});
        }
        const user = users[0];
        if (user.password_hash !== password + '_hashed') {
            return res.status(401).json({Message: 'Invalid Email or Password'});
        }
        const sessionToken = 'session_token_placeholder'; // In production, generate a secure token
        res.status(200).json({
            Message: 'Login successful',
            token: sessionToken,
            user: {
                id: user.user_id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role_id
            }
        });
    }
    catch(error) {
        console.error("ERROR logging in User:", error);
        res.status(500).send('Error logging in the user');
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
        SELECT SUM(ci.quantity * pi.price) AS total_amount
        FROM cart_items ci
        JOIN product_items pi ON ci.product_item_id = pi.product_item_id
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
            automatic_payment_methods: {enabled: true},
        });
        res.status(200).json({
            Message: 'Payment Intent Created Successfully',
            clientSecret: paymentIntent.client_secret,
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

        const [carts] = await connection.query('SELECT * FROM carts WHERE user_id = ?', [user_id]);
        if(carts.length === 0){
            await connection.rollback();
            return res.status(404).json({Message: 'No active cart found for the user'});
        }
        const cart_id = carts[0].cart_id;
        const get_items = `
        SELECT ci.product_item_id, ci.quantity, pi.price
        FROM cart_items ci
        JOIN product_items pi ON ci.product_item_id = pi.product_item_id
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
        console.log('Payment Intent Succeeded:', paymentIntent.id);
        await handlesuccessfulPayment(paymentIntent);
        }
        res.sendStatus(200);
    };

async function SuccessfulPayment(paymentIntent){
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
app.get('/categories/:categoryId/products', getProductsByCategory);


//7. RUN
app.listen(3000,()=>{
    console.log(`Server is running on port ${port}`)
});

