/**
 * Notification Helper - Easy integration with existing controllers
 * Use these functions to trigger notifications from your existing code
 */

const pool = require('../config/database');
const NotificationService = require('../services/notificationService');

class NotificationHelper {
    
    /**
     * Send order status update notification
     * Call this when order status changes
     */
    static async sendOrderStatusUpdate(orderId, status, trackingNumber = null) {
        try {
            // Get order and user details
            const [orders] = await pool.query(`
                SELECT o.*, u.firstName, u.lastName, u.email, u.phone, u.email_notifications, u.sms_notifications
                FROM orders o
                JOIN users u ON o.user_id = u.user_id
                WHERE o.order_id = ?
            `, [orderId]);
            
            if (orders.length === 0) {
                console.log('Order not found for notification');
                return { success: false, message: 'Order not found' };
            }
            
            const order = orders[0];
            const user = {
                first_name: order.firstName,
                last_name: order.lastName,
                email: order.email,
                phone: order.phone,
                email_notifications: order.email_notifications,
                sms_notifications: order.sms_notifications
            };
            
            const results = [];
            
            // Send email notification
            if (user.email_notifications) {
                const emailResult = await NotificationService.sendOrderStatusUpdate(user, order, status, trackingNumber);
                results.push({ type: 'email', result: emailResult });
            }
            
            // Send SMS notification
            if (user.sms_notifications && user.phone) {
                const smsResult = await NotificationService.sendOrderStatusSMS(user, order, status, trackingNumber);
                results.push({ type: 'sms', result: smsResult });
            }
            
            // Log notification
            await pool.query(
                'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                [order.user_id, 'order_status', 'email_sms', 'sent', `Order status update: ${status} for order #${orderId}`]
            );
            
            return { success: true, results };
        } catch (error) {
            console.error('Error sending order status update:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Send welcome email to new user
     * Call this after user registration
     */
    static async sendWelcomeEmail(userId, userEmail, firstName, lastName) {
        try {
            const user = {
                first_name: firstName,
                last_name: lastName,
                email: userEmail,
                email_notifications: true
            };
            
            const result = await NotificationService.sendWelcomeEmail(user);
            
            // Log notification
            if (result.success) {
                await pool.query(
                    'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                    [userId, 'welcome', 'email', 'sent', `Welcome email sent to ${userEmail}`]
                );
            }
            
            return result;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Send promotional email to multiple users
     * Call this for marketing campaigns
     */
    static async sendPromotionalCampaign(userIds, promotion) {
        try {
            // Get users who want marketing emails
            const [users] = await pool.query(`
                SELECT user_id, firstName, lastName, email, marketing_emails
                FROM users 
                WHERE user_id IN (${userIds.map(() => '?').join(',')}) 
                AND marketing_emails = 1
            `, userIds);
            
            const results = [];
            
            for (const user of users) {
                const userData = {
                    first_name: user.firstName,
                    last_name: user.lastName,
                    email: user.email,
                    marketing_emails: user.marketing_emails
                };
                
                const result = await NotificationService.sendPromotionalEmail(userData, promotion);
                results.push({ userId: user.user_id, email: user.email, result });
                
                // Log notification
                if (result.success) {
                    await pool.query(
                        'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                        [user.user_id, 'promotional', 'email', 'sent', `Promotional email: ${promotion.subject}`]
                    );
                }
            }
            
            return { success: true, results };
        } catch (error) {
            console.error('Error sending promotional campaign:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Send stock alert to users
     * Call this when stock is low
     */
    static async sendStockAlert(productId, userIds) {
        try {
            // Get product details
            const [products] = await pool.query(
                'SELECT * FROM products WHERE product_id = ?',
                [productId]
            );
            
            if (products.length === 0) {
                return { success: false, message: 'Product not found' };
            }
            
            const product = products[0];
            
            // Get users who want stock alerts
            const [users] = await pool.query(`
                SELECT user_id, firstName, lastName, email, email_notifications
                FROM users 
                WHERE user_id IN (${userIds.map(() => '?').join(',')}) 
                AND email_notifications = 1
            `, userIds);
            
            const results = [];
            
            for (const user of users) {
                const userData = {
                    first_name: user.firstName,
                    last_name: user.lastName,
                    email: user.email,
                    email_notifications: user.email_notifications
                };
                
                const result = await NotificationService.sendStockAlertEmail(userData, product);
                results.push({ userId: user.user_id, email: user.email, result });
                
                // Log notification
                if (result.success) {
                    await pool.query(
                        'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                        [user.user_id, 'stock_alert', 'email', 'sent', `Stock alert for ${product.name}`]
                    );
                }
            }
            
            return { success: true, results };
        } catch (error) {
            console.error('Error sending stock alert:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Trigger back-in-stock notifications
     * Call this when inventory is restocked
     */
    static async triggerBackInStockNotifications(productId, productItemId = null) {
        try {
            // Get all active subscriptions for this product
            const [subscriptions] = await pool.query(
                'SELECT * FROM stock_notifications WHERE product_id = ? AND (product_item_id = ? OR product_item_id IS NULL) AND status = "active"',
                [productId, productItemId]
            );
            
            // Get product details
            const [products] = await pool.query(
                'SELECT * FROM products WHERE product_id = ?',
                [productId]
            );
            
            if (products.length === 0) {
                console.log('Product not found for back-in-stock notification');
                return { success: false, message: 'Product not found' };
            }
            
            const product = products[0];
            const results = [];
            
            for (const subscription of subscriptions) {
                const user = {
                    first_name: subscription.email.split('@')[0], // Fallback name
                    email: subscription.email,
                    email_notifications: subscription.email_notification
                };
                
                const result = await NotificationService.sendBackInStockEmail(user, product);
                results.push({ subscriptionId: subscription.id, result });
                
                // Mark as notified
                await pool.query(
                    'UPDATE stock_notifications SET status = "notified", notified_at = NOW() WHERE id = ?',
                    [subscription.id]
                );
            }
            
            console.log(`Back-in-stock notifications sent to ${results.length} subscribers`);
            return { success: true, results };
        } catch (error) {
            console.error('Error triggering back-in-stock notifications:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = NotificationHelper;
