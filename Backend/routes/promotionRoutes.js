const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { promotionSchemas } = require('../validators/commonSchemas');
const {
  getAllPromotions,
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
router.post('/validate', validateRequest(promotionSchemas.validatePromotion), validatePromotionCode);

// Apply promotion to order (requires authentication)
router.post('/apply', authenticateJWT, validateRequest(promotionSchemas.applyPromotion), applyPromotionToOrder);

// Admin routes - require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeAdminJWT);

// Get all promotions (admin only)
router.get('/', getAllPromotions);

// Create new promotion
router.post('/', validateRequest(promotionSchemas.createPromotion), createPromotion);

// Update promotion
router.put('/:id', validateRequest(promotionSchemas.updatePromotion), updatePromotion);

// Delete (deactivate) promotion
router.delete('/:id', deletePromotion);

// Get promotion statistics
router.get('/stats', getPromotionStats);

module.exports = router;