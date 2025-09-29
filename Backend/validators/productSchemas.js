const Joi = require('joi');
const { customValidators } = require('../middleware/validation');

// Product Management Schemas
const productSchemas = {
    // Create Product
    createProduct: Joi.object({
        name: Joi.string()
            .min(2)
            .max(255)
            .required()
            .messages({
                'string.empty': 'Product name is required'
            }),
        
        description: Joi.string()
            .max(2000)
            .required()
            .messages({
                'string.empty': 'Product description is required'
            }),
        
        category_id: Joi.number()
            .integer()
            .positive()
            .required(),
        
        supplier_id: Joi.number()
            .integer()
            .positive()
            .optional(),
        
        product_image: customValidators.url.optional().allow('', null),
        
        // SEO fields
        meta_title: Joi.string().max(60).optional(),
        meta_description: Joi.string().max(160).optional(),
        
        // Product status
        is_active: Joi.boolean().default(true),
        
        // Jewelry specific fields
        material: Joi.string()
            .max(100)
            .optional()
            .allow('', null),
        
        gemstone: Joi.string()
            .max(100)
            .optional()
            .allow('', null),
        
        carat_weight: Joi.number()
            .positive()
            .precision(2)
            .max(50)
            .optional()
            .allow(null),
        
        metal_purity: Joi.string()
            .valid('9K', '14K', '18K', '22K', '24K', 'Sterling Silver', 'Platinum')
            .optional()
            .allow('', null)
    }),

    // Update Product
    updateProduct: Joi.object({
        name: Joi.string()
            .min(2)
            .max(255)
            .optional(),
        
        description: Joi.string()
            .max(2000)
            .optional(),
        
        category_id: Joi.number()
            .integer()
            .positive()
            .optional(),
        
        supplier_id: Joi.number()
            .integer()
            .positive()
            .optional(),
        
        product_image: customValidators.url.optional().allow('', null),
        
        meta_title: Joi.string().max(60).optional(),
        meta_description: Joi.string().max(160).optional(),
        is_active: Joi.boolean().optional(),
        material: Joi.string().max(100).optional().allow('', null),
        gemstone: Joi.string().max(100).optional().allow('', null),
        carat_weight: Joi.number().positive().precision(2).max(50).optional().allow(null),
        metal_purity: Joi.string()
            .valid('9K', '14K', '18K', '22K', '24K', 'Sterling Silver', 'Platinum')
            .optional()
            .allow('', null)
    }),

    // Product Item (variants)
    createProductItem: Joi.object({
        product_id: Joi.number()
            .integer()
            .positive()
            .required(),
        
        SKU: Joi.string()
            .max(100)
            .required()
            .messages({
                'string.empty': 'SKU is required'
            }),
        
        price: customValidators.price.required(),
        
        qty_in_stock: Joi.number()
            .integer()
            .min(0)
            .max(99999)
            .required(),
        
        weight: Joi.number()
            .positive()
            .precision(2)
            .max(10000)
            .optional(),
        
        dimensions: Joi.string()
            .max(100)
            .optional()
            .allow('', null),
        
        product_image: customValidators.url.optional().allow('', null),
        
        // Jewelry specific
        ring_size: Joi.string()
            .max(10)
            .optional()
            .allow('', null),
        
        chain_length: Joi.number()
            .positive()
            .max(200)
            .optional()
            .allow(null)
    }),

    // Product filters for search/listing
    productFilters: Joi.object({
        category: Joi.number().integer().positive().optional(),
        min_price: Joi.number().positive().precision(2).optional(),
        max_price: Joi.number().positive().precision(2).optional(),
        material: Joi.string().max(100).optional(),
        gemstone: Joi.string().max(100).optional(),
        metal_purity: Joi.string()
            .valid('9K', '14K', '18K', '22K', '24K', 'Sterling Silver', 'Platinum')
            .optional(),
        in_stock: Joi.boolean().optional(),
        sort_by: Joi.string()
            .valid('name', 'price', 'created_at', 'popularity')
            .default('created_at')
            .optional(),
        sort_order: Joi.string()
            .valid('asc', 'desc')
            .default('desc')
            .optional(),
        page: Joi.number().integer().positive().default(1).optional(),
        limit: Joi.number().integer().positive().max(100).default(20).optional()
    })
};

module.exports = productSchemas;