/**
 * Docker Notification System Test Script
 * Run this inside the Docker container to test notifications
 */

require('dotenv').config();
const NotificationService = require('./services/notificationService');

async function testDockerNotifications() {
    console.log('🐳 Testing Notification System in Docker...\n');
    
    // Check environment variables
    console.log('📋 Environment Check:');
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
    console.log('');
    
    // Test user data
    const testUser = {
        first_name: 'Docker',
        last_name: 'Test',
        email: process.env.TEST_EMAIL || 'test@example.com',
        phone: process.env.TEST_PHONE || '+1234567890',
        email_notifications: true,
        sms_notifications: true
    };
    
    const testOrder = {
        id: 'DOCKER-TEST-12345',
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
    
    console.log('1. Testing Email Configuration...');
    try {
        const emailResult = await NotificationService.sendEmail({
            to: testUser.email,
            subject: 'Docker Test Email from Goldmarks',
            template: 'default',
            data: {
                subject: 'Docker Test Email',
                content: '<p>This is a test email from your Docker container to verify email configuration.</p>'
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
            message: 'Docker Test SMS from Goldmarks Jewellery - Your notification system is working in Docker!'
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
        const orderStatusResult = await NotificationService.sendOrderStatusUpdate(testUser, testOrder, 'shipped', 'DOCKER-TRACK123');
        console.log('✅ Order status email result:', orderStatusResult);
    } catch (error) {
        console.log('❌ Order status test failed:', error.message);
    }
    
    console.log('\n5. Testing Stock Alert...');
    try {
        const stockResult = await NotificationService.sendStockAlertEmail(testUser, testProduct);
        console.log('✅ Stock alert result:', stockResult);
    } catch (error) {
        console.log('❌ Stock alert test failed:', error.message);
    }
    
    console.log('\n🎉 Docker notification system test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email for test messages');
    console.log('2. Check your phone for test SMS');
    console.log('3. Update your .env file with real credentials');
    console.log('4. Run the database migrations');
    console.log('5. Integrate with your existing controllers');
    console.log('\n🐳 Docker Commands:');
    console.log('docker-compose exec backend node docker-test-notifications.js');
    console.log('docker-compose logs backend');
    console.log('docker-compose restart backend');
}

// Run the test
if (require.main === module) {
    testDockerNotifications().catch(console.error);
}

module.exports = testDockerNotifications;
