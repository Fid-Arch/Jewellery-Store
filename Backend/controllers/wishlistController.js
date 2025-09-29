const pool = require('../config/database');

// Add Product to Wishlist
async function addToWishlist(req, res) {
    try {
        const { productId } = req.body;
        const user_id = req.user.user_id;
        
        const [product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [productId]);

        if (product.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        let [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);

        let wishlistId;
        if (wishlist.length === 0) {
            const [newWishlist] = await pool.query('INSERT INTO wishlist (user_id) VALUES (?)', [user_id]);
            wishlistId = newWishlist.insertId;
        } else {
            wishlistId = wishlist[0].wishlist_id;
        }

        // Check if product already in wishlist
        const [existingItem] = await pool.query(
            'SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', 
            [wishlistId, productId]
        );
        
        if (existingItem.length > 0) {
            return res.status(409).json({ Message: 'Product already in wishlist' });
        }

        // Add product to wishlist
        await pool.query(
            'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)', 
            [wishlistId, productId]
        );
        
        res.status(201).json({
            Message: 'Product added to wishlist',
            data: {
                wishlistId,
                productId: parseInt(productId)
            }
        });
    } catch (error) {
        console.error('ERROR Adding to Wishlist:', error);
        res.status(500).json({ Error: 'Error adding to wishlist' });
    }
}

// Remove Product from Wishlist
async function removeFromWishlist(req, res) {
    try {
        const { productId } = req.params;
        const user_id = req.user.user_id;

        // Get Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if (wishlist.length === 0) {
            return res.status(404).json({ Message: 'Wishlist not found' });
        }

        const wishlistId = wishlist[0].wishlist_id;
        
        // Remove Item
        const [deleteItem] = await pool.query(
            'DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', 
            [wishlistId, productId]
        );
        
        if (deleteItem.affectedRows === 0) {
            return res.status(404).json({ Message: 'Product not found in wishlist' });
        }
        
        res.status(200).json({
            Message: 'Product removed from wishlist',
            data: {
                productId: parseInt(productId)
            }
        });
    } catch (error) {
        console.error('ERROR Removing from Wishlist:', error);
        res.status(500).json({ Error: 'Error removing from wishlist' });
    }
}

// Get User's Wishlist
async function getUserWishlist(req, res) {
    try {
        const user_id = req.user.user_id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Get Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if (wishlist.length === 0) {
            return res.status(200).json({
                data: {
                    items: [],
                    count: 0,
                    pagination: {
                        currentPage: parseInt(page),
                        pageSize: parseInt(limit),
                        totalPages: 0,
                        totalItems: 0
                    }
                }
            });
        }

        const wishlistId = wishlist[0].wishlist_id;

        // Get Wishlist Items
        const [items] = await pool.query(`
            SELECT wi.wishlist_item_id, wi.product_id, p.productname, p.description, 
                p.product_image, c.name as category_name,
                MIN(pi.price) as min_price, MAX(pi.price) as max_price,
                SUM(pi.qty_in_stock) as total_stock, 
                COUNT(DISTINCT pi.product_item_id) as variants_count,
                CASE
                    WHEN SUM(pi.qty_in_stock) > 0 THEN 'In Stock'
                    ELSE 'Out of Stock'
                END as stock_status
            FROM wishlist_items wi
            JOIN products p ON wi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE wi.wishlist_id = ? 
            GROUP BY wi.wishlist_item_id, wi.product_id, p.productname, p.description, p.product_image, c.name
            ORDER BY wi.wishlist_item_id DESC
            LIMIT ? OFFSET ?`, [wishlistId, parseInt(limit), parseInt(offset)]);

        const [totalCount] = await pool.query(
            'SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = ?', 
            [wishlistId]
        );

        res.status(200).json({
            data: {
                items,
                count: totalCount[0].count,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    totalPages: Math.ceil(totalCount[0].count / limit),
                    totalItems: totalCount[0].count
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Wishlist:', error);
        res.status(500).json({ Error: 'Error fetching wishlist' });
    }
}

// Clear Entire Wishlist
async function clearWishlist(req, res) {
    try {
        const user_id = req.user.user_id;

        // Get User's Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if (wishlist.length === 0) {
            return res.status(404).json({ Message: 'Wishlist not found' });
        }
        
        const wishlistId = wishlist[0].wishlist_id;

        // Get Count of items Before Clearing
        const [countBefore] = await pool.query(
            'SELECT COUNT(*) as count FROM wishlist_items WHERE wishlist_id = ?', 
            [wishlistId]
        );

        // Delete Wishlist Items
        await pool.query('DELETE FROM wishlist_items WHERE wishlist_id = ?', [wishlistId]);

        res.status(200).json({
            Message: 'Wishlist cleared successfully',
            data: {
                itemsRemoved: countBefore[0].count
            }
        });
    } catch (error) {
        console.error('ERROR Clearing Wishlist:', error);
        res.status(500).json({ Error: 'Error clearing wishlist' });
    }
}

// Check Wishlist Status of a Product
async function checkWishlistStatus(req, res) {
    try {
        const user_id = req.user.user_id;
        const { productId } = req.params;

        // Get User's Wishlist
        const [wishlist] = await pool.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        
        if (wishlist.length === 0) {
            return res.status(200).json({
                data: {
                    inWishlist: false,
                    productId: parseInt(productId)
                }
            });
        }
        
        const wishlistId = wishlist[0].wishlist_id;

        // Check if Product in Wishlist
        const [item] = await pool.query(
            'SELECT wishlist_item_id FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', 
            [wishlistId, productId]
        );

        res.status(200).json({
            data: {
                inWishlist: item.length > 0,
                productId: parseInt(productId),
                wishlistItemId: item.length > 0 ? item[0].wishlist_item_id : null
            }
        });
    } catch (error) {
        console.error('ERROR Checking Wishlist Status:', error);
        res.status(500).json({ Error: 'Error checking wishlist status' });
    }
}

// Move Wishlist Items to Cart
async function moveWishlistToCart(req, res) {
    let connection;
    try {
        const user_id = req.user.user_id;
        const { items } = req.body; // Array of productIds to move

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ Message: 'Items array is required' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get User's Wishlist
        const [wishlist] = await connection.query('SELECT wishlist_id FROM wishlist WHERE user_id = ?', [user_id]);
        if (wishlist.length === 0) {
            await connection.rollback();
            return res.status(404).json({ Message: 'Wishlist not found' });
        }
        
        const wishlistId = wishlist[0].wishlist_id;

        // Get or Create User's Cart
        let [cart] = await connection.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        let cartId;
        if (cart.length === 0) {
            const [newCart] = await connection.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            cartId = newCart.insertId;
        } else {
            cartId = cart[0].cart_id;
        }

        const successfulMoves = [];
        const failedMoves = [];

        for (const productId of items) {
            try {
                // Check if product exists in wishlist
                const [wishlistItem] = await connection.query(
                    'SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
                    [wishlistId, productId]
                );

                if (wishlistItem.length === 0) {
                    failedMoves.push({ productId, reason: 'Not found in wishlist' });
                    continue;
                }

                // Get first available product item
                const [productItems] = await connection.query(
                    'SELECT product_item_id FROM product_item WHERE product_id = ? AND qty_in_stock > 0 LIMIT 1',
                    [productId]
                );

                if (productItems.length === 0) {
                    failedMoves.push({ productId, reason: 'Product out of stock' });
                    continue;
                }

                const productItemId = productItems[0].product_item_id;

                // Check if item already in cart
                const [existingCartItem] = await connection.query(
                    'SELECT * FROM cart_items WHERE cart_id = ? AND product_item_id = ?',
                    [cartId, productItemId]
                );

                if (existingCartItem.length > 0) {
                    // Update quantity
                    await connection.query(
                        'UPDATE cart_items SET qty = qty + 1 WHERE cart_item_id = ?',
                        [existingCartItem[0].cart_item_id]
                    );
                } else {
                    // Add new item to cart
                    await connection.query(
                        'INSERT INTO cart_items (cart_id, product_item_id, qty) VALUES (?, ?, 1)',
                        [cartId, productItemId]
                    );
                }

                // Remove from wishlist
                await connection.query(
                    'DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
                    [wishlistId, productId]
                );

                successfulMoves.push({ productId });

            } catch (itemError) {
                console.error('Error moving item:', itemError);
                failedMoves.push({ productId, reason: 'Processing error' });
            }
        }

        await connection.commit();

        res.status(200).json({
            Message: 'Wishlist items moved to cart',
            data: {
                successful: successfulMoves,
                failed: failedMoves,
                totalProcessed: items.length,
                successCount: successfulMoves.length,
                failCount: failedMoves.length
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('ERROR Moving Wishlist to Cart:', error);
        res.status(500).json({ Error: 'Error moving wishlist items to cart' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    addToWishlist,
    removeFromWishlist,
    getUserWishlist,
    clearWishlist,
    checkWishlistStatus,
    moveWishlistToCart
};