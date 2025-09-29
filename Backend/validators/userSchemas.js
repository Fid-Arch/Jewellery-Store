const Joi = require('joi');
const { customValidators } = require('../middleware/validation');

// User Authentication Schemas
const userSchemas = {
    // User Registration
    register: Joi.object({
        firstName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .required()
            .messages({
                'string.pattern.base': 'First name can only contain letters, spaces, hyphens and apostrophes'
            }),
        
        lastName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Last name can only contain letters, spaces, hyphens and apostrophes'
            }),
        
        email: customValidators.email.required(),
        
        password: customValidators.password.required(),
        
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Passwords do not match'
            }),
        
        phoneNumber: customValidators.phone.optional(),
        
        roles_id: Joi.number()
            .integer()
            .positive()
            .default(2) // Default to customer role
            .optional(),
        
        dateOfBirth: Joi.date()
            .max('now')
            .min('1900-01-01')
            .optional(),
        
        // Marketing preferences
        marketing_emails: Joi.boolean().default(false),
        email_notifications: Joi.boolean().default(true),
        sms_notifications: Joi.boolean().default(false)
    }),

    // User Login
    login: Joi.object({
        email: customValidators.email.required(),
        password: Joi.string()
            .min(1)
            .max(128)
            .required()
            .messages({
                'string.empty': 'Password is required'
            })
    }),

    // Update Profile
    updateProfile: Joi.object({
        firstName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .optional(),
        
        lastName: Joi.string()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s'-]+$/)
            .optional(),
        
        phoneNumber: customValidators.phone.optional().allow('', null),
        
        dateOfBirth: Joi.date()
            .max('now')
            .min('1900-01-01')
            .optional().allow(null),
        
        marketing_emails: Joi.boolean().optional(),
        email_notifications: Joi.boolean().optional(),
        sms_notifications: Joi.boolean().optional()
    }),

    // Change Password
    changePassword: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                'string.empty': 'Current password is required'
            }),
        
        newPassword: customValidators.password.required(),
        
        confirmPassword: Joi.string()
            .valid(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'New passwords do not match'
            })
    })
};

module.exports = userSchemas;