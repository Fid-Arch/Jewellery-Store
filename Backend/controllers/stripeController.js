const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/database');

// Create Payment Intent
async function createPaymentIntent(req, res) {
    try {
        const user_id = req.user.user_id;
        const { amount, currency, payment_method_id, shipping_address_id } = req.body;

        if (!amount || !currency || !payment_method_id || !shipping_address_id) {
            return res.status(400).json({ 
                Message: 'Missing required fields: amount, currency, payment_method_id, shipping_address_id' 
            });
        }

        // Verify the shipping address belongs to the user
        const connection = await pool.getConnection();
        const [addressCheck] = await connection.query(
            'SELECT a.address_id FROM address a JOIN user_address ua ON a.address_id = ua.address_id WHERE a.address_id = ? AND ua.user_id = ?',
            [shipping_address_id, user_id]
        );
        connection.release();

        if (addressCheck.length === 0) {
            return res.status(400).json({ Message: 'Invalid shipping address' });
        }

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: currency.toLowerCase(),
            payment_method: payment_method_id,
            confirmation_method: 'manual',
            confirm: true,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`,
            metadata: {
                user_id: user_id.toString(),
                shipping_address_id: shipping_address_id.toString()
            }
        });

        // Handle the response based on payment intent status
        if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
            // Card requires 3D Secure authentication
            return res.json({
                requires_action: true,
                payment_intent_id: paymentIntent.id,
                client_secret: paymentIntent.client_secret
            });
        } else if (paymentIntent.status === 'succeeded') {
            // Payment succeeded
            return res.json({
                success: true,
                payment_intent_id: paymentIntent.id,
                Message: 'Payment intent created successfully'
            });
        } else {
            // Payment failed
            return res.status(400).json({
                Message: 'Payment failed',
                error: paymentIntent.last_payment_error?.message || 'Unknown payment error'
            });
        }

    } catch (error) {
        console.error('Payment intent creation error:', error);
        
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                Message: 'Card error',
                error: error.message
            });
        }
        
        return res.status(500).json({
            Message: 'Failed to create payment intent',
            error: error.message
        });
    }
}

// Confirm Payment Intent (for 3D Secure)
async function confirmPaymentIntent(req, res) {
    try {
        const { payment_intent_id } = req.body;

        if (!payment_intent_id) {
            return res.status(400).json({ Message: 'Payment intent ID is required' });
        }

        const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id);

        if (paymentIntent.status === 'succeeded') {
            return res.json({
                success: true,
                payment_intent_id: paymentIntent.id,
                Message: 'Payment confirmed successfully'
            });
        } else {
            return res.status(400).json({
                Message: 'Payment confirmation failed',
                status: paymentIntent.status
            });
        }

    } catch (error) {
        console.error('Payment confirmation error:', error);
        return res.status(500).json({
            Message: 'Failed to confirm payment',
            error: error.message
        });
    }
}

// Get Payment Status
async function getPaymentStatus(req, res) {
    try {
        const { payment_intent_id } = req.params;

        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        return res.json({
            payment_intent_id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: paymentIntent.created
        });

    } catch (error) {
        console.error('Payment status retrieval error:', error);
        return res.status(500).json({
            Message: 'Failed to retrieve payment status',
            error: error.message
        });
    }
}

module.exports = {
    createPaymentIntent,
    confirmPaymentIntent,
    getPaymentStatus
};