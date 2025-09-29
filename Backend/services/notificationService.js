const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;

class NotificationService {
    constructor() {
        // Initialize email transporter with custom SMTP settings
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Initialize Twilio client
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Cache for compiled templates
        this.templateCache = new Map();
    }

    // Compile and cache email templates
    async getCompiledTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }

        try {
            const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf8');
            const compiled = Handlebars.compile(templateContent);
            this.templateCache.set(templateName, compiled);
            return compiled;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            // Return a basic template if file doesn't exist
            return Handlebars.compile(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d4af37;">{{subject}}</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                        {{{content}}}
                    </div>
                    <footer style="margin-top: 20px; text-align: center; color: #666;">
                        <p>Best regards,<br>Goldmarks Jewellery Team</p>
                    </footer>
                </div>
            `);
        }
    }

    // Send email notification
    async sendEmail({ to, subject, template = 'default', data = {} }) {
        try {
            if (!process.env.EMAIL_NOTIFICATIONS_ENABLED || process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'true') {
                console.log('Email notifications are disabled');
                return { success: false, message: 'Email notifications disabled' };
            }

            const compiledTemplate = await this.getCompiledTemplate(template);
            const html = compiledTemplate({ ...data, subject });

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: html
            };

            const result = await this.emailTransporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send SMS notification
    async sendSMS({ to, message }) {
        try {
            if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
                console.log('SMS service not configured');
                return { success: false, message: 'SMS service not configured' };
            }

            const result = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            console.log('SMS sent successfully:', result.sid);
            return { success: true, sid: result.sid };

        } catch (error) {
            console.error('Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    }

    // Welcome email for new users
    async sendWelcomeEmail(user) {
        // Check user's email preference
        if (!user.email_notifications) {
            console.log('User has disabled email notifications');
            return { success: false, message: 'User email notifications disabled' };
        }

        return await this.sendEmail({
            to: user.email,
            subject: 'Welcome to Goldmarks Jewellery!',
            template: 'welcome',
            data: {
                firstName: user.first_name,
                lastName: user.last_name,
                content: `
                    <p>Dear ${user.first_name},</p>
                    <p>Welcome to Goldmarks Jewellery! We're thrilled to have you join our exclusive community of jewellery enthusiasts.</p>
                    <p>Your account has been successfully created. You can now:</p>
                    <ul>
                        <li>Browse our exquisite collection of fine jewellery</li>
                        <li>Save items to your wishlist</li>
                        <li>Track your orders and purchase history</li>
                        <li>Receive exclusive offers and updates</li>
                    </ul>
                    <p>Thank you for choosing Goldmarks Jewellery - where luxury meets craftsmanship.</p>
                `
            }
        });
    }

    // Promotional email
    async sendPromotionalEmail(user, promotion) {
        if (!user.marketing_emails) {
            console.log('User has disabled marketing emails');
            return { success: false, message: 'User marketing emails disabled' };
        }

        return await this.sendEmail({
            to: user.email,
            subject: promotion.subject,
            template: 'promotional',
            data: {
                firstName: user.first_name,
                promotionTitle: promotion.title,
                promotionDescription: promotion.description,
                promotionCode: promotion.code,
                validUntil: promotion.validUntil,
                content: promotion.content
            }
        });
    }

    // Order confirmation email
    async sendOrderConfirmation(user, order) {
        if (!user.email_notifications) {
            return { success: false, message: 'User email notifications disabled' };
        }

        const orderItemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
            </tr>
        `).join('');

        return await this.sendEmail({
            to: user.email,
            subject: `Order Confirmation - #${order.id}`,
            template: 'order-confirmation',
            data: {
                firstName: user.first_name,
                orderId: order.id,
                orderDate: order.date,
                orderItems: orderItemsHtml,
                totalAmount: order.total,
                shippingAddress: order.shippingAddress
            }
        });
    }

    // Back in stock notification
    async sendBackInStockEmail(user, product) {
        if (!user.email_notifications) {
            return { success: false, message: 'User email notifications disabled' };
        }

        return await this.sendEmail({
            to: user.email,
            subject: `${product.name} is Back in Stock!`,
            template: 'back-in-stock',
            data: {
                firstName: user.first_name,
                productName: product.name,
                productPrice: product.price,
                productImage: product.image,
                productUrl: product.url
            }
        });
    }
}

module.exports = new NotificationService();