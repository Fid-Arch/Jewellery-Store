const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
  getActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotionCode,
  applyPromotionToOrder,
  getPromotionStats
} = require('../controllers/promotionController');

// Public routes
// Get active promotions
router.get('/active', getActivePromotions);

// Validate promotion code
router.post('/validate', validatePromotionCode);

// Apply promotion to order (requires authentication)
router.post('/apply', authenticateJWT, applyPromotionToOrder);

// Admin routes - require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeAdminJWT);

// Create new promotion
router.post('/', createPromotion);

// Update promotion
router.put('/:id', updatePromotion);

// Delete (deactivate) promotion
router.delete('/:id', deletePromotion);

// Get promotion statistics
router.get('/stats', getPromotionStats);

module.exports = router;