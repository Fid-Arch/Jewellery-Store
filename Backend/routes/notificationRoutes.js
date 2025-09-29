const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
    sendWelcomeNotification,
    sendOrderConfirmation,
    sendPromotionalNotification,
    sendOrderStatusUpdate,
    sendStockAlert,
    subscribeBackInStock,
    unsubscribeBackInStock,
    triggerBackInStockNotifications,
    updateNotificationPreferences,
    getNotificationPreferences,
    getNotificationHistory
} = require('../controllers/notificationController');

// Welcome notification
router.post('/welcome', sendWelcomeNotification);

// Order notifications
router.post('/order-confirmation', sendOrderConfirmation);
router.post('/order-status', sendOrderStatusUpdate);

// Promotional notifications
router.post('/promotional', sendPromotionalNotification);

// Stock alert notifications
router.post('/stock-alert', sendStockAlert);

// Back-in-stock notification routes
router.post('/back-in-stock', authenticateJWT, subscribeBackInStock);
router.delete('/back-in-stock/:productId', authenticateJWT, unsubscribeBackInStock);

// User notification preferences
router.get('/preferences', authenticateJWT, getNotificationPreferences);
router.put('/preferences', authenticateJWT, updateNotificationPreferences);

// Notification history
router.get('/history', authenticateJWT, getNotificationHistory);

// Test notification endpoint
router.post('/test', async (req, res) => {
    try {
        const { type, email, phone } = req.body;
        const NotificationService = require('../services/notificationService');
        
        const testUser = {
            first_name: 'Test',
            last_name: 'User',
            email: email || 'test@example.com',
            phone: phone || '+1234567890',
            email_notifications: true,
            sms_notifications: true
        };
        
        let result;
        switch (type) {
            case 'welcome':
                result = await NotificationService.sendWelcomeEmail(testUser);
                break;
            case 'promotional':
                result = await NotificationService.sendPromotionalEmail(testUser, {
                    title: 'Test Promotion',
                    subject: 'Test Promotional Email',
                    content: 'This is a test promotional email.',
                    code: 'TEST20',
                    discount: '20%',
                    validUntil: '2025-12-31'
                });
                break;
            case 'sms':
                result = await NotificationService.sendSMS({
                    to: testUser.phone,
                    message: 'Test SMS from Goldmarks Jewellery'
                });
                break;
            default:
                return res.status(400).json({ message: 'Invalid test type' });
        }
        
        res.json({ success: true, result });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Test notification failed' });
    }
});

module.exports = router;