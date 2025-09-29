const pool = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
async function createPaymentIntent(req, res) {
  try {
    const { amount, currency = 'aud', orderId, userId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and order ID are required'
      });
    }

    // Verify order exists and belongs to user
    const [orders] = await pool.query(
      'SELECT id, total_amount, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending status'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        orderId: orderId.toString(),
        userId: userId ? userId.toString() : 'guest'
      }
    });

    // Store payment intent in database
    await pool.query(
      `INSERT INTO payments (order_id, user_id, stripe_payment_intent_id, amount, currency, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [orderId, userId, paymentIntent.id, amount, currency]
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Confirm payment
async function confirmPayment(req, res) {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment status in database
    await pool.query(
      'UPDATE payments SET status = ?, stripe_charge_id = ?, updated_at = NOW() WHERE stripe_payment_intent_id = ?',
      [paymentIntent.status, paymentIntent.charges.data[0]?.id || null, paymentIntentId]
    );

    if (paymentIntent.status === 'succeeded') {
      // Get order ID from payment
      const [payments] = await pool.query(
        'SELECT order_id FROM payments WHERE stripe_payment_intent_id = ?',
        [paymentIntentId]
      );

      if (payments.length > 0) {
        const orderId = payments[0].order_id;

        // Update order status to confirmed
        await pool.query(
          'UPDATE orders SET status = "confirmed", payment_status = "paid", updated_at = NOW() WHERE id = ?',
          [orderId]
        );

        // Update product inventory
        const [orderItems] = await pool.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        );

        for (const item of orderItems) {
          await pool.query(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }
    }

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Handle Stripe webhook
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = "succeeded", updated_at = NOW() WHERE stripe_payment_intent_id = ?',
      [paymentIntent.id]
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET status = "confirmed", payment_status = "paid", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    // Send confirmation email (if notification service is available)
    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length > 0) {
      const order = orders[0];
      // You can implement email notification here
      console.log(`Payment succeeded for order ${orderId}, user: ${order.email}`);
    }

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    // Update payment status
    await pool.query(
      'UPDATE payments SET status = "failed", updated_at = NOW() WHERE stripe_payment_intent_id = ?',
      [paymentIntent.id]
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET status = "payment_failed", payment_status = "failed", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    console.log(`Payment failed for order ${orderId}`);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle charge dispute
async function handleChargeDispute(charge) {
  try {
    // Find payment by charge ID
    const [payments] = await pool.query(
      'SELECT order_id FROM payments WHERE stripe_charge_id = ?',
      [charge.id]
    );

    if (payments.length > 0) {
      const orderId = payments[0].order_id;

      // Update order status
      await pool.query(
        'UPDATE orders SET status = "disputed", updated_at = NOW() WHERE id = ?',
        [orderId]
      );

      console.log(`Dispute created for order ${orderId}`);
    }

  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

// Get payment details
async function getPaymentDetails(req, res) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const [payments] = await pool.query(
      `SELECT p.*, o.total_amount, o.status as order_status
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.order_id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payments[0]
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Refund payment
async function refundPayment(req, res) {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    // Get payment details
    const [payments] = await pool.query(
      'SELECT stripe_charge_id, amount as original_amount FROM payments WHERE order_id = ? AND status = "succeeded"',
      [orderId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No successful payment found for this order'
      });
    }

    const payment = payments[0];
    const refundAmount = amount ? Math.round(amount * 100) : Math.round(payment.original_amount * 100);

    // Create refund with Stripe
    const refund = await stripe.refunds.create({
      charge: payment.stripe_charge_id,
      amount: refundAmount,
      reason: reason || 'requested_by_customer'
    });

    // Record refund in database
    await pool.query(
      `INSERT INTO refunds (order_id, stripe_refund_id, amount, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [orderId, refund.id, refundAmount / 100, reason || 'requested_by_customer', refund.status]
    );

    // Update order status
    await pool.query(
      'UPDATE orders SET status = "refunded", updated_at = NOW() WHERE id = ?',
      [orderId]
    );

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refundAmount / 100,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Get payment history for user
async function getPaymentHistory(req, res) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [payments] = await pool.query(
      `SELECT p.*, o.order_number, o.total_amount, o.status as order_status
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.user_id = ?`,
      [userId]
    );

    const totalPayments = countResult[0].total;

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total: totalPayments,
        pages: Math.ceil(totalPayments / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentDetails,
  refundPayment,
  getPaymentHistory
};