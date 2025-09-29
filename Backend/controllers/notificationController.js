const pool = require('../config/database');
const notificationService = require('../services/notificationService');

// Send welcome email to new user
async function sendWelcomeNotification(req, res) {
    try {
        const { userId, email, firstName, lastName } = req.body;
        
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            welcomeMessage: `Welcome to Goldmarks Jewellery! We're thrilled to have you join our family of jewelry enthusiasts.`,
            benefits: [
                'Exclusive access to new collections',
                'Special member discounts and promotions',
                'Priority customer support',
                'Personalized jewelry recommendations'
            ],
            ctaText: 'Start Shopping',
            ctaUrl: `${process.env.FRONTEND_URL}/products`
        };

        const emailResult = await notificationService.sendEmail({
            to: email,
            subject: `Welcome to Goldmarks Jewellery, ${firstName}!`,
            template: 'welcome',
            data: {
                content: `
                    <h3>Dear ${firstName} ${lastName},</h3>
                    <p>${userData.welcomeMessage}</p>
                    <p>As a valued member, you'll enjoy:</p>
                    <ul>
                        ${userData.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${userData.ctaUrl}" style="background-color: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${userData.ctaText}</a>
                    </div>
                    <p>If you have any questions, our customer support team is here to help!</p>
                `
            }
        });

        // Log notification in database
        if (emailResult.success) {
            await pool.query(
                'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                [userId, 'welcome', 'email', 'sent', `Welcome email sent to ${email}`]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Welcome notification sent successfully',
            emailResult
        });
    } catch (error) {
        console.error('Error sending welcome notification:', error);
        res.status(500).json({ message: 'Error sending welcome notification' });
    }
}

// Send order confirmation notification
async function sendOrderConfirmation(req, res) {
    try {
        const { orderId, userId, email, firstName } = req.body;
        
        // Get order details
        const [orders] = await pool.query(`
            SELECT o.*, u.firstName, u.lastName, u.email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `, [orderId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orders[0];
        
        // Get order items
        const [orderItems] = await pool.query(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `, [orderId]);

        const orderData = {
            orderNumber: order.order_id,
            orderDate: new Date(order.created_at).toLocaleDateString(),
            totalAmount: order.total_amount,
            items: orderItems,
            shippingAddress: order.shipping_address || 'Address on file',
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };

        const emailResult = await notificationService.sendEmail({
            to: order.email,
            subject: `Order Confirmation #${orderData.orderNumber}`,
            template: 'order-confirmation',
            data: {
                content: `
                    <h3>Dear ${order.firstName},</h3>
                    <p>Thank you for your order! We're excited to prepare your beautiful jewelry for you.</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #d4af37;">Order Details</h4>
                        <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
                        <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
                        <p><strong>Total Amount:</strong> $${orderData.totalAmount}</p>
                        <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #d4af37;">Items Ordered</h4>
                        ${orderData.items.map(item => `
                            <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                                <p style="margin: 0;"><strong>${item.product_name}</strong></p>
                                <p style="margin: 0; color: #666;">Quantity: ${item.quantity} | Price: $${item.price}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <p>We'll send you another email with tracking information once your order ships.</p>
                `
            }
        });

        // Log notification
        if (emailResult.success) {
            await pool.query(
                'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                [userId, 'order_confirmation', 'email', 'sent', `Order confirmation sent for order #${orderId}`]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Order confirmation sent successfully',
            emailResult
        });
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        res.status(500).json({ message: 'Error sending order confirmation' });
    }
}

// Send promotional notification
async function sendPromotionalNotification(req, res) {
    try {
        const { userIds, subject, content, promotionCode, discountAmount, expiryDate } = req.body;
        
        const results = [];
        
        // Get user details
        const [users] = await pool.query(
            `SELECT user_id, firstName, lastName, email, marketing_emails 
             FROM users 
             WHERE user_id IN (${userIds.map(() => '?').join(',')}) 
             AND marketing_emails = 1`,
            userIds
        );
        
        for (const user of users) {
            const emailResult = await notificationService.sendEmail({
                to: user.email,
                subject: subject,
                template: 'promotional',
                data: {
                    content: `
                        <h3>Dear ${user.firstName},</h3>
                        ${content}
                        
                        ${promotionCode ? `
                            <div style="background: linear-gradient(135deg, #d4af37, #f4d03f); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                                <h3 style="color: white; margin: 0 0 10px 0;">Use Code:</h3>
                                <div style="background: white; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; color: #d4af37; letter-spacing: 3px;">
                                    ${promotionCode}
                                </div>
                                <p style="color: white; margin: 15px 0 0 0; font-size: 14px;">
                                    Save ${discountAmount}${discountAmount.includes('%') ? '' : '$'} • Valid until ${expiryDate}
                                </p>
                            </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/products" style="background-color: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop Now</a>
                        </div>
                    `
                }
            });
            
            results.push({ userId: user.user_id, email: user.email, result: emailResult });
            
            // Log notification
            if (emailResult.success) {
                await pool.query(
                    'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                    [user.user_id, 'promotional', 'email', 'sent', `Promotional email: ${subject}`]
                );
            }
        }

        res.status(200).json({
            success: true,
            message: `Promotional notifications sent to ${results.length} users`,
            results: results
        });
    } catch (error) {
        console.error('Error sending promotional notification:', error);
        res.status(500).json({ message: 'Error sending promotional notification' });
    }
}

// Update user notification preferences
async function updateNotificationPreferences(req, res) {
    try {
        const userId = req.user.user_id;
        const { email_notifications, sms_notifications, marketing_emails } = req.body;
        
        await pool.query(
            'UPDATE users SET email_notifications = ?, sms_notifications = ?, marketing_emails = ? WHERE user_id = ?',
            [email_notifications, sms_notifications, marketing_emails, userId]
        );
        
        res.status(200).json({
            success: true,
            message: 'Notification preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ message: 'Error updating notification preferences' });
    }
}

// Get user notification preferences
async function getNotificationPreferences(req, res) {
    try {
        const userId = req.user.user_id;
        
        const [users] = await pool.query(
            'SELECT email_notifications, sms_notifications, marketing_emails FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({
            success: true,
            preferences: users[0]
        });
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        res.status(500).json({ message: 'Error getting notification preferences' });
    }
}

// Get notification history for user
async function getNotificationHistory(req, res) {
    try {
        const userId = req.user.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const [notifications] = await pool.query(
            `SELECT * FROM notification_log 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM notification_log WHERE user_id = ?',
            [userId]
        );
        
        res.status(200).json({
            success: true,
            notifications: notifications,
            pagination: {
                page: page,
                limit: limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting notification history:', error);
        res.status(500).json({ message: 'Error getting notification history' });
    }
}

// Send order status update notification
async function sendOrderStatusUpdate(req, res) {
    try {
        const { orderId, status, trackingNumber } = req.body;
        
        // Get order and user details
        const [orders] = await pool.query(`
            SELECT o.*, u.firstName, u.lastName, u.email, u.phone, u.email_notifications, u.sms_notifications
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `, [orderId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
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
            const emailResult = await notificationService.sendOrderStatusUpdate(user, order, status, trackingNumber);
            results.push({ type: 'email', result: emailResult });
        }
        
        // Send SMS notification
        if (user.sms_notifications && user.phone) {
            const smsResult = await notificationService.sendOrderStatusSMS(user, order, status, trackingNumber);
            results.push({ type: 'sms', result: smsResult });
        }
        
        // Log notification
        await pool.query(
            'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
            [order.user_id, 'order_status', 'email_sms', 'sent', `Order status update: ${status} for order #${orderId}`]
        );
        
        res.status(200).json({
            success: true,
            message: 'Order status notification sent successfully',
            results: results
        });
    } catch (error) {
        console.error('Error sending order status update:', error);
        res.status(500).json({ message: 'Error sending order status update' });
    }
}

// Send stock alert notification
async function sendStockAlert(req, res) {
    try {
        const { productId, userIds } = req.body;
        
        // Get product details
        const [products] = await pool.query(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        );
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
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
            
            const result = await notificationService.sendStockAlertEmail(userData, product);
            results.push({ userId: user.user_id, email: user.email, result });
            
            // Log notification
            if (result.success) {
                await pool.query(
                    'INSERT INTO notification_log (user_id, type, channel, status, content) VALUES (?, ?, ?, ?, ?)',
                    [user.user_id, 'stock_alert', 'email', 'sent', `Stock alert for ${product.name}`]
                );
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Stock alert sent to ${results.length} users`,
            results: results
        });
    } catch (error) {
        console.error('Error sending stock alert:', error);
        res.status(500).json({ message: 'Error sending stock alert' });
    }
}

// Subscribe to back-in-stock notifications
async function subscribeBackInStock(req, res) {
    try {
        const userId = req.user.user_id;
        const { productId, productItemId, emailNotification = true, smsNotification = false } = req.body;
        
        // Get user details
        const [users] = await pool.query(
            'SELECT email, phone FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        // Check if already subscribed
        const [existing] = await pool.query(
            'SELECT id FROM stock_notifications WHERE user_id = ? AND product_id = ? AND product_item_id = ?',
            [userId, productId, productItemId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already subscribed to notifications for this product' });
        }
        
        // Subscribe to notifications
        await pool.query(
            'INSERT INTO stock_notifications (user_id, product_id, product_item_id, email, phone, email_notification, sms_notification) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, productId, productItemId, user.email, user.phone, emailNotification, smsNotification]
        );
        
        res.status(200).json({
            success: true,
            message: 'Successfully subscribed to back-in-stock notifications'
        });
    } catch (error) {
        console.error('Error subscribing to back-in-stock:', error);
        res.status(500).json({ message: 'Error subscribing to notifications' });
    }
}

// Unsubscribe from back-in-stock notifications
async function unsubscribeBackInStock(req, res) {
    try {
        const userId = req.user.user_id;
        const { productId } = req.params;
        const { productItemId } = req.query;
        
        await pool.query(
            'DELETE FROM stock_notifications WHERE user_id = ? AND product_id = ? AND product_item_id = ?',
            [userId, productId, productItemId]
        );
        
        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from notifications'
        });
    } catch (error) {
        console.error('Error unsubscribing from back-in-stock:', error);
        res.status(500).json({ message: 'Error unsubscribing from notifications' });
    }
}

// Trigger back-in-stock notifications (called when inventory is updated)
async function triggerBackInStockNotifications(productId, productItemId = null) {
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
            return;
        }
        
        const product = products[0];
        const results = [];
        
        for (const subscription of subscriptions) {
            const user = {
                first_name: subscription.email.split('@')[0], // Fallback name
                email: subscription.email,
                email_notifications: subscription.email_notification
            };
            
            const result = await notificationService.sendBackInStockEmail(user, product);
            results.push({ subscriptionId: subscription.id, result });
            
            // Mark as notified
            await pool.query(
                'UPDATE stock_notifications SET status = "notified", notified_at = NOW() WHERE id = ?',
                [subscription.id]
            );
        }
        
        console.log(`Back-in-stock notifications sent to ${results.length} subscribers`);
        return results;
    } catch (error) {
        console.error('Error triggering back-in-stock notifications:', error);
        return [];
    }
}

module.exports = {
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
};