// 1. Import Dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

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
//5.1 Create Roles
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

//5.2 Delete Role
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

// 5.3  Create User
async function createUser(req,res) {
    try{
        const { firstName, email, password_hash } = req.body;
        if(!firstName || !email || !password_hash) {
            return res.status(400).send('Missing required fields');
        }
        const [InputUser] = await pool.query('INSERT INTO users (firstName,email,password_hash) VALUES (?,?,?)', [firstName, email, password_hash]);
        res.status(201).json({
            Message: 'User created successfully', 
            userId: InputUser.insertId
        });
    }
    catch(error) {
        console.error("ERROR Creating User:", error);
        res.status(500).send('Error Inserting data into the database');
    }
};

// 5.3 Get All Users
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

// 5.3 Input Address
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

//5.4 Delete Address
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

//5.5 Update Address
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

//5.6 Linking User and Address
async function userAddress (req,res){
    try{
        const {user_id} = req.params;
        const {address_id} = req.body;

        if(!address_id){
            return res.status(400).send('Address ID is required');
        }
        const[linked] = await pool.query('INSERT INTO user_address {user_id,address_id} VALUES (?,?)', [user_id,address_id]);
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

//5.7 Create Product
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

//5.8 prodcut Item
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
            itemID: item.insertID
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
            const[newCart] = await pool.query('INSERT INTO cart (user_id) = ?', [user_id]);
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
            await pool.query('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [newQuantity, existingItem[0].cart.item_id]);
            res.status(200).json({Message: 'Cart Item quantity updated successfully'});
        }
    }
    catch(error){
        console.error('ERROR Adding Item to Cart:', error);
        res.status(500).json({Error:'Error Inserting data into the database'});
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
        const payment = 'INSERT INTO payments (shop_order_id, amount, payment_method, payment_status,transaction_id) VALUES (?,?,?,?,?)';
        await connection.query(payment, [shop_order_id, total_amount, 'Stripe', 'Pending', process_payment_id]);
        
        //Record into the orderline
        const orderline = 'INSERT INTO order_lines (shop_order_id, product_item_id, quantity, price) VALUES (?,?,?,?)';
        const orderlinevalues = items.map(item => { shop_order_id, item.product_item_id, item.quantity, item.price});
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
    }

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

// 6. API  ROUTES
app.get('/', (req,res) => {
    res.send('Node.js and MYSQL API is running');
});

app.post('/roles', createRoles);
app.delete('/roles/:id', deleteRole);
app.post('/users', createUser);
app.get('/users', getAllUsers);
app.get('/addresses', createAddress);
app.delete('/addresses/:id', deleteAddress);
app.put('/addresses/:id', updateAddress);


//7. RUN
app.listen(3000,()=>{
    console.log(`Server is running on port ${port}`)
});

