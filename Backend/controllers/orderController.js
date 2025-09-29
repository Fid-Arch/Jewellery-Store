const pool = require('../config/database');
const notificationService = require('../services/notificationService');

// Create Order
async function createOrder(req, res) {
    let connection;
    try {
        const user_id = req.user.user_id;
        const { shipping_method, shipping_address, process_payment_id } = req.body;

        if (!shipping_method || !shipping_address || process_payment_id === undefined) {
            return res.status(400).json({ Message: 'Missing required fields' });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [carts] = await connection.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ Message: 'No active cart found for the user' });
        }

        const cart_id = carts[0].cart_id;
        const get_items = `
        SELECT ci.product_item_id, ci.qty, pi.price
        FROM cart_items ci
        JOIN product_item pi ON ci.product_item_id = pi.product_item_id
        WHERE ci.cart_id = ?
        `;
        const [items] = await connection.query(get_items, [cart_id]);

        if (items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ Message: 'Cart is Empty' });
        }

        const total_amount = items.reduce((total, item) => total + (item.price * item.qty), 0);

        const order = 'INSERT INTO shop_orders (user_id, total_amount, shipping_method, shipping_address, transaction_id, payment_status, order_status) VALUES (?,?,?,?,?,?,?)';
        const orderValues = [user_id, total_amount, shipping_method, shipping_address, process_payment_id, 'Pending', 1];
        const [orderResult] = await connection.query(order, orderValues);
        const shop_order_id = orderResult.insertId;

        // Record payment
        const payment = 'INSERT INTO payment (shop_order_id, amount, payment_method, payment_status,transaction_id) VALUES (?,?,?,?,?)';
        await connection.query(payment, [shop_order_id, total_amount, 'Stripe', 'Pending', process_payment_id]);

        // Record into the orderline
        const orderline = 'INSERT INTO order_line (shop_order_id, product_item_id, qty, price) VALUES ?';
        const orderlinevalues = items.map(item => [shop_order_id, item.product_item_id, item.qty, item.price]);
        await connection.query(orderline, [orderlinevalues]);

        // Record stock movements for each ordered item
        for (const item of items) {
            // Get product_id from product_item
            const [productInfo] = await connection.query(
                'SELECT pi.product_id FROM product_item pi WHERE pi.product_item_id = ?',
                [item.product_item_id]
            );
            
            if (productInfo.length > 0) {
                const productId = productInfo[0].product_id;
                // Record negative stock movement for sale
                await recordStockMovement(
                    item.product_item_id,
                    'sale',
                    -item.qty, // negative because it's a sale
                    shop_order_id,
                    `Sale - Order #${shop_order_id}`,
                    user_id
                );
            }
        }

        // Clear the cart
        await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
        await connection.query('DELETE FROM cart WHERE cart_id = ?', [cart_id]);

        await connection.commit();

        // Send order confirmation notifications
        try {
            const [userDetails] = await pool.query(
                'SELECT firstName, lastName, email, phoneNumber, email_notifications, sms_notifications FROM users WHERE user_id = ?',
                [user_id]
            );

            if (userDetails.length > 0) {
                const user = {
                    first_name: userDetails[0].firstName,
                    last_name: userDetails[0].lastName,
                    email: userDetails[0].email,
                    phone: userDetails[0].phoneNumber,
                    email_notifications: userDetails[0].email_notifications,
                    sms_notifications: userDetails[0].sms_notifications
                };

                const orderDetails = {
                    order_id: shop_order_id,
                    total_amount: total_amount,
                    created_at: new Date(),
                    items: items.map(item => ({
                        name: `Product Item #${item.product_item_id}`,
                        quantity: item.qty,
                        price: item.price
                    }))
                };

                await notificationService.sendOrderConfirmation(user, orderDetails);
                await notificationService.sendOrderStatusSMS(user, shop_order_id, 'processing');
                console.log('Order notifications sent for order:', shop_order_id);
            }
        } catch (notificationError) {
            console.error('Failed to send order notifications:', notificationError);
        }

        res.status(201).json({
            Message: 'Order created successfully',
            orderId: shop_order_id,
            totalAmount: total_amount
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('ERROR Creating Order:', error);
        res.status(500).json({ Message: 'Error creating order' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Get User Orders
async function getUserOrders(req, res) {
    try {
        const user_id = req.user.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [orders] = await pool.query(`
            SELECT so.shop_order_id, so.order_date, so.total_amount, so.payment_status, 
                   os.status as order_status, sm.name as shipping_method
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            WHERE so.user_id = ?
            ORDER BY so.order_date DESC
            LIMIT ? OFFSET ?`, [user_id, limit, offset]);

        res.status(200).json({ data: orders });
    } catch (error) {
        console.error('ERROR Fetching User Orders:', error);
        res.status(500).json({ Error: 'Error Fetching User Orders from the database' });
    }
}

// Get Order Details
async function getOrderById(req, res) {
    try {
        const user_id = req.user.user_id;
        const { orderId } = req.params;

        const [orders] = await pool.query(`
            SELECT 
                so.shop_order_id, so.order_date, so.total_amount, so.payment_status, 
                os.status as order_status, sm.name as shipping_method, sm.price as shipping_cost,
                a.address_line1, a.address_line2, a.postcode, a.states, a.country
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            JOIN address a ON so.shipping_address = a.address_id
            WHERE so.user_id = ? AND so.shop_order_id = ?`, [user_id, orderId]);

        if (orders.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        const [orderItems] = await pool.query(`
            SELECT ol.qty, ol.price, pi.sku, p.product_image, p.productname, p.description
            FROM order_line ol
            JOIN product_item pi ON ol.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            WHERE ol.shop_order_id = ?`, [orderId]);

        const orderDetails = { ...orders[0], items: orderItems };

        res.status(200).json({ data: orderDetails });
    } catch (error) {
        console.error('ERROR Fetching Order Details:', error);
        res.status(500).json({ Error: 'Error Fetching Order Details' });
    }
}

// Update Order Status (Admin only)
async function updateOrderStatus(req, res) {
    try {
        const { order_id } = req.params;
        const { order_status_id, tracking_number } = req.body;

        // Map status strings to numeric IDs used in database
        const statusMapping = {
            'processing': 1,
            'paid': 2,
            'shipped': 3,
            'delivered': 4,
            'cancelled': 5,
            'refunded': 6
        };

        const nextStatusId = statusMapping[order_status_id];
        if (!nextStatusId) {
            return res.status(400).json({ Message: 'Invalid order status' });
        }

        // Update order status with numeric ID
        await pool.query('UPDATE shop_orders SET order_status_id = ? WHERE shop_order_id = ?', [nextStatusId, order_id]);

        // If status is shipped and tracking number provided, update that too
        if (nextStatusId === statusMapping['shipped'] && tracking_number) {
            await pool.query('UPDATE shop_orders SET tracking_number = ? WHERE shop_order_id = ?', [tracking_number, order_id]);
        }

        // Get order and user details for notification
        const [orderDetails] = await pool.query(`
            SELECT so.*, u.firstName, u.lastName, u.email, u.phoneNumber, u.email_notifications, u.sms_notifications
            FROM shop_orders so
            JOIN users u ON so.user_id = u.user_id
            WHERE so.shop_order_id = ?
        `, [order_id]);

        if (orderDetails.length > 0) {
            const order = orderDetails[0];
            const user = {
                first_name: order.firstName,
                last_name: order.lastName,
                email: order.email,
                phone: order.phoneNumber,
                email_notifications: order.email_notifications,
                sms_notifications: order.sms_notifications
            };

            try {
                await notificationService.sendOrderStatusEmail(user, order, order_status_id, tracking_number);
                await notificationService.sendOrderStatusSMS(user, order_id, order_status_id);
                console.log('Order status notifications sent for order:', order_id);
            } catch (notificationError) {
                console.error('Failed to send order status notifications:', notificationError);
            }
        }

        res.status(200).json({ Message: 'Order status updated and notifications sent' });

    } catch (error) {
        console.error('ERROR updating order status:', error);
        res.status(500).json({ Message: 'Failed to update order status' });
    }
}

// Get All Orders (Admin only)
async function getAllOrdersAdmin(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        let whereClause = '';
        let queryParams = [limit, offset];

        if (status) {
            whereClause = 'WHERE os.status = ?';
            queryParams = [status, limit, offset];
        }

        const [orders] = await pool.query(`
            SELECT so.shop_order_id, so.order_date, so.total_amount, so.payment_status,
                   os.status as order_status, u.firstName, u.lastName, u.email,
                   sm.name as shipping_method
            FROM shop_orders so
            JOIN users u ON so.user_id = u.user_id
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            ${whereClause}
            ORDER BY so.order_date DESC
            LIMIT ? OFFSET ?`, queryParams);

        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            ${whereClause}`, status ? [status] : []);

        const totalOrders = countResult[0].total;

        res.status(200).json({
            data: {
                orders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalOrders / limit),
                    totalItems: totalOrders,
                    hasNextPage: page < Math.ceil(totalOrders / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching All Orders:', error);
        res.status(500).json({ Error: 'Error fetching orders' });
    }
}

// Track Order with Label
async function trackOrderWithLabel(req, res) {
    try {
        const { orderLabel } = req.params;

        const [orders] = await pool.query(`
            SELECT so.shop_order_id, so.order_date, so.total_amount, so.tracking_number,
                   os.status as order_status, sm.name as shipping_method
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            JOIN shipping_methods sm ON so.shipping_method = sm.shipping_method_id
            WHERE so.shop_order_id = ? OR so.tracking_number = ?`, [orderLabel, orderLabel]);

        if (orders.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        res.status(200).json({
            data: {
                order: orders[0],
                trackingAvailable: !!orders[0].tracking_number
            }
        });
    } catch (error) {
        console.error('ERROR Tracking Order:', error);
        res.status(500).json({ Error: 'Error tracking order' });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrdersAdmin,
    trackOrderWithLabel
};