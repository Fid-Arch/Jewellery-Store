const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
    subscribeBackInStock,
    unsubscribeBackInStock,
    triggerBackInStockNotifications,
    sendPromotionalEmail,
    sendPersonalPromotionalEmail,
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNotificationPreferences,
    updateNotificationPreferences
} = require('../controllers/notificationController');


// Back-in-stock notification routes
router.post('/notifications/back-in-stock', authenticateJWT, subscribeBackInStock);
router.delete('/notifications/back-in-stock/:product_id', authenticateJWT, unsubscribeBackInStock);

// Order status routes (admin only)
router.put('/orders/:order_id/status', authenticateJWT, authorizeAdminJWT, updateOrderStatus);

// Promotional email routes (admin only) - simplified, no campaign tables
router.post('/promotional-emails/send-bulk', authenticateJWT, authorizeAdminJWT, sendPromotionalEmail);
router.post('/promotional-emails/send-personal/:user_id', authenticateJWT, authorizeAdminJWT, sendPersonalPromotionalEmail);

// Newsletter routes (uses users table)
router.post('/newsletter/subscribe', subscribeNewsletter);
router.post('/newsletter/unsubscribe', unsubscribeNewsletter);

// User notification preferences
router.get('/user/notification-preferences', authenticateJWT, getNotificationPreferences);
router.put('/user/notification-preferences', authenticateJWT, updateNotificationPreferences);