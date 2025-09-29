/**
 * Order Controller Integration Example
 * This shows how to add notifications to your existing order controller
 */

const NotificationHelper = require('../utils/notificationHelper');

// Example: Add this to your existing createOrder function
async function createOrderWithNotifications(req, res) {
    // ... your existing order creation logic ...
    
    try {
        // After successfully creating the order
        const orderId = newOrder.order_id;
        
        // Send order confirmation notification
        const notificationResult = await NotificationHelper.sendOrderStatusUpdate(
            orderId, 
            'processing'
        );
        
        if (notificationResult.success) {
            console.log('Order confirmation notification sent');
        } else {
            console.log('Failed to send order confirmation:', notificationResult.error);
        }
        
        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder,
            notificationSent: notificationResult.success
        });
        
    } catch (error) {
        // Handle notification errors without failing the order creation
        console.error('Notification error:', error);
        res.status(201).json({
            message: 'Order created successfully (notification failed)',
            order: newOrder
        });
    }
}

// Example: Add this to your order status update function
async function updateOrderStatusWithNotifications(req, res) {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;
    
    try {
        // ... your existing order status update logic ...
        
        // Send status update notification
        const notificationResult = await NotificationHelper.sendOrderStatusUpdate(
            orderId, 
            status, 
            trackingNumber
        );
        
        if (notificationResult.success) {
            console.log(`Order status notification sent: ${status}`);
        } else {
            console.log('Failed to send status notification:', notificationResult.error);
        }
        
        res.json({
            message: 'Order status updated successfully',
            notificationSent: notificationResult.success
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
}

// Example: Add this to your user registration function
async function registerUserWithWelcomeEmail(req, res) {
    // ... your existing user registration logic ...
    
    try {
        // After successfully creating the user
        const welcomeResult = await NotificationHelper.sendWelcomeEmail(
            newUser.user_id,
            newUser.email,
            newUser.firstName,
            newUser.lastName
        );
        
        if (welcomeResult.success) {
            console.log('Welcome email sent');
        } else {
            console.log('Failed to send welcome email:', welcomeResult.error);
        }
        
        res.status(201).json({
            message: 'User registered successfully',
            welcomeEmailSent: welcomeResult.success
        });
        
    } catch (error) {
        console.error('Welcome email error:', error);
        res.status(201).json({
            message: 'User registered successfully (welcome email failed)',
            user: newUser
        });
    }
}

// Example: Add this to your inventory update function
async function updateInventoryWithStockAlerts(req, res) {
    const { productId } = req.params;
    const { newStock } = req.body;
    
    try {
        // ... your existing inventory update logic ...
        
        // Check if stock was 0 and now > 0 (back in stock)
        if (newStock > 0) {
            const backInStockResult = await NotificationHelper.triggerBackInStockNotifications(productId);
            if (backInStockResult.success) {
                console.log(`Back-in-stock notifications sent to ${backInStockResult.results.length} subscribers`);
            }
        }
        
        // Check if stock is low (less than 5 items)
        if (newStock > 0 && newStock <= 5) {
            // Get users who want stock alerts (you can customize this logic)
            const [users] = await pool.query(
                'SELECT user_id FROM users WHERE email_notifications = 1 LIMIT 10'
            );
            
            if (users.length > 0) {
                const userIds = users.map(user => user.user_id);
                const stockAlertResult = await NotificationHelper.sendStockAlert(productId, userIds);
                if (stockAlertResult.success) {
                    console.log(`Stock alert sent to ${stockAlertResult.results.length} users`);
                }
            }
        }
        
        res.json({
            message: 'Inventory updated successfully',
            stockAlertsSent: newStock <= 5
        });
        
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ message: 'Error updating inventory' });
    }
}

// Example: Add this to your admin promotional campaign function
async function sendPromotionalCampaign(req, res) {
    const { userIds, subject, content, promotionCode, discountAmount, expiryDate } = req.body;
    
    try {
        const promotion = {
            title: 'Special Promotion',
            subject: subject,
            content: content,
            code: promotionCode,
            discount: discountAmount,
            validUntil: expiryDate
        };
        
        const campaignResult = await NotificationHelper.sendPromotionalCampaign(userIds, promotion);
        
        res.json({
            message: 'Promotional campaign sent successfully',
            results: campaignResult.results
        });
        
    } catch (error) {
        console.error('Error sending promotional campaign:', error);
        res.status(500).json({ message: 'Error sending promotional campaign' });
    }
}

module.exports = {
    createOrderWithNotifications,
    updateOrderStatusWithNotifications,
    registerUserWithWelcomeEmail,
    updateInventoryWithStockAlerts,
    sendPromotionalCampaign
};
