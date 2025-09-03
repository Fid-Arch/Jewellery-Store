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

// Create Order
async function createOrder(req,res){
    let connection;
    try{
        const {user_id, total_amount, shipping_method, shipping_address, items} = req.body

        if(!user_id || !total_amount || !shipping_method || !shipping_address || !items || items.length === 0){
            return res.status(400).json({Message: 'Missing required fields'});
        }
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const[order] = await connection.query('INSERT INTO orders (user_id,total_amount,shipping_method,shipping_address) VALUES (?,?,?,?)', [user_id,total_amount,shipping_method,shipping_address]);
        const orderId = order.insertId;
        const[orderLines] = await Promise.all(items.map(item => {
            return connection.query('INSERT INTO order_lines (order_id,product_item_id,quantity,price) VALUES (?,?,?,?)', [orderId,item.product_item_id,item.quantity,item.price]);
        }));   
        await connection.commit();
        res.status(201).json({
            Message: 'Order created successfully',
            orderId: orderId
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

