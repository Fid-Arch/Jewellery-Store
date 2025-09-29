const Joi = require('joi');
const { customValidators } = require('../middleware/validation');

// Order Management Schemas
const orderSchemas = {
    // Create Order
    createOrder: Joi.object({
        // Cart items
        items: Joi.array()
            .items(
                Joi.object({
                    product_item_id: Joi.number().integer().positive().required(),
                    quantity: Joi.number().integer().positive().max(10).required(),
                    unit_price: customValidators.price.required()
                })
            )
            .min(1)
            .max(50)
            .required(),
        
        // Shipping Address
        shipping_address: Joi.object({
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            address_line_1: Joi.string().min(5).max(255).required(),
            address_line_2: Joi.string().max(255).optional().allow('', null),
            city: Joi.string().min(2).max(100).required(),
            state: Joi.string().min(2).max(100).required(),
            postcode: customValidators.postcode.required(),
            country: Joi.string().min(2).max(100).default('Australia'),
            phone: customValidators.phone.optional()
        }).required(),
        
        // Billing Address (optional, defaults to shipping)
        billing_address: Joi.object({
            firstName: Joi.string().min(2).max(50),
            lastName: Joi.string().min(2).max(50),
            address_line_1: Joi.string().min(5).max(255),
            address_line_2: Joi.string().max(255).allow('', null),
            city: Joi.string().min(2).max(100),
            state: Joi.string().min(2).max(100),
            postcode: customValidators.postcode,
            country: Joi.string().min(2).max(100).default('Australia'),
            phone: customValidators.phone.optional()
        }).optional(),
        
        // Payment
        payment_method: Joi.string()
            .valid('stripe', 'paypal', 'bank_transfer')
            .default('stripe')
            .required(),
        
        // Shipping
        shipping_method: Joi.number()
            .integer()
            .positive()
            .required(),
        
        // Promotion
        promotion_code: Joi.string()
            .max(50)
            .optional()
            .allow('', null),
        
        // Special instructions
        notes: Joi.string()
            .max(500)
            .optional()
            .allow('', null),
        
        // Gift options
        is_gift: Joi.boolean().default(false),
        gift_message: Joi.string()
            .max(500)
            .optional()
            .allow('', null),
        
        // Newsletter subscription during checkout
        subscribe_newsletter: Joi.boolean().default(false)
    }),

    // Update Order Status (Admin)
    updateOrderStatus: Joi.object({
        order_status: Joi.string()
            .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
            .required(),
        
        tracking_number: Joi.string()
            .max(100)
            .optional()
            .allow('', null),
        
        notes: Joi.string()
            .max(1000)
            .optional()
            .allow('', null),
        
        notify_customer: Joi.boolean().default(true)
    }),

    // Order Filters (Admin)
    orderFilters: Joi.object({
        status: Joi.string()
            .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
            .optional(),
        
        customer_id: Joi.number().integer().positive().optional(),
        
        date_from: Joi.date().optional(),
        date_to: Joi.date().optional(),
        
        min_amount: customValidators.price.optional(),
        max_amount: customValidators.price.optional(),
        
        payment_status: Joi.string()
            .valid('pending', 'paid', 'failed', 'refunded')
            .optional(),
        
        sort_by: Joi.string()
            .valid('created_at', 'order_total', 'customer_name')
            .default('created_at')
            .optional(),
        
        sort_order: Joi.string()
            .valid('asc', 'desc')
            .default('desc')
            .optional(),
        
        page: Joi.number().integer().positive().default(1).optional(),
        limit: Joi.number().integer().positive().max(100).default(20).optional()
    }),

    // Return/Refund Request
    returnRequest: Joi.object({
        order_id: Joi.number().integer().positive().required(),
        
        items: Joi.array()
            .items(
                Joi.object({
                    product_item_id: Joi.number().integer().positive().required(),
                    quantity: Joi.number().integer().positive().required(),
                    reason: Joi.string()
                        .valid('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other')
                        .required()
                })
            )
            .min(1)
            .required(),
        
        reason_details: Joi.string()
            .max(1000)
            .required(),
        
        return_type: Joi.string()
            .valid('refund', 'exchange')
            .required(),
        
        images: Joi.array()
            .items(customValidators.url)
            .max(5)
            .optional()
    })
};

module.exports = orderSchemas;