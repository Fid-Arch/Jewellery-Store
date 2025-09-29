const pool = require('../config/database');
const notificationService = require('../services/notificationService');

// Email Notification Function
async function subscribeBackInStock(req,res) {
    try {
        const user_id = req.user.user_id;
        const { product_id, product_item_id, email_notification = true, sms_notification = false } = req.body;

        if (!product_id) {
            return res.status(400).json({Message: 'Product ID is required'});
        }

        // Get user details
        const [userDetails] = await pool.query(
            'SELECT email, phoneNumber FROM users WHERE user_id = ?',
            [user_id]
        );

        if (userDetails.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        const user = userDetails[0];

        // Check if notification already exists
        const [existing] = await pool.query(
            'SELECT stock_notification_id FROM stock_notification WHERE user_id = ? AND product_id = ? AND (product_item_id = ? OR (product_item_id IS NULL AND ? IS NULL))',
            [user_id, product_id, product_item_id, product_item_id]
        );

        if (existing.length > 0) {
            // Update existing notification
            await pool.query(
                'UPDATE stock_notification SET status = "active", email_notification = ?, sms_notification = ? WHERE stock_notification_id = ?',
                [email_notification, sms_notification, existing[0].stock_notification_id]
            );
        } else {
            // Create new notification
            await pool.query(
                'INSERT INTO stock_notification (user_id, product_id, product_item_id, email, phoneNumber, email_notification, sms_notification) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user_id, product_id, product_item_id, user.email, user.phoneNumber, email_notification, sms_notification]
            );
        }

        res.status(201).json({Message: 'Successfully subscribed to back-in-stock notification'});
        
    } catch (error) {
        console.error('ERROR subscribing to back-in-stock notification:', error);
        res.status(500).json({Message: 'Failed to subscribe to notification'});
    }
};

// Unsubscribe from back-in-stock notifications
async function unsubscribeBackInStock(req,res) {
    try {
        const user_id = req.user.user_id;
        const { product_id } = req.params;
        const { product_item_id } = req.query;

        await pool.query(
            'UPDATE stock_notification SET status = "cancelled" WHERE user_id = ? AND product_id = ? AND (product_item_id = ? OR (product_item_id IS NULL AND ? IS NULL))',
            [user_id, product_id, product_item_id, product_item_id]
        );

        res.status(200).json({Message: 'Successfully unsubscribed from back-in-stock notification'});

    } catch (error) {
        console.error('ERROR unsubscribing from back-in-stock notification:', error);
        res.status(500).json({Message: 'Failed to unsubscribe from notification'});
    }
};

// Trigger back-in-stock notifications (called when stock is updated)
async function triggerBackInStockNotifications(product_id, product_item_id = null) {
    try {
        // Get product details
       const productQuery = product_item_id 
        ? `SELECT p.product_id, p.productname, p.product_image, pi.price, pi.qty_in_stock 
            FROM products p JOIN product_item pi ON p.product_id = pi.product_id WHERE p.product_id = ? AND pi.product_item_id = ? `
        : 'SELECT product_id, productname, product_image FROM products WHERE product_id = ?';
        
        const queryParams = product_item_id ? [product_id, product_item_id] : [product_id];
        const [productDetails] = await pool.query(productQuery, queryParams);

        if (productDetails.length === 0 || productDetails[0].qty_in_stock <= 0) {
            return; // Product not found or still out of stock
        }

        const product = productDetails[0];

        // Get all active notifications for this product
        const [notifications] = await pool.query(
            `SELECT sn.*, u.firstName, u.lastName, u.email_notifications, u.sms_notifications 
            FROM stock_notification sn JOIN users u ON sn.user_id = u.user_id WHERE sn.product_id = ? 
            AND (sn.product_item_id = ? OR (sn.product_item_id IS NULL AND ? IS NULL)) 
            AND sn.status = "active"`,
            [product_id, product_item_id, product_item_id]
        );

        // Send notifications to all subscribers
        for (const notification of notifications) {
            try {
                const user = {
                    first_name: notification.firstName,
                    last_name: notification.lastName,
                    email: notification.email,
                    phone: notification.phoneNumber,
                    email_notifications: notification.email_notifications && notification.email_notification,
                    sms_notifications: notification.sms_notifications && notification.sms_notification
                };

                // Send email notification
                if (user.email_notifications) {
                    await notificationService.sendBackInStockEmail(user, product);
                }

                // Send SMS notification
                if (user.sms_notifications && user.phoneNumber) {
                    await notificationService.sendSMS({
                        to: user.phoneNumber,
                        message: `Great news! ${product.productname} is back in stock at Goldmarks Jewellery. Don't miss out - shop now! ${process.env.FRONTEND_URL}/product/${product_id}`
                    });
                }

                // Mark notification as sent
                await pool.query(
                    'UPDATE stock_notification SET status = "notified", notified_at = NOW() WHERE stock_notification_id = ?',
                    [notification.stock_notification_id]
                );

            } catch (notificationError) {
                console.error(`Failed to send back-in-stock notification to user ${notification.user_id}:`, notificationError);
            }
        }

        console.log(`Sent back-in-stock notifications for product ${product_id} to ${notifications.length} users`);

    } catch (error) {
        console.error('Error triggering back-in-stock notifications:', error);
    }
};

// Send promotional campaign
async function sendPromotionalEmail(req,res) {
    try {
        const { title, subject, content, discount_percentage, promo_code, valid_until, target_audience } = req.body;

        if (!title || !subject || !content) {
            return res.status(400).json({Message: 'Title, subject, and content are required'});
        }

        // Get target users based on audience (simplified - no campaign table)
        let userQuery;
        switch (target_audience) {
            case 'all':
                userQuery = 'SELECT user_id, firstName, lastName, email FROM users WHERE marketing_emails = TRUE AND email_notifications = TRUE';
                break;
            case 'customers':
                userQuery = 'SELECT DISTINCT u.user_id, u.firstName, u.lastName, u.email FROM users u JOIN shop_orders so ON u.user_id = so.user_id WHERE u.marketing_emails = TRUE AND u.email_notifications = TRUE';
                break;
            case 'subscribers':
            default:
                userQuery = 'SELECT user_id, firstName, lastName, email FROM users WHERE marketing_emails = TRUE AND email_notifications = TRUE';
                break;
        }

        const [users] = await pool.query(userQuery);

        // Prepare promotion data
        const promotion = {
            title: title,
            subject: subject,
            content: content,
            discount: discount_percentage,
            code: promo_code,
            validUntil: valid_until ? new Date(valid_until).toLocaleDateString() : null,
            ctaUrl: `${process.env.FRONTEND_URL}/shop`,
            ctaText: 'Shop Now'
        };

        // Send emails directly
        const results = await notificationService.sendBulkPromotionalEmails(users, promotion);

        res.status(200).json({
            Message: 'Promotional emails sent successfully',
            results: results
        });

    } catch (error) {
        console.error('ERROR sending promotional emails:', error);
        res.status(500).json({Message: 'Failed to send promotional emails'});
    }
};

// Send promotional email to specific user (for targeted marketing)
async function sendPersonalPromotionalEmail(req,res) {
    try {
        const { user_id } = req.params;
        const { title, subject, content, discount_percentage, promo_code, valid_until } = req.body;

        if (!title || !subject || !content) {
            return res.status(400).json({Message: 'Title, subject, and content are required'});
        }

        // Get user details
        const [userDetails] = await pool.query(
            'SELECT firstName, lastName, email, marketing_emails, email_notifications FROM users WHERE user_id = ?',
            [user_id]
        );

        if (userDetails.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        const user = {
            first_name: userDetails[0].firstName,
            last_name: userDetails[0].lastName,
            email: userDetails[0].email,
            marketing_emails: userDetails[0].marketing_emails,
            email_notifications: userDetails[0].email_notifications
        };

        // Prepare promotion data
        const promotion = {
            title: title,
            subject: subject,
            content: content,
            discount: discount_percentage,
            code: promo_code,
            validUntil: valid_until ? new Date(valid_until).toLocaleDateString() : null,
            ctaUrl: `${process.env.FRONTEND_URL}/shop`,
            ctaText: 'Shop Now'
        };

        // Send promotional email
        const result = await notificationService.sendPromotionalEmail(user, promotion);

        res.status(200).json({
            Message: 'Promotional email sent successfully',
            result: result
        });

    } catch (error) {
        console.error('ERROR sending personal promotional email:', error);
        res.status(500).json({Message: 'Failed to send promotional email'});
    }
};

// Subscribe to newsletter
async function subscribeNewsletter(req,res) {
    try {
        const { email, first_name, last_name } = req.body;

        if (!email) {
            return res.status(400).json({Message: 'Email is required'});
        }

        // Check if user already exists
        const [existing] = await pool.query(
            'SELECT user_id, firstName, lastName, marketing_emails FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            // Update existing user to opt-in to marketing emails
            await pool.query(
                'UPDATE users SET marketing_emails = TRUE WHERE email = ?',
                [email]
            );
        } else {
            // Create new user account (they can set password later)
            await pool.query(
                'INSERT INTO users (firstName, lastName, email, marketing_emails, email_notifications) VALUES (?, ?, ?, TRUE, TRUE)',
                [first_name || 'Valued', last_name || 'Customer', email]
            );
        }

        // Send confirmation email
        const user = {
            first_name: first_name || existing[0]?.firstName || 'Valued Customer',
            email: email,
            email_notifications: true
        };

        try {
            await notificationService.sendNewsletterSubscriptionEmail(user);
            console.log('Newsletter subscription email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send newsletter subscription email:', emailError);
            // Don't fail subscription if email fails
        }

        res.status(201).json({Message: 'Successfully subscribed to newsletter'});

    } catch (error) {
        console.error('ERROR subscribing to newsletter:', error);
        res.status(500).json({Message: 'Failed to subscribe to newsletter'});
    }
};

// Unsubscribe from newsletter (simplified - uses users table)
async function unsubscribeNewsletter(req,res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({Message: 'Email is required'});
        }

        // Update user to opt-out of marketing emails
        await pool.query('UPDATE users SET marketing_emails = FALSE WHERE email = ?', [email]);

        res.status(200).json({Message: 'Successfully unsubscribed from newsletter'});

    } catch (error) {
        console.error('ERROR unsubscribing from newsletter:', error);
        res.status(500).json({Message: 'Failed to unsubscribe from newsletter'});
    }
};

// Get user notification preferences
async function getNotificationPreferences(req,res) {
    try {
        const user_id = req.user.user_id;

        const [preferences] = await pool.query(
            'SELECT email_notifications, sms_notifications, marketing_emails FROM users WHERE user_id = ?',
            [user_id]
        );

        if (preferences.length === 0) {
            return res.status(404).json({Message: 'User not found'});
        }

        res.status(200).json({
            Message: 'Notification preferences retrieved successfully',
            preferences: preferences[0]
        });

    } catch (error) {
        console.error('ERROR getting notification preferences:', error);
        res.status(500).json({Message: 'Failed to get notification preferences'});
    }
};

// Update user notification preferences
async function updateNotificationPreferences(req,res) {
    try {
        const user_id = req.user.user_id;
        const { email_notifications, sms_notifications, marketing_emails } = req.body;

        await pool.query(
            'UPDATE users SET email_notifications = ?, sms_notifications = ?, marketing_emails = ? WHERE user_id = ?',
            [email_notifications, sms_notifications, marketing_emails, user_id]
        );

        res.status(200).json({Message: 'Notification preferences updated successfully'});

    } catch (error) {
        console.error('ERROR updating notification preferences:', error);
        res.status(500).json({Message: 'Failed to update notification preferences'});
    }
};

module.exports = {
    subscribeBackInStock,
    unsubscribeBackInStock,
    triggerBackInStockNotifications,
    sendPromotionalEmail,
    sendPersonalPromotionalEmail,
    subscribeNewsletter,
    unsubscribeNewsletter,
    getNotificationPreferences,
    updateNotificationPreferences
};