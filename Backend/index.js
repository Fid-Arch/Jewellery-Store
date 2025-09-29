// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

// Import database connection (this will initialize the connection)
require('./config/database');

// 2. Initialize Express APP
const app = express();
const port = process.env.PORT || 3000;

// 3. Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Raw body parser for Stripe webhooks (must be before express.json())
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

// Regular JSON parser for all other routes
app.use(express.json());

// 4. Routes
app.get('/', (req, res) => {
    res.json({ message: 'Goldmarks Jewellery API is running!' });
});

// Use route modules
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);
app.use('/admin', adminRoutes);
app.use('/addresses', addressRoutes);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/categories', categoryRoutes);
app.use('/promotions', promotionRoutes);
app.use('/payments', paymentRoutes);
app.use('/shipping', shippingRoutes);
app.use('/inventory', inventoryRoutes);


// TODO: Move remaining functions to appropriate controllers and routes
// For now, keeping the original routes until migration is complete

// 5. Start Server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;