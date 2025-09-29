const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
    createProductReview,
    getProductReviews,
    updateProductReview,
    deleteProductReview,
    getAverageProductRating,
    getUserProductReviews
} = require('../controllers/reviewController');

// Product review routes
router.post('/products/:productId/reviews', authenticateJWT, createProductReview);
router.get('/products/:productId/reviews', getProductReviews);
router.get('/products/:productId/rating', getAverageProductRating);

// User review management
router.get('/my-reviews', authenticateJWT, getUserProductReviews);
router.put('/:reviewId', authenticateJWT, updateProductReview);
router.delete('/:reviewId', authenticateJWT, deleteProductReview);

module.exports = router;