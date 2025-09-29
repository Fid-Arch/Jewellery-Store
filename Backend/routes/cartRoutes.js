const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
  addItemToCart,
  getUserCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartSummary
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(authenticateJWT);

// Add item to cart
router.post('/add', addItemToCart);

// Get user's cart
router.get('/', getUserCart);

// Update cart item quantity
router.put('/item/:cartItemId', updateCartItem);

// Remove item from cart
router.delete('/item/:cartItemId', removeCartItem);

// Clear entire cart
router.delete('/clear', clearCart);

// Get cart summary
router.get('/summary', getCartSummary);

module.exports = router;