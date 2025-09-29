const Joi = require('joi');

// Get Stock Levels Schema (Query parameters)
const getStockLevelsSchema = Joi.object({
    productId: Joi.number().integer().positive().optional(),
    productItemId: Joi.number().integer().positive().optional(),
    lowStockThreshold: Joi.number().integer().min(0).default(10),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('product_name', 'qty_in_stock', 'last_updated').default('product_name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().trim().max(100).optional()
});

// Update Stock Schema
const updateStockSchema = Joi.object({
    productItemId: Joi.number().integer().positive().required(),
    newQuantity: Joi.number().integer().min(0).required(),
    movementType: Joi.string().valid(
        'restock', 
        'adjustment', 
        'damage', 
        'loss', 
        'transfer_in', 
        'transfer_out',
        'manual_adjustment',
        'return'
    ).required(),
    reason: Joi.string().trim().min(3).max(500).required(),
    referenceId: Joi.number().integer().positive().optional().allow(null),
    notes: Joi.string().trim().max(1000).optional().allow('')
});

// Bulk Update Stock Schema
const bulkUpdateStockSchema = Joi.object({
    updates: Joi.array().items(
        Joi.object({
            productItemId: Joi.number().integer().positive().required(),
            newQuantity: Joi.number().integer().min(0).required(),
            movementType: Joi.string().valid(
                'restock', 
                'adjustment', 
                'damage', 
                'loss', 
                'transfer_in', 
                'transfer_out',
                'manual_adjustment',
                'return'
            ).required(),
            reason: Joi.string().trim().min(3).max(500).required(),
            referenceId: Joi.number().integer().positive().optional().allow(null),
            notes: Joi.string().trim().max(1000).optional().allow('')
        })
    ).min(1).max(50).required(),
    batchReason: Joi.string().trim().min(3).max(500).required()
});

// Get Low Stock Products Schema (Query parameters)
const getLowStockSchema = Joi.object({
    threshold: Joi.number().integer().min(0).default(10),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    includeOutOfStock: Joi.boolean().default(true),
    categoryId: Joi.number().integer().positive().optional(),
    sortBy: Joi.string().valid('qty_in_stock', 'product_name', 'last_updated').default('qty_in_stock'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// Get Stock Movements Schema (Query parameters)
const getStockMovementsSchema = Joi.object({
    productItemId: Joi.number().integer().positive().optional(),
    productId: Joi.number().integer().positive().optional(),
    movementType: Joi.string().valid(
        'sale',
        'restock', 
        'adjustment', 
        'damage', 
        'loss', 
        'transfer_in', 
        'transfer_out',
        'manual_adjustment',
        'return'
    ).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('created_at', 'quantity_change', 'movement_type').default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    createdBy: Joi.number().integer().positive().optional()
});

// Legacy schemas (keeping for compatibility)
const updateStock = Joi.object({
    qty_in_stock: Joi.number().integer().min(0).required(),
    reason: Joi.string().trim().max(255).optional(),
    notes: Joi.string().trim().max(500).optional()
});

const addRemoveStock = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    reason: Joi.string().valid(
        'purchase', 
        'return', 
        'adjustment', 
        'damaged', 
        'theft', 
        'sale', 
        'transfer', 
        'audit'
    ).required(),
    notes: Joi.string().trim().max(500).optional(),
    reference_number: Joi.string().trim().max(100).optional()
});

const bulkUpdateStock = Joi.object({
    updates: Joi.array().items(
        Joi.object({
            product_item_id: Joi.number().integer().positive().required(),
            qty_in_stock: Joi.number().integer().min(0).required(),
            reason: Joi.string().trim().max(255).optional()
        })
    ).min(1).max(100).required(),
    notes: Joi.string().trim().max(500).optional()
});

module.exports = {
    // New comprehensive schemas
    getStockLevelsSchema,
    updateStockSchema,
    bulkUpdateStockSchema,
    getLowStockSchema,
    getStockMovementsSchema,
    // Legacy schemas (keeping for compatibility)
    updateStock,
    addRemoveStock,
    bulkUpdateStock
};