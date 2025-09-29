const pool = require('../config/database');

// Add Item to Cart
async function addItemToCart(req, res) {
    try {
        const user_id = req.user.user_id;
        const { product_item_id, qty } = req.body;
        
        if (!product_item_id || !qty) {
            return res.status(400).json({ Message: 'Missing required fields' });
        }

        // Check if product item exists and has enough stock
        const [productItem] = await pool.query(
            'SELECT product_item_id, qty_in_stock FROM product_item WHERE product_item_id = ?', 
            [product_item_id]
        );

        if (productItem.length === 0) {
            return res.status(404).json({ Message: 'Product item not found' });
        }

        if (productItem[0].qty_in_stock < qty) {
            return res.status(400).json({ 
                Message: 'Insufficient stock', 
                available: productItem[0].qty_in_stock 
            });
        }

        const [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [user_id]);
        let cart_id;

        if (cart.length === 0) {
            const [newCart] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            cart_id = newCart.insertId;
        } else {
            cart_id = cart[0].cart_id;
        }

        const [existingItem] = await pool.query(
            'SELECT * FROM cart_items WHERE cart_id = ? AND product_item_id = ?', 
            [cart_id, product_item_id]
        );

        if (existingItem.length === 0) {
            await pool.query(
                'INSERT INTO cart_items (cart_id, product_item_id, qty) VALUES (?,?,?)', 
                [cart_id, product_item_id, qty]
            );
            res.status(201).json({ Message: 'Item added to cart successfully' });
        } else {
            const newQty = existingItem[0].qty + qty;
            
            // Check if new quantity doesn't exceed stock
            if (newQty > productItem[0].qty_in_stock) {
                return res.status(400).json({ 
                    Message: 'Total quantity would exceed available stock', 
                    available: productItem[0].qty_in_stock,
                    currentInCart: existingItem[0].qty
                });
            }

            await pool.query(
                'UPDATE cart_items SET qty = ? WHERE cart_item_id = ?', 
                [newQty, existingItem[0].cart_item_id]
            );
            res.status(200).json({ Message: 'Cart item quantity updated successfully' });
        }
    } catch (error) {
        console.error('ERROR Adding Item to Cart:', error);
        res.status(500).json({ Error: 'Error adding item to cart' });
    }
}

// Get User Cart
async function getUserCart(req, res) {
    try {
        const user_id = req.user.user_id;

        let [carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            const [newCart] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [user_id]);
            const cart_id = newCart.insertId;
            return res.status(200).json({
                data: {
                    cart_id,
                    items: [],
                    total_amount: 0,
                    itemCount: 0
                },
                Message: 'New cart created for the user'
            });
        }

        const cart_id = carts[0].cart_id;
        const [cartItems] = await pool.query(`
            SELECT ci.cart_item_id, ci.qty, ci.product_item_id, pi.price, pi.sku, pi.product_image, 
                   pi.qty_in_stock, p.productname, p.description, p.product_id
            FROM cart_items ci
            JOIN product_item pi ON ci.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            WHERE ci.cart_id = ?`, [cart_id]);

        const total_amount = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        
        res.status(200).json({
            data: {
                cart_id,
                items: cartItems,
                total_amount: parseFloat(total_amount.toFixed(2)),
                itemCount: cartItems.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching User Cart:', error);
        res.status(500).json({ Error: 'Error fetching user cart' });
    }
}

// Update Cart Item
async function updateCartItem(req, res) {
    try {
        const user_id = req.user.user_id;
        const { cartItemId } = req.params;
        const { qty } = req.body;

        if (!qty || qty < 1) {
            return res.status(400).json({ Message: 'Quantity must be at least 1' });
        }

        // Verify user owns this cart item by cart_item_id
        const [cartItemCheck] = await pool.query(`
            SELECT ci.cart_item_id, ci.product_item_id, pi.qty_in_stock
            FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.cart_id
            JOIN product_item pi ON ci.product_item_id = pi.product_item_id
            WHERE ci.cart_item_id = ? AND c.user_id = ?
        `, [cartItemId, user_id]);

        if (cartItemCheck.length === 0) {
            return res.status(404).json({ Message: 'Cart item not found or access denied' });
        }

        // Check stock availability
        if (qty > cartItemCheck[0].qty_in_stock) {
            return res.status(400).json({ 
                Message: 'Quantity exceeds available stock',
                available: cartItemCheck[0].qty_in_stock
            });
        }

        const [updateItem] = await pool.query(
            'UPDATE cart_items SET qty = ? WHERE cart_item_id = ?', 
            [qty, cartItemId]
        );

        if (updateItem.affectedRows === 0) {
            return res.status(404).json({ Message: 'Cart item not found or no changes made' });
        }

        res.status(200).json({ Message: 'Cart item updated successfully' });
    } catch (error) {
        console.error('ERROR Updating Cart Item:', error);
        res.status(500).json({ Error: 'Error updating cart item' });
    }
}

// Remove Cart Item
async function removeCartItem(req, res) {
    try {
        const user_id = req.user.user_id;
        const { cartItemId } = req.params;

        // Verify user owns this cart item by cart_item_id
        const [cartItemCheck] = await pool.query(`
            SELECT ci.cart_item_id
            FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.cart_id
            WHERE ci.cart_item_id = ? AND c.user_id = ?
        `, [cartItemId, user_id]);

        if (cartItemCheck.length === 0) {
            return res.status(404).json({ Message: 'Cart item not found or access denied' });
        }

        const [deleteItem] = await pool.query('DELETE FROM cart_items WHERE cart_item_id = ?', [cartItemId]);

        if (deleteItem.affectedRows === 0) {
            return res.status(404).json({ Message: 'Cart item not found' });
        }

        res.status(200).json({ Message: 'Cart item removed successfully' });
    } catch (error) {
        console.error('ERROR Removing Cart Item:', error);
        res.status(500).json({ Error: 'Error removing cart item' });
    }
}

// Clear Cart
async function clearCart(req, res) {
    try {
        const user_id = req.user.user_id;
        const [carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        
        if (carts.length === 0) {
            return res.status(404).json({ Message: 'No active cart found for the user' });
        }

        const cart_id = carts[0].cart_id;
        await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);

        res.status(200).json({ Message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('ERROR Clearing Cart:', error);
        res.status(500).json({ Error: 'Error clearing cart' });
    }
}

// Get Cart Summary (for checkout)
async function getCartSummary(req, res) {
    try {
        const user_id = req.user.user_id;

        const [carts] = await pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.status(404).json({ Message: 'No active cart found' });
        }

        const cart_id = carts[0].cart_id;
        const [cartItems] = await pool.query(`
            SELECT ci.qty, pi.price, p.productname
            FROM cart_items ci
            JOIN product_item pi ON ci.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            WHERE ci.cart_id = ?`, [cart_id]);

        if (cartItems.length === 0) {
            return res.status(400).json({ Message: 'Cart is empty' });
        }

        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        res.status(200).json({
            data: {
                cart_id,
                itemCount: cartItems.length,
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(tax.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                items: cartItems
            }
        });
    } catch (error) {
        console.error('ERROR Getting Cart Summary:', error);
        res.status(500).json({ Error: 'Error getting cart summary' });
    }
}

module.exports = {
    addItemToCart,
    getUserCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartSummary
};