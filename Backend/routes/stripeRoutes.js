const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
    createPaymentIntent,
    confirmPaymentIntent,
    getPaymentStatus
} = require('../controllers/stripeController');

// Create payment intent
router.post('/create-intent', authenticateJWT, createPaymentIntent);

// Confirm payment intent (for 3D Secure)
router.post('/confirm-intent', authenticateJWT, confirmPaymentIntent);

// Get payment status
router.get('/status/:payment_intent_id', authenticateJWT, getPaymentStatus);

module.exports = router;