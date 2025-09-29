/**
 * Notification System Test Script
 * Run this to test your notification system setup
 */

require('dotenv').config();
const NotificationService = require('./services/notificationService');

async function testNotifications() {
    console.log('🧪 Testing Notification System...\n');
    
    // Test user data
    const testUser = {
        first_name: 'John',
        last_name: 'Doe',
        email: process.env.TEST_EMAIL || 'test@example.com',
        phone: process.env.TEST_PHONE || '+1234567890',
        email_notifications: true,
        sms_notifications: true
    };
    
    const testOrder = {
        id: 'TEST-12345',
        total: 299.99,
        items: [
            { name: 'Gold Ring', quantity: 1, price: 299.99 }
        ]
    };
    
    const testProduct = {
        name: 'Diamond Necklace',
        price: 1299.99,
        qty_in_stock: 2,
        image_url: 'https://example.com/necklace.jpg',
        product_id: 123
    };
    
    const testPromotion = {
        title: 'Holiday Sale',
        subject: '🎄 25% Off Everything - Limited Time!',
        content: 'Celebrate the holidays with our biggest sale of the year...',
        code: 'HOLIDAY25',
        discount: '25%',
        validUntil: '2025-12-31'
    };
    
    console.log('1. Testing Email Configuration...');
    try {
        const emailResult = await NotificationService.sendEmail({
            to: testUser.email,
            subject: 'Test Email from Goldmarks',
            template: 'default',
            data: {
                subject: 'Test Email',
                content: '<p>This is a test email to verify your email configuration.</p>'
            }
        });
        console.log('✅ Email test result:', emailResult);
    } catch (error) {
        console.log('❌ Email test failed:', error.message);
    }
    
    console.log('\n2. Testing SMS Configuration...');
    try {
        const smsResult = await NotificationService.sendSMS({
            to: testUser.phone,
            message: 'Test SMS from Goldmarks Jewellery - Your notification system is working!'
        });
        console.log('✅ SMS test result:', smsResult);
    } catch (error) {
        console.log('❌ SMS test failed:', error.message);
    }
    
    console.log('\n3. Testing Welcome Email...');
    try {
        const welcomeResult = await NotificationService.sendWelcomeEmail(testUser);
        console.log('✅ Welcome email result:', welcomeResult);
    } catch (error) {
        console.log('❌ Welcome email test failed:', error.message);
    }
    
    console.log('\n4. Testing Order Status Update...');
    try {
        const orderStatusResult = await NotificationService.sendOrderStatusUpdate(testUser, testOrder, 'shipped', 'TRACK123');
        console.log('✅ Order status email result:', orderStatusResult);
    } catch (error) {
        console.log('❌ Order status test failed:', error.message);
    }
    
    console.log('\n5. Testing Promotional Email...');
    try {
        const promoResult = await NotificationService.sendPromotionalEmail(testUser, testPromotion);
        console.log('✅ Promotional email result:', promoResult);
    } catch (error) {
        console.log('❌ Promotional email test failed:', error.message);
    }
    
    console.log('\n6. Testing Stock Alert...');
    try {
        const stockResult = await NotificationService.sendStockAlertEmail(testUser, testProduct);
        console.log('✅ Stock alert result:', stockResult);
    } catch (error) {
        console.log('❌ Stock alert test failed:', error.message);
    }
    
    console.log('\n7. Testing Back-in-Stock Email...');
    try {
        const backInStockResult = await NotificationService.sendBackInStockEmail(testUser, testProduct);
        console.log('✅ Back-in-stock email result:', backInStockResult);
    } catch (error) {
        console.log('❌ Back-in-stock test failed:', error.message);
    }
    
    console.log('\n🎉 Notification system test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email for test messages');
    console.log('2. Check your phone for test SMS');
    console.log('3. Update your .env file with real credentials');
    console.log('4. Run the database migrations');
    console.log('5. Integrate with your existing controllers');
}

// Run the test
if (require.main === module) {
    testNotifications().catch(console.error);
}

module.exports = testNotifications;
