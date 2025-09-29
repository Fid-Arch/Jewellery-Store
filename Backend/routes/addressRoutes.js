const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
    createAddress,
    deleteAddress,
    updateAddress,
    linkUserAddress,
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress
} = require('../controllers/addressController');

// Basic address management (admin functions)
router.post('/', authenticateJWT, createAddress);
router.delete('/:id', authenticateJWT, deleteAddress);
router.patch('/:id', authenticateJWT, updateAddress);
router.post('/link/:user_id', authenticateJWT, linkUserAddress);

// User shipping address management
router.get('/shipping', authenticateJWT, getUserShippingAddresses);
router.post('/shipping', authenticateJWT, addShippingAddress);
router.patch('/shipping/:addressId', authenticateJWT, updateShippingAddress);
router.delete('/shipping/:addressId', authenticateJWT, deleteShippingAddress);
router.patch('/shipping/:addressId/default', authenticateJWT, setDefaultShippingAddress);

module.exports = router;