const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getProductsByCategory
} = require('../controllers/categoryController');

// Get all categories (public)
router.get('/', getAllCategories);

// Get category by ID (public)
router.get('/:id', getCategoryById);

// Get products by category (public)
router.get('/:id/products', getProductsByCategory);

// Admin routes - require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeAdminJWT);

// Create new category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

module.exports = router;