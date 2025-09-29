const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentDetails,
  refundPayment,
  getPaymentHistory
} = require('../controllers/paymentController');

// Webhook route (no authentication required, uses Stripe signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Routes requiring authentication
router.use(authenticateJWT);

// Create payment intent
router.post('/create-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm', confirmPayment);

// Get payment details for specific order
router.get('/order/:orderId', getPaymentDetails);

// Get payment history for user
router.get('/history', getPaymentHistory);

// Admin routes
router.use(authorizeAdminJWT);

// Refund payment
router.post('/refund/:orderId', refundPayment);

module.exports = router;