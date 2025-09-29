// INVENTORY MANAGEMENT FUNCTIONS
const pool = require('../config/database');

// Record stock movement and update product stock
async function recordStockMovement(productItemId, movementType, quantityChange, referenceId = null, reason = '', createdBy = null) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get current stock
        const [productItemResult] = await connection.query(
            'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
            [productItemId]
        );

        if (productItemResult.length === 0) {
            throw new Error('Product not found');
        }

        const quantityBefore = productItemResult[0].qty_in_stock;
        const quantityAfter = quantityBefore + quantityChange;
        
        // Prevent negative stock
        if (quantityAfter < 0) {
            throw new Error('Insufficient stock quantity');
        }
        
        // Update product stock
        await connection.query(
            'UPDATE product_item SET qty_in_stock = ? WHERE product_item_id = ?',
            [quantityAfter, productItemId]
        );
        
        // Record stock movement
        await connection.query(
            `INSERT INTO stock_movements 
             (product_item_id, movement_type, quantity_change, quantity_before, quantity_after, reference_id, reason, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [productItemId, movementType, quantityChange, quantityBefore, quantityAfter, referenceId, reason, createdBy]
        );
        
        await connection.commit();
        return {quantityBefore, quantityAfter};
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Get current stock levels for products
async function getStockLevels(req, res) {
    try {
        const { page = 1, limit = 50, category, lowStock, productId } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT pi.product_item_id, pi.qty_in_stock, pi.sku, pi.price,
                p.product_id, p.productname, p.description, c.name as category_name,
                   CASE 
                       WHEN pi.qty_in_stock <= 10 THEN 'Low'
                       WHEN pi.qty_in_stock <= 50 THEN 'Medium'
                       ELSE 'Good'
                   END as stock_status
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
        `;
        
        const params = [];
        const conditions = [];
        
        if (category) {
            conditions.push('c.name = ?');
            params.push(category);
        }

        if(productId){
            conditions.push('p.product_id = ?');
            params.push(productId);
        }
        
        if (lowStock === 'true') {
            conditions.push('pi.qty_in_stock <= 10');
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY pi.qty_in_stock ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [results] = await pool.query(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id`;

        const countParams = [];
        
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
            // Add the same category parameter if it exists
            if (category) countParams.push(category);
            if (productId) countParams.push(productId);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting stock levels:', error);
        res.status(500).json({ Message: 'Failed to get stock levels' });
    }
};

// Update stock quantity for a product
async function updateStock(req, res) {
    try {
        const { productItemId } = req.params;
        const { quantity, reason = 'Manual adjustment' } = req.body;
        const userId = req.user?.user_id;
        
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ Message: 'Valid quantity is required' });
        }
        
        // Get current stock to calculate the change
        const [productItemResult] = await pool.query(
            'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
            [productItemId]
        );

        if (productItemResult.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        const currentStock = productItemResult[0].qty_in_stock;
        const quantityChange = parseInt(quantity) - currentStock;
        const movementType = quantityChange > 0 ? 'restock' : 'adjustment';
        
        const result = await recordStockMovement(
            productItemId,
            movementType, 
            quantityChange, 
            null, 
            reason, 
            userId
        );
        
        res.json({
            Message: 'Stock updated successfully',
            data: {
                productItemId,
                sku: productItemResult[0].sku,
                previousStock: result.quantityBefore,
                newStock: result.quantityAfter,
                change: quantityChange
            }
        });
        
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ 
            Message: error.message || 'Failed to update stock'
        });
    }
};

// Get products with low stock (≤ 10 items)
async function getLowStockProducts(req, res) {
    try {
        const { threshold = 10 } = req.query;
        
        const [results] = await pool.query(`
            SELECT pi.product_item_id, pi.qty_in_stock, pi.sku, pi.price,
                p.product_id, p.productname, p.description, 
                c.name as category_name
            FROM product_item pi
            JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE pi.qty_in_stock <= ?
            ORDER BY pi.qty_in_stock ASC
        `, [threshold]);
        
        res.json({
            data: results,
            count: results.length,
            threshold: parseInt(threshold)
        });
        
    } catch (error) {
        console.error('Error getting low stock products:', error);
        res.status(500).json({ Message: 'Failed to get low stock products' });
    }
}

// Bulk update stock for multiple products
async function bulkUpdateStock(req, res) {
    try {
        const { updates, reason = 'Bulk update' } = req.body;
        const userId = req.user?.user_id;
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({  
                Message: 'Updates array is required' 
            });
        }
        
        const results = [];
        const errors = [];
        
        for (const update of updates) {
            const { productItemId, quantity } = update;
            
            try {
                // Get current stock
                const [productItemResult] = await pool.query(
                    'SELECT qty_in_stock FROM product_item WHERE product_item_id = ?',
                    [productItemId]
                );
                
                if (productItemResult.length === 0) {
                    errors.push({ productItemId, error: 'Product not found' });
                    continue;
                }

                const currentStock = productItemResult[0].qty_in_stock;
                const quantityChange = parseInt(quantity) - currentStock;
                const movementType = quantityChange > 0 ? 'restock' : 'adjustment';
                
                const result = await recordStockMovement(
                    productItemId, 
                    movementType, 
                    quantityChange, 
                    null, 
                    reason, 
                    userId
                );
                
                results.push({
                    productItemId,
                    sku: productItemResult[0].sku,
                    previousStock: result.quantityBefore,
                    newStock: result.quantityAfter,
                    change: quantityChange
                });
                
            } catch (error) {
                errors.push({ productItemId, ERROR: error.message });
            }
        }
        
        res.json({
            Message: `Updated ${results.length} products`,
            data: {
                successful: results,
                errors: errors,
                successCount: results.length,
                errorCount: errors.length
            }
        });
        
    } catch (error) {
        console.error('Error bulk updating stock:', error);
        res.status(500).json({ Message: 'Failed to bulk update stock' });
    }
};

// Get stock movement history
async function getStockMovements(req, res) {
    try {
        const { productItemId } = req.params;
        const { page = 1, limit = 20, movementType, dateFrom, dateTo } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT sm.*, pi.sku, p.productname, u.firstName, u.lastName
            FROM stock_movements sm
            LEFT JOIN product_item pi ON sm.product_item_id = pi.product_item_id
            LEFT JOIN products p ON pi.product_id = p.product_id
            LEFT JOIN users u ON sm.created_by = u.user_id
            WHERE sm.product_item_id = ?
        `;
        
        const params = [productItemId];
        
        if (movementType) {
            query += ' AND sm.movement_type = ?';
            params.push(movementType);
        }
        
        if (dateFrom) {
            query += ' AND sm.created_at >= ?';
            params.push(dateFrom);
        }
        
        if (dateTo) {
            query += ' AND sm.created_at <= ?';
            params.push(dateTo);
        }
        
        query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [results] = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM stock_movements WHERE product_item_id = ?';
        const countParams = [productItemId];

        if (movementType) {
            countQuery += ' AND movement_type = ?';
            countParams.push(movementType);
        }
        
        if (dateFrom) {
            countQuery += ' AND created_at >= ?';
            countParams.push(dateFrom);
        }
        
        if (dateTo) {
            countQuery += ' AND created_at <= ?';
            countParams.push(dateTo);
        }
        
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            Message: `Found ${results.length} movements`,
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error getting stock movements:', error);
        res.status(500).json({ Message: 'Failed to get stock movements' });
    }
};

module.exports = {
    getStockLevels,
    updateStock,
    getLowStockProducts,
    bulkUpdateStock,
    getStockMovements
};
