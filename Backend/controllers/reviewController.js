const pool = require('../config/database');

// Create Product Review
async function createProductReview(req, res) {
    try {
        const user_id = req.user.user_id;
        const { productId } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ Message: 'Rating must be between 1 and 5' });
        }

        // Check for product
        const [product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [productId]);
        if (product.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        // Check if user already reviewed this product
        const [existingReview] = await pool.query(`
            SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?`, [user_id, productId]);

        if (existingReview.length > 0) {
            return res.status(400).json({ Message: 'You have already reviewed this product' });
        }

        // Verify user purchased the product
        const [purchased] = await pool.query(`
            SELECT COUNT(*) as purchase_count
            FROM shop_orders so
            JOIN order_line ol ON so.shop_order_id = ol.shop_order_id
            JOIN product_item pi ON ol.product_item_id = pi.product_item_id
            WHERE so.user_id = ? AND pi.product_id = ? AND so.payment_status = 'Paid'`, [user_id, productId]);

        const verifiedPurchase = purchased[0].purchase_count > 0;

        if (!verifiedPurchase) {
            return res.status(400).json({ Message: 'You can only review products you have purchased' });
        }

        // Insert review
        const [reviews] = await pool.query(`
            INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`, 
            [user_id, productId, rating, comment]);

        res.status(201).json({
            Message: 'Review created successfully',
            data: {
                reviewId: reviews.insertId,
                verifiedPurchase
            }
        });
    } catch (error) {
        console.error('ERROR Creating Product Review:', error);
        res.status(500).json({ Error: 'Error Creating Product Review' });
    }
}

// Get Product Reviews
async function getProductReviews(req, res) {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sortBy = 'review_date', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const allowedSortBy = ['review_date', 'rating'];
        const allowedSortOrder = ['ASC', 'DESC'];

        if (!allowedSortBy.includes(sortBy)) {
            return res.status(400).json({ Message: `Invalid sortBy value. Allowed values are: ${allowedSortBy.join(', ')}` });
        }
        if (!allowedSortOrder.includes(sortOrder.toUpperCase())) {
            return res.status(400).json({ Message: `Invalid sortOrder value. Allowed values are: ${allowedSortOrder.join(', ')}` });
        }

        const [reviews] = await pool.query(`
            SELECT r.review_id, r.rating, r.comment, r.review_date, u.firstName, u.lastName,
            CASE 
                WHEN purchases.purchase_count > 0 THEN TRUE
                ELSE FALSE
            END as is_verified_purchase
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN(
                SELECT so.user_id, COUNT(*) as purchase_count
                FROM shop_orders so
                JOIN order_line ol ON so.shop_order_id = ol.shop_order_id
                JOIN product_item pi ON ol.product_item_id = pi.product_item_id
                WHERE pi.product_id = ? AND so.payment_status = 'Paid'
                GROUP BY so.user_id
            ) as purchases ON r.user_id = purchases.user_id
            WHERE r.product_id = ?
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`, [productId, productId, parseInt(limit), parseInt(offset)]);

        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE product_id = ?`, [productId]);

        const avgrating = stats[0].average_rating;

        res.status(200).json({
            data: {
                reviews,
                statistics: {
                    ...stats[0],
                    average_rating: avgrating ? parseFloat(avgrating.toFixed(1)) : 0.0
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(stats[0].total_reviews / limit),
                    totalReviews: stats[0].total_reviews,
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Product Reviews:', error);
        res.status(500).json({ Error: 'Error Fetching Product Reviews' });
    }
}

// Update Product Review
async function updateProductReview(req, res) {
    try {
        const user_id = req.user.user_id;
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ Message: 'Rating must be between 1 and 5' });
        }

        const [reviews] = await pool.query('SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?', [reviewId, user_id]);

        if (reviews.length === 0) {
            return res.status(404).json({ Message: 'Review not found or you are not authorized to update this review' });
        }

        const updateFields = {};
        if (rating) updateFields.rating = rating;
        if (comment !== undefined) updateFields.comment = comment;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ Message: 'No fields to update' });
        }

        await pool.query('UPDATE reviews SET ? WHERE review_id = ?', [updateFields, reviewId]);

        res.status(200).json({ Message: 'Review updated successfully' });
    } catch (error) {
        console.error('ERROR Updating Product Review:', error);
        res.status(500).json({ Error: 'Error Updating Product Review' });
    }
}

// Delete Product Review
async function deleteProductReview(req, res) {
    try {
        const user_id = req.user.user_id;
        const { reviewId } = req.params;

        const [reviews] = await pool.query('SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?', [reviewId, user_id]);

        if (reviews.length === 0) {
            return res.status(404).json({ Message: 'Review not found or you are not authorized to delete this review' });
        }

        await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
        res.status(200).json({ Message: 'Review deleted successfully' });
    } catch (error) {
        console.error('ERROR Deleting Product Review:', error);
        res.status(500).json({ Error: 'Error Deleting Product Review' });
    }
}

// Get Average Product Rating
async function getAverageProductRating(req, res) {
    try {
        const { productId } = req.params;
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE product_id = ?`, [productId]);

        const avgrating = stats[0].average_rating;

        res.status(200).json({
            data: {
                productId: parseInt(productId),
                totalReviews: stats[0].total_reviews,
                averageRating: parseFloat(avgrating || 0).toFixed(1),
                ratingsBreakdown: {
                    5: stats[0].five_star,
                    4: stats[0].four_star,
                    3: stats[0].three_star,
                    2: stats[0].two_star,
                    1: stats[0].one_star
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Average Product Rating:', error);
        res.status(500).json({ Error: 'Error Fetching Average Product Rating' });
    }
}

// Get User's Product Reviews
async function getUserProductReviews(req, res) {
    try {
        const user_id = req.user.user_id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [reviews] = await pool.query(`
            SELECT r.review_id, r.rating, r.comment, r.review_date, p.product_id, p.productname, p.product_image
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
            LIMIT ? OFFSET ?`, [user_id, parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.query('SELECT COUNT(*) as total_reviews FROM reviews WHERE user_id = ?', [user_id]);

        res.status(200).json({
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countResult[0].total_reviews / limit),
                    totalReviews: countResult[0].total_reviews
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching User Product Reviews:', error);
        res.status(500).json({ Error: 'Error Fetching User Product Reviews' });
    }
}

module.exports = {
    createProductReview,
    getProductReviews,
    updateProductReview,
    deleteProductReview,
    getAverageProductRating,
    getUserProductReviews
};