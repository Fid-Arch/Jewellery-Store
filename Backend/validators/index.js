// Central exports for all validation schemas
const userSchemas = require('./userSchemas');
const productSchemas = require('./productSchemas');
const orderSchemas = require('./orderSchemas');
const { 
    addressSchemas, 
    cartSchemas, 
    wishlistSchemas, 
    promotionSchemas, 
    notificationSchemas 
} = require('./commonSchemas');

module.exports = {
    // User schemas
    user: userSchemas,
    
    // Product schemas
    product: productSchemas,
    
    // Order schemas
    order: orderSchemas,
    
    // Address schemas
    address: addressSchemas,
    
    // Cart schemas
    cart: cartSchemas,
    
    // Wishlist schemas
    wishlist: wishlistSchemas,
    
    // Promotion schemas
    promotion: promotionSchemas,
    
    // Notification schemas
    notification: notificationSchemas
};