const express = require('express');
const router = express.Router();
const { validateRequest } = require('../middleware/validation');
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
    getShippingOptionsForCart,
    createShippingLabel,
    trackOrderWithLabel,
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress,  
    validateShippingAddress
} = require('../controllers/shippingController');

const {
    getShippingOptionsSchema,
    createShippingLabelSchema,
    trackOrderSchema,
    addShippingAddressSchema,
    updateShippingAddressSchema,
    deleteShippingAddressSchema,
    setDefaultAddressSchema,
    validateShippingAddressSchema
} = require('../validators/shippingSchemas');

// Public shipping routes
// Get shipping options for cart (public - can be used by guests)
router.post('/options', 
    validateRequest(getShippingOptionsSchema), 
    getShippingOptionsForCart
);

// Validate shipping address (public)
router.post('/validate-address', 
    validateRequest(validateShippingAddressSchema), 
    validateShippingAddress
);

// Customer shipping address management routes (auth required)
// Get user's shipping addresses
router.get('/addresses', 
    authenticateJWT, 
    getUserShippingAddresses
);

// Add new shipping address
router.post('/addresses', 
    authenticateJWT, 
    validateRequest(addShippingAddressSchema), 
    addShippingAddress
);

// Update shipping address
router.put('/addresses/:addressId', 
    authenticateJWT, 
    validateRequest(updateShippingAddressSchema, 'params'), 
    updateShippingAddress
);

// Delete shipping address
router.delete('/addresses/:addressId', 
    authenticateJWT, 
    validateRequest(deleteShippingAddressSchema, 'params'), 
    deleteShippingAddress
);

// Set default shipping address
router.patch('/addresses/:addressId/default', 
    authenticateJWT, 
    validateRequest(setDefaultAddressSchema, 'params'), 
    setDefaultShippingAddress
);

// Admin/Staff shipping management routes
// Create shipping label (admin/staff only)
router.post('/labels', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(createShippingLabelSchema), 
    createShippingLabel
);

// Track order with label (admin/staff only)  
router.get('/track/:orderId', 
    authenticateJWT, 
    authorizeAdminJWT, 
    validateRequest(trackOrderSchema, 'params'), 
    trackOrderWithLabel
);

// Customer order tracking (customers can track their own orders)
router.get('/track/order/:orderId', 
    authenticateJWT, 
    validateRequest(trackOrderSchema, 'params'), 
    trackOrderWithLabel
);

module.exports = router;