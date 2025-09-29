const Joi = require('joi');
const { customValidators } = require('../middleware/validation');

// Address Management Schemas
const addressSchemas = {
    // Create/Update Address
    address: Joi.object({
        firstName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .required(),
        
        lastName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .required(),
        
        company: Joi.string()
            .max(100)
            .optional()
            .allow('', null),
        
        address_line_1: Joi.string()
            .min(5)
            .max(255)
            .required()
            .messages({
                'string.empty': 'Street address is required'
            }),
        
        address_line_2: Joi.string()
            .max(255)
            .optional()
            .allow('', null),
        
        city: Joi.string()
            .min(2)
            .max(100)
            .required(),
        
        state: Joi.string()
            .min(2)
            .max(100)
            .required(),
        
        postcode: customValidators.postcode.required(),
        
        country: Joi.string()
            .min(2)
            .max(100)
            .default('Australia')
            .required(),
        
        phone: customValidators.phone.optional().allow('', null),
        
        is_default: Joi.boolean().default(false),
        
        address_type: Joi.string()
            .valid('home', 'work', 'other')
            .default('home')
    })
};

// Cart Management Schemas
const cartSchemas = {
    // Add to Cart
    addToCart: Joi.object({
        product_item_id: Joi.number()
            .integer()
            .positive()
            .required(),
        
        quantity: Joi.number()
            .integer()
            .positive()
            .max(10)
            .required()
            .messages({
                'number.max': 'Maximum quantity per item is 10'
            }),
        
        // Optional customization for jewelry
        engraving_text: Joi.string()
            .max(50)
            .optional()
            .allow('', null),
        
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

    // Update Cart Item
    updateCartItem: Joi.object({
        quantity: Joi.number()
            .integer()
            .min(0)
            .max(10)
            .required(),
        
        engraving_text: Joi.string()
            .max(50)
            .optional()
            .allow('', null),
        
        ring_size: Joi.string()
            .max(10)
            .optional()
            .allow('', null),
        
        chain_length: Joi.number()
            .positive()
            .max(200)
            .optional()
            .allow(null)
    })
};

// Wishlist Management Schemas
const wishlistSchemas = {
    addToWishlist: Joi.object({
        product_id: Joi.number()
            .integer()
            .positive()
            .required()
    })
};

// Promotion Schemas
const promotionSchemas = {
    // Create Promotion (Admin)
    createPromotion: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .required(),
        
        description: Joi.string()
            .max(500)
            .optional()
            .allow('', null),
        
        promotionCode: Joi.string()
            .min(3)
            .max(50)
            .uppercase()
            .pattern(/^[A-Z0-9]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Promotion code can only contain uppercase letters and numbers'
            }),
        
        discountRate: Joi.number()
            .positive()
            .max(100)
            .precision(2)
            .required(),
        
        discountType: Joi.string()
            .valid('percentage', 'fixed_amount')
            .required(),
        
        minimumOrderValue: customValidators.price.optional(),
        
        usageLimit: Joi.number()
            .integer()
            .positive()
            .optional()
            .allow(null),
        
        startDate: Joi.date()
            .required(),
        
        endDate: Joi.date()
            .greater(Joi.ref('startDate'))
            .required(),
        
        applicableCategories: Joi.array()
            .items(Joi.number().integer().positive())
            .optional()
            .allow(null),
        
        isActive: Joi.boolean().default(true)
    }),

    // Validate Promotion Code
    validatePromotion: Joi.object({
        promotionCode: Joi.string()
            .min(3)
            .max(50)
            .required(),
        
        userId: Joi.number()
            .integer()
            .positive()
            .required(),
        
        cartTotal: customValidators.price.required(),
        
        cartItems: Joi.array()
            .items(Joi.object({
                product_id: Joi.number().integer().positive().required(),
                category_id: Joi.number().integer().positive().required(),
                price: customValidators.price.required(),
                quantity: Joi.number().integer().positive().required()
            }))
            .optional()
    }),

    // Apply Promotion
    applyPromotion: Joi.object({
        promotionCode: Joi.string()
            .min(3)
            .max(50)
            .required(),
        
        orderId: Joi.number()
            .integer()
            .positive()
            .required()
    }),

    // Update Promotion (Admin)
    updatePromotion: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .optional(),
        
        description: Joi.string()
            .max(500)
            .optional()
            .allow('', null),
        
        promotionCode: Joi.string()
            .min(3)
            .max(50)
            .uppercase()
            .pattern(/^[A-Z0-9]+$/)
            .optional()
            .messages({
                'string.pattern.base': 'Promotion code can only contain uppercase letters and numbers'
            }),
        
        discountRate: Joi.number()
            .positive()
            .max(100)
            .precision(2)
            .optional(),
        
        discountType: Joi.string()
            .valid('percentage', 'fixed_amount')
            .optional(),
        
        minimumOrderValue: customValidators.price.optional(),
        
        usageLimit: Joi.number()
            .integer()
            .positive()
            .optional()
            .allow(null),
        
        startDate: Joi.date()
            .optional(),
        
        endDate: Joi.date()
            .optional(),
        
        applicableCategories: Joi.array()
            .items(Joi.number().integer().positive())
            .optional()
            .allow(null),
        
        isActive: Joi.boolean().optional()
    }).min(1)
};

// Notification Schemas
const notificationSchemas = {
    // Newsletter Subscription
    newsletter: Joi.object({
        email: customValidators.email.required(),
        firstName: Joi.string().min(2).max(50).optional(),
        preferences: Joi.array()
            .items(Joi.string().valid('new_products', 'sales', 'exclusive_offers'))
            .optional()
    }),

    // Contact Form
    contact: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .required(),
        
        email: customValidators.email.required(),
        
        subject: Joi.string()
            .min(5)
            .max(200)
            .required(),
        
        message: Joi.string()
            .min(10)
            .max(2000)
            .required(),
        
        phone: customValidators.phone.optional()
    }),

    // Back in Stock Notification
    backInStock: Joi.object({
        product_id: Joi.number().integer().positive().required(),
        product_item_id: Joi.number().integer().positive().optional(),
        email: customValidators.email.optional() // Optional if user is logged in
    })
};

module.exports = {
    addressSchemas,
    cartSchemas,
    wishlistSchemas,
    promotionSchemas,
    notificationSchemas
};