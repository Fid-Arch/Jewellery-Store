const express = require('express');
const router = express.Router();
const { authenticateJWT, authorizeAdminJWT } = require('../middleware/auth');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getFeaturedProducts,
    getProductSuggestions,
    getProductByCategory,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    getProductItems
} = require('../controllers/productController');

// Public product routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:categoryId', getProductByCategory);
router.get('/:id', getProductById);
router.get('/:id/items', getProductItems);
router.get('/:productId/suggestions', getProductSuggestions);

// Admin product routes
router.post('/', authenticateJWT, authorizeAdminJWT, createProduct);
router.patch('/:id', authenticateJWT, authorizeAdminJWT, updateProduct);
router.delete('/:id', authenticateJWT, authorizeAdminJWT, deleteProduct);

// Product item routes (stock management)
router.post('/:productId/items', authenticateJWT, authorizeAdminJWT, createProductItem);
router.patch('/items/:itemId', authenticateJWT, authorizeAdminJWT, updateProductItem);
router.delete('/items/:itemId', authenticateJWT, authorizeAdminJWT, deleteProductItem);

module.exports = router;