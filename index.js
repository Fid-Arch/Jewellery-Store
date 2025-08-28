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
            return res.status(404).json({Message: 'Role not found'});
        }
        res.status(200).json({Message: 'Role deleted successfully'});
    }
    catch(error) {
        console.error("ERROR Deleting Role:", error);
        res.status(500).send('Error Deleting data from the database');
    }
}

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
}

// 5.3 Input Address
async function inputAddress(req,res) {
    try {
        const {street,city,state,zip_code,country} = req.body;
        if( !street || !city || !state || !zip_code || !country) {
            return res.status(400).send('Missing required fields');
        }
        const [InputAddress] = await pool.query('INSERT INTO addresses (user_id,street,city,state,zip_code,country) VALUES (?,?,?,?,?,?)', [user_id,street,city,state,zip_code,country]);
        res.status(201).json({
            Message: 'Address added successfully', 
            addressId: InputAddress.insertId
        });
    }
    catch(error) {
        console.error("ERROR Adding Address:", error);
        res.status(500).send('Error Inserting data into the database');
    }
}

// 6. API  ROUTES
app.get('/', (req,res) => {
    res.send('Node.js and MYSQL API is running');
});

app.post('/roles', createRoles);
app.delete('/roles/:id', deleteRole);
app.post('/users', createUser);
app.get('/users', getAllUsers);


//7. RUN
app.listen(3000,()=>{
    console.log('Server is running on port ${port}`')
});

