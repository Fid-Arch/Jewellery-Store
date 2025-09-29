const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  moveWishlistToCart,
  clearWishlist
} = require('../controllers/wishlistController');

// All wishlist routes require authentication
router.use(authenticateJWT);

// Add item to wishlist
router.post('/add', addToWishlist);

// Get user's wishlist
router.get('/', getUserWishlist);

// Remove item from wishlist
router.delete('/item/:productId', removeFromWishlist);

// Move item from wishlist to cart
router.post('/move-to-cart/:productId', moveWishlistToCart);

// Clear entire wishlist
router.delete('/clear', clearWishlist);

module.exports = router;