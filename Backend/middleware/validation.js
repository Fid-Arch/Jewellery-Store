const Joi = require('joi');
const validator = require('validator');
const xss = require('xss');

// Validation middleware factory
const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all validation errors
            allowUnknown: false, // Don't allow unknown fields
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        // Replace the original data with validated/sanitized data
        req[property] = value;
        next();
    };
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // XSS protection
                obj[key] = xss(obj[key], {
                    whiteList: {}, // No HTML tags allowed
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script']
                });
                
                // Trim whitespace
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
        sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
        sanitizeObject(req.params);
    }

    next();
};

// Custom Joi validators
const customValidators = {
    // Strong password validation
    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
        .messages({
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        }),

    // Email validation
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .max(255)
        .lowercase()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),

    // Phone number validation
    phone: Joi.string()
        .pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),

    // Price validation (positive number with max 2 decimal places)
    price: Joi.number()
        .positive()
        .precision(2)
        .max(999999.99)
        .messages({
            'number.positive': 'Price must be a positive number',
            'number.precision': 'Price can have maximum 2 decimal places'
        }),

    // MongoDB ObjectId validation (if you plan to use MongoDB)
    objectId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid ID format'
        }),

    // URL validation
    url: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .max(2048),

    // Postcode validation (Australian format)
    postcode: Joi.string()
        .pattern(/^\d{4}$/)
        .messages({
            'string.pattern.base': 'Postcode must be 4 digits'
        })
};

// Error handling for validation
const handleValidationError = (error, req, res, next) => {
    if (error.isJoi) {
        const errorMessages = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context.value
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }
    next(error);
};

module.exports = {
    validateRequest,
    sanitizeInput,
    customValidators,
    handleValidationError
};