const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrdersAdmin,
    trackOrderWithLabel
} = require('../controllers/orderController');

// User order routes
router.post('/', authenticateJWT, createOrder);
router.get('/my-orders', authenticateJWT, getUserOrders);
router.get('/:orderId', authenticateJWT, getOrderById);

// Public order tracking
router.get('/track/:orderLabel', trackOrderWithLabel);

// Admin order routes
router.get('/', authenticateJWT, authorizeAdminJWT, getAllOrdersAdmin);
router.patch('/:order_id/status', authenticateJWT, authorizeAdminJWT, updateOrderStatus);

module.exports = router;