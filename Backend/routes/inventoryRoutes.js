const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
    getStockLevels,
    updateStock,
    getLowStockProducts,
    bulkUpdateStock,
    getStockMovements
} = require('../controllers/inventoryController');

const {
    getStockLevelsSchema,
    updateStockSchema,
    bulkUpdateStockSchema,
    getLowStockSchema,
    getStockMovementsSchema,
    addRemoveStock
} = require('../validators/inventorySchemas');

// Admin/Staff inventory management routes (all require authentication)

// Get stock levels with optional filtering
router.get('/stock-levels', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(getStockLevelsSchema, 'query'), 
    getStockLevels
);

// Get low stock products
router.get('/low-stock', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(getLowStockSchema, 'query'), 
    getLowStockProducts
);

// Update stock for a single product item
router.put('/stock/:productItemId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(updateStockSchema, 'body'), 
    updateStock
);

// Bulk update stock for multiple product items
router.put('/stock/bulk-update', 
    authenticateJWT, 
    authorizeAdminJWT, // Only admins can do bulk updates
    validateRequest(bulkUpdateStockSchema), 
    bulkUpdateStock
);

// Get stock movements/history
router.get('/stock-movements', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(getStockMovementsSchema, 'query'), 
    getStockMovements
);

router.post('/stock/:productItemId/add', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(addRemoveStock), 
    updateStock
);

router.post('/stock/:productItemId/remove', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(addRemoveStock), 
    updateStock
);

router.post('/stock/bulk-update', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(bulkUpdateStock), 
    bulkUpdateStock
);

// Alerts and monitoring
router.get('/alerts/low-stock', 
    authenticateJWT, 
    authorizeAdminJWT, 
    getLowStockProducts
);

router.get('/alerts/reorder', 
    authenticateJWT, 
    authorizeAdminJWT, 
    getLowStockProducts
);

router.put('/reorder-point/:productItemId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(updateStockSchema), 
    updateStock
);

// History and movements
router.get('/history/:productItemId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    getStockMovements
);

router.post('/movements', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(updateStockSchema), 
    updateStock
);

router.get('/movements', 
    authenticateJWT, 
    authorizeAdminJWT, 
    getStockMovements
);

// Audit and reporting
// Get stock movements for specific product
router.get('/stock-movements/product/:productId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(getStockMovementsSchema, 'query'), 
    getStockMovements
);

// Get stock movements for specific product item
router.get('/stock-movements/item/:productItemId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(getStockMovementsSchema, 'query'), 
    getStockMovements
);

// Stock alerts and reports routes
// Get critical stock alerts (stock below critical threshold)
router.get('/alerts/critical', 
    authenticateJWT, 
    authorizeAdminJWT, 
    (req, res, next) => {
        req.query.threshold = 5; // Critical threshold
        req.query.includeOutOfStock = true;
        next();
    },
    validateRequest(getLowStockSchema, 'query'), 
    getLowStockProducts
);

// Get out of stock products
router.get('/alerts/out-of-stock', 
    authenticateJWT, 
    authorizeAdminJWT, 
    (req, res, next) => {
        req.query.threshold = 0;
        req.query.includeOutOfStock = true;
        next();
    },
    validateRequest(getLowStockSchema, 'query'), 
    getLowStockProducts
);

// Get stock summary report
router.get('/reports/summary', 
    authenticateJWT, 
    authorizeAdminJWT, 
    getStockLevels
);

module.exports = router;