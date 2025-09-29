const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
    getDashboardStats,
    getAllUsersAdmin,
    updateUserRole,
    deleteUserAdmin,
    getSalesAnalytics,
    getLowStockProducts,
    getOrderStatistics
} = require('../controllers/adminController');

// All admin routes require authentication and admin authorization
router.use(authenticateJWT, authorizeAdminJWT);

// Dashboard and statistics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/orders', getOrderStatistics);

// User management
router.get('/users', getAllUsersAdmin);
router.patch('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUserAdmin);

// Inventory management
router.get('/products/low-stock', getLowStockProducts);

module.exports = router;