const Joi = require('joi');

// Shipping Options Request Schema
const getShippingOptionsSchema = Joi.object({
    cartTotal: Joi.number().positive().required(),
    weight: Joi.number().positive().default(1),
    country: Joi.string().default('Australia'),
    postcode: Joi.string().pattern(/^\d{4}$/).when('country', {
        is: 'Australia',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    fromPostcode: Joi.string().pattern(/^\d{4}$/).default('3000'),
    length: Joi.number().positive().default(10),
    width: Joi.number().positive().default(10),
    height: Joi.number().positive().default(10)
});

// Create Shipping Label Schema
const createShippingLabelSchema = Joi.object({
    orderId: Joi.number().integer().positive().required(),
    shippingMethod: Joi.string().valid('standard', 'express', 'overnight', 'economy').required(),
    toAddress: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        company: Joi.string().max(100).optional(),
        addressLine1: Joi.string().min(5).max(200).required(),
        addressLine2: Joi.string().max(200).optional(),
        suburb: Joi.string().min(2).max(100).required(),
        state: Joi.string().valid('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT').required(),
        postcode: Joi.string().pattern(/^\d{4}$/).required(),
        country: Joi.string().default('Australia')
    }).required(),
    fromAddress: Joi.object({
        name: Joi.string().min(2).max(100).default('Goldmarks Jewellery'),
        company: Joi.string().max(100).default('Goldmarks Jewellery Store'),
        addressLine1: Joi.string().min(5).max(200).required(),
        addressLine2: Joi.string().max(200).optional(),
        suburb: Joi.string().min(2).max(100).required(),
        state: Joi.string().valid('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT').required(),
        postcode: Joi.string().pattern(/^\d{4}$/).required(),
        country: Joi.string().default('Australia')
    }).optional(),
    packageDetails: Joi.object({
        weight: Joi.number().positive().required(),
        length: Joi.number().positive().default(10),
        width: Joi.number().positive().default(10),
        height: Joi.number().positive().default(10),
        contents: Joi.string().max(500).default('Jewellery items')
    }).required()
});

// Track Order Schema
const trackOrderSchema = Joi.object({
    orderId: Joi.number().integer().positive().required()
});

// Add Shipping Address Schema
const addShippingAddressSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    company: Joi.string().max(100).optional().allow(''),
    addressLine1: Joi.string().min(5).max(200).required(),
    addressLine2: Joi.string().max(200).optional().allow(''),
    suburb: Joi.string().min(2).max(100).required(),
    state: Joi.string().valid('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT').required(),
    postcode: Joi.string().pattern(/^\d{4}$/).required(),
    country: Joi.string().default('Australia'),
    phone: Joi.string().pattern(/^(\+61|0)[2-9]\d{8}$/).optional(),
    isDefault: Joi.boolean().default(false),
    deliveryInstructions: Joi.string().max(500).optional().allow('')
});

// Update Shipping Address Schema  
const updateShippingAddressSchema = Joi.object({
    addressId: Joi.number().integer().positive().required(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    company: Joi.string().max(100).optional().allow(''),
    addressLine1: Joi.string().min(5).max(200).optional(),
    addressLine2: Joi.string().max(200).optional().allow(''),
    suburb: Joi.string().min(2).max(100).optional(),
    state: Joi.string().valid('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT').optional(),
    postcode: Joi.string().pattern(/^\d{4}$/).optional(),
    country: Joi.string().optional(),
    phone: Joi.string().pattern(/^(\+61|0)[2-9]\d{8}$/).optional(),
    isDefault: Joi.boolean().optional(),
    deliveryInstructions: Joi.string().max(500).optional().allow('')
});

// Shipping method schemas (keeping existing)
const createShippingMethod = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    base_cost: Joi.number().precision(2).min(0).optional(),
    cost_per_kg: Joi.number().precision(2).min(0).optional(),
    cost_per_km: Joi.number().precision(2).min(0).optional(),
    min_delivery_days: Joi.number().integer().min(0).optional(),
    max_delivery_days: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional(),
    free_shipping_threshold: Joi.number().precision(2).min(0).optional(),
    weight_limit: Joi.number().precision(2).min(0).optional(),
    size_restrictions: Joi.string().trim().max(255).optional()
});

const updateShippingMethod = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().trim().max(500).optional(),
    base_cost: Joi.number().precision(2).min(0).optional(),
    cost_per_kg: Joi.number().precision(2).min(0).optional(),
    cost_per_km: Joi.number().precision(2).min(0).optional(),
    min_delivery_days: Joi.number().integer().min(0).optional(),
    max_delivery_days: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional(),
    free_shipping_threshold: Joi.number().precision(2).min(0).optional(),
    weight_limit: Joi.number().precision(2).min(0).optional(),
    size_restrictions: Joi.string().trim().max(255).optional()
});

// Shipping calculation schema
const calculateShipping = Joi.object({
    shipping_method_id: Joi.number().integer().positive().required(),
    weight: Joi.number().precision(2).min(0.01).required(),
    destination: Joi.object({
        country: Joi.string().trim().min(2).max(50).required(),
        state: Joi.string().trim().min(2).max(50).optional(),
        city: Joi.string().trim().min(2).max(100).required(),
        postal_code: Joi.string().trim().min(3).max(20).required()
    }).required(),
    order_value: Joi.number().precision(2).min(0).optional()
});

// Shipment schemas
const createShipment = Joi.object({
    order_id: Joi.number().integer().positive().required(),
    shipping_method_id: Joi.number().integer().positive().required(),
    carrier: Joi.string().trim().min(2).max(100).required(),
    tracking_number: Joi.string().trim().min(5).max(100).required(),
    weight: Joi.number().precision(2).min(0.01).required(),
    dimensions: Joi.object({
        length: Joi.number().precision(2).min(0.1).required(),
        width: Joi.number().precision(2).min(0.1).required(),
        height: Joi.number().precision(2).min(0.1).required()
    }).optional(),
    shipping_cost: Joi.number().precision(2).min(0).required(),
    estimated_delivery: Joi.date().iso().min('now').required(),
    notes: Joi.string().trim().max(500).optional()
});

const updateShipmentStatus = Joi.object({
    status: Joi.string().valid(
        'pending', 
        'picked_up', 
        'in_transit', 
        'out_for_delivery', 
        'delivered', 
        'failed_delivery', 
        'returned'
    ).required(),
    location: Joi.string().trim().max(255).optional(),
    notes: Joi.string().trim().max(500).optional(),
    delivered_at: Joi.date().iso().optional()
});

// Delete Shipping Address Schema
const deleteShippingAddressSchema = Joi.object({
    addressId: Joi.number().integer().positive().required()
});

// Set Default Shipping Address Schema
const setDefaultAddressSchema = Joi.object({
    addressId: Joi.number().integer().positive().required()
});

// Validate Shipping Address Schema
const validateShippingAddressSchema = Joi.object({
    postcode: Joi.string().pattern(/^\d{4}$/).required(),
    country: Joi.string().default('Australia'),
    suburb: Joi.string().min(2).max(100).optional()
});

module.exports = {
    // New shipping schemas
    getShippingOptionsSchema,
    createShippingLabelSchema,
    trackOrderSchema,
    addShippingAddressSchema,
    updateShippingAddressSchema,
    deleteShippingAddressSchema,
    setDefaultAddressSchema,
    validateShippingAddressSchema,
    // Existing schemas
    createShippingMethod,
    updateShippingMethod,
    calculateShipping,
    createShipment,
    updateShipmentStatus
};