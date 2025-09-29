//SHIPPING MANAGEMENT FUNCTIONS
const pool = require('../config/database');
const notificationService = require('../services/notificationService');

// 1. Australia Post API Integration Helper
async function calculateAustraliaPostRates(fromPostcode, toPostcode, weight, length = 10, width = 10, height = 10) {
    try {
        const apiKey = process.env.AUSPOST_API_KEY;
        if (!apiKey) {
            console.log('Australia Post API key not configured, using manual calculation');
            return null;
        }

        const url = new URL('https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json');
        url.searchParams.append('from_postcode', fromPostcode);
        url.searchParams.append('to_postcode', toPostcode);
        url.searchParams.append('length', length);
        url.searchParams.append('width', width);
        url.searchParams.append('height', height);
        url.searchParams.append('weight', weight);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'AUTH-KEY': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Australia Post API error: ${response.status}`);
        }

        const data = await response.json();
        return data.postage_result?.costs || [];
    } catch (error) {
        console.error('Australia Post API Error:', error);
        return null;
    }
}

// 2. Get Shipping Options for Cart (Essential Function 1)
async function getShippingOptionsForCart(req, res) {
    try {
        const { 
            cartTotal, 
            weight = 1, 
            country = 'Australia',
            postcode,
            fromPostcode = '3000' // Your store postcode
        } = req.query;

        if (!cartTotal) {
            return res.status(400).json({ Message: 'Cart total is required' });
        }

        // Get base shipping methods from database
        const [methods] = await pool.query(`
            SELECT shipping_method_id, name, price 
            FROM shipping_method 
            ORDER BY price ASC
        `);

        let shippingOptions = [];

        // If domestic Australia and postcode provided, try Australia Post API
        if (country.toLowerCase() === 'australia' && postcode && fromPostcode) {
            const ausPostRates = await calculateAustraliaPostRates(
                fromPostcode, 
                postcode, 
                weight
            );

            if (ausPostRates && ausPostRates.length > 0) {
                // Map Australia Post services to our shipping methods
                shippingOptions = ausPostRates.map((rate, index) => {
                    const baseMethod = methods[index] || methods[0];
                    
                    return {
                        methodId: baseMethod.shipping_method_id,
                        name: rate.option || baseMethod.name,
                        originalPrice: parseFloat(rate.cost),
                        finalPrice: parseFloat(rate.cost),
                        isFree: false,
                        estimatedDays: rate.option?.includes('Express') ? 1 : 
                                     rate.option?.includes('Priority') ? 2 : 5,
                        estimatedDeliveryDate: new Date(Date.now() + 
                            (rate.option?.includes('Express') ? 1 : 5) * 24 * 60 * 60 * 1000
                        ).toISOString().split('T')[0],
                        serviceCode: rate.option,
                        apiSource: 'australia_post'
                    };
                });
            }
        }

        // Fallback to manual calculation if API fails or international
        if (shippingOptions.length === 0) {
            shippingOptions = methods.map(method => {
                let shippingCost = parseFloat(method.price);
                let estimatedDays = 5;

                // Apply manual rules
                if (method.name.toLowerCase().includes('express')) {
                    shippingCost *= 1.5;
                    estimatedDays = 1;
                } else if (method.name.toLowerCase().includes('priority')) {
                    shippingCost *= 1.2;
                    estimatedDays = 2;
                }

                // International shipping
                if (country.toLowerCase() !== 'australia') {
                    shippingCost *= 2;
                    estimatedDays += 7;
                }

                return {
                    methodId: method.shipping_method_id,
                    name: method.name,
                    originalPrice: parseFloat(method.price),
                    finalPrice: Math.round(shippingCost * 100) / 100,
                    isFree: false,
                    estimatedDays,
                    estimatedDeliveryDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    apiSource: 'manual'
                };
            });
        }

        // Apply free shipping threshold
        const freeShippingThreshold = 100;
        if (parseFloat(cartTotal) >= freeShippingThreshold && country.toLowerCase() === 'australia') {
            shippingOptions = shippingOptions.map(option => ({
                ...option,
                finalPrice: 0,
                isFree: true,
                freeShippingApplied: true
            }));
        }

        res.status(200).json({
            Data: {
                shippingOptions,
                freeShippingThreshold,
                cartTotal: parseFloat(cartTotal),
                qualifiesForFreeShipping: parseFloat(cartTotal) >= freeShippingThreshold && country.toLowerCase() === 'australia',
                apiUsed: shippingOptions[0]?.apiSource || 'manual'
            }
        });
    } catch (error) {
        console.error('ERROR Getting Shipping Options:', error);
        res.status(500).json({ Error: 'Error Getting Shipping Options' });
    }
}

// 3. Create Shipping Label (Essential Function 2)
async function createShippingLabel(req, res) {
    try {
        const { orderId } = req.params;
        const { 
            shippingService = 'standard',
            weight = 1,
            dimensions = { length: 10, width: 10, height: 10 }
        } = req.body;

        // Get order details
        const [order] = await pool.query(`
            SELECT 
                so.shop_order_id,
                so.order_total,
                so.shipping_method_id,
                sm.name as shipping_method,
                sm.price as shipping_cost,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNumber,
                a.address_line1,
                a.address_line2,
                a.postcode,
                a.states,
                a.country
            FROM shop_orders so
            JOIN shipping_method sm ON so.shipping_method_id = sm.shipping_method_id
            JOIN users u ON so.user_id = u.user_id
            JOIN address a ON so.shipping_address_id = a.address_id
            WHERE so.shop_order_id = ?
        `, [orderId]);

        if (order.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        const orderData = order[0];
        const trackingNumber = `GM${Date.now()}${orderId}`;

        // Get real shipping cost if domestic
        let actualShippingCost = orderData.shipping_cost;
        let estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        if (orderData.country.toLowerCase() === 'australia' && orderData.postcode) {
            const ausPostRates = await calculateAustraliaPostRates(
                '3000', // Your store postcode
                orderData.postcode,
                weight,
                dimensions.length,
                dimensions.width,
                dimensions.height
            );

            if (ausPostRates && ausPostRates.length > 0) {
                const selectedRate = ausPostRates.find(rate => 
                    rate.option?.toLowerCase().includes(shippingService.toLowerCase())
                ) || ausPostRates[0];

                actualShippingCost = parseFloat(selectedRate.cost);
                estimatedDelivery = new Date(Date.now() + 
                    (selectedRate.option?.includes('Express') ? 1 : 5) * 24 * 60 * 60 * 1000);
            }
        }

        // Create shipping label data
        const shippingLabel = {
            trackingNumber,
            orderId: orderData.shop_order_id,
            
            // Sender details (your jewelry store)
            sender: {
                name: 'Goldmarks Jewelry Store',
                address: '123 Collins Street',
                city: 'Melbourne',
                state: 'VIC',
                postcode: '3000',
                country: 'Australia',
                phone: '+61 3 9000 0000'
            },
            
            // Recipient details
            recipient: {
                name: `${orderData.firstName} ${orderData.lastName}`,
                address: orderData.address_line1,
                address2: orderData.address_line2,
                city: orderData.states,
                postcode: orderData.postcode,
                country: orderData.country,
                phone: orderData.phoneNumber,
                email: orderData.email
            },
            
            // Shipping details
            shipping: {
                service: shippingService,
                method: orderData.shipping_method,
                cost: actualShippingCost,
                weight: weight,
                dimensions: dimensions,
                estimatedDelivery: estimatedDelivery.toISOString().split('T')[0]
            },
            
            // Label details
            createdAt: new Date().toISOString(),
            status: 'created',
            carrier: 'Australia Post',
            
            // Label data for printing
            labelData: {
                orderNumber: `#${orderId}`,
                trackingBarcode: trackingNumber,
                serviceType: shippingService,
                postageAmount: actualShippingCost
            }
        };

        // Update order with tracking information
        await pool.query(`
            UPDATE shop_orders 
            SET tracking_number = ?, order_status_id = 3, actual_shipping_cost = ?
            WHERE shop_order_id = ?
        `, [trackingNumber, actualShippingCost, orderId]);

        res.status(201).json({
            Message: 'Shipping label created successfully',
            Data: shippingLabel
        });
    } catch (error) {
        console.error('ERROR Creating Shipping Label:', error);
        res.status(500).json({ Error: 'Error Creating Shipping Label' });
    }
}

// 4. Track Order with Label Info (Essential Function 3)
async function trackOrderWithLabel(req, res) {
    try {
        const { trackingNumber } = req.params;

        const [order] = await pool.query(`
            SELECT 
                so.shop_order_id,
                so.order_date,
                so.tracking_number,
                so.order_status_id,
                so.actual_shipping_cost,
                os.status as order_status,
                sm.name as shipping_method,
                u.firstName,
                u.lastName,
                u.email,
                a.address_line1,
                a.postcode,
                a.states,
                a.country
            FROM shop_orders so
            JOIN order_status os ON so.order_status_id = os.order_status_id
            JOIN shipping_method sm ON so.shipping_method_id = sm.shipping_method_id
            JOIN users u ON so.user_id = u.user_id
            JOIN address a ON so.shipping_address_id = a.address_id
            WHERE so.tracking_number = ?
        `, [trackingNumber]);

        if (order.length === 0) {
            return res.status(404).json({ Message: 'Order not found' });
        }

        const orderData = order[0];

        // Enhanced status mapping
        const statusInfo = {
            1: { 
                status: 'Processing', 
                description: 'Your jewelry order is being carefully prepared',
            },
            2: { 
                status: 'Paid', 
                description: 'Payment confirmed, preparing for shipment',
            },
            3: { 
                status: 'Shipped', 
                description: 'Your jewelry has been shipped via Australia Post',
            },
            4: { 
                status: 'Delivered', 
                description: 'Your jewelry order has been delivered',
            }
        };

        const currentStatus = statusInfo[orderData.order_status_id] || 
                            { status: 'Unknown', description: 'Status unknown', icon: '❓' };

        res.status(200).json({
            Data: {
                trackingNumber,
                orderId: orderData.shop_order_id,
                orderDate: orderData.order_date,
                
                customer: {
                    name: `${orderData.firstName} ${orderData.lastName}`,
                    email: orderData.email
                },
                
                shipping: {
                    method: orderData.shipping_method,
                    cost: orderData.actual_shipping_cost || 0,
                    destination: {
                        address: orderData.address_line1,
                        postcode: orderData.postcode,
                        state: orderData.states,
                        country: orderData.country
                    }
                },
                
                status: {
                    current: currentStatus.status,
                    description: currentStatus.description,
                    icon: currentStatus.icon
                },
                
                timeline: [
                    { 
                        status: 'Order Placed', 
                        date: orderData.order_date,
                        completed: true,
                        description: 'Jewelry order successfully placed'
                    },
                    { 
                        status: 'Payment Confirmed', 
                        date: orderData.order_status_id >= 2 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 2,
                        description: 'Payment processed successfully'
                    },
                    { 
                        status: 'Shipped', 
                        date: orderData.order_status_id >= 3 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 3,
                        description: 'Package shipped with Australia Post'
                    },
                    { 
                        status: 'Delivered', 
                        date: orderData.order_status_id >= 4 ? orderData.order_date : null,
                        completed: orderData.order_status_id >= 4,
                        description: 'Jewelry delivered to your address'
                    }
                ]
            }
        });
    } catch (error) {
        console.error('ERROR Tracking Order:', error);
        res.status(500).json({ Error: 'Error Tracking Order' });
    }
};

// SHIPPING ADDRESS MANAGEMENT FUNCTIONS

//  Get User's Shipping Addresses
async function getUserShippingAddresses(req, res) {
    try {
        const user_id = req.user.user_id;
        
        const [addresses] = await pool.query(`
            SELECT 
                a.address_id,
                a.address_line1,
                a.address_line2,
                a.postcode,
                a.states,
                a.country,
                ua.is_default,
                COUNT(so.shop_order_id) as order_count
            FROM user_address ua
            JOIN address a ON ua.address_id = a.address_id
            LEFT JOIN shop_orders so ON a.address_id = so.shipping_address_id
            WHERE ua.user_id = ?
            GROUP BY a.address_id, a.address_line1, a.address_line2, a.postcode, a.states, a.country, ua.is_default
            ORDER BY ua.is_default DESC, order_count DESC
        `, [user_id]);

        res.status(200).json({
            Data: {
                addresses,
                count: addresses.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Shipping Addresses:', error);
        res.status(500).json({ Error: 'Error Fetching Shipping Addresses' });
    }
}

//Add New Shipping Address
async function addShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { 
            address_line1, 
            address_line2, 
            postcode, 
            states, 
            country, 
            is_default = false 
        } = req.body;

        if (!address_line1 || !postcode || !states || !country) {
            return res.status(400).json({ 
                Message: 'Address line 1, postcode, state, and country are required' 
            });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // If setting as default, remove default from other addresses
            if (is_default) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                    [user_id]
                );
            }

            // Create new address
            const [addressResult] = await connection.query(`
                INSERT INTO address (address_line1, address_line2, postcode, states, country)
                VALUES (?, ?, ?, ?, ?)
            `, [address_line1, address_line2, postcode, states, country]);

            // Link to user
            await connection.query(`
                INSERT INTO user_address (user_id, address_id, is_default)
                VALUES (?, ?, ?)
            `, [user_id, addressResult.insertId, is_default ? 1 : 0]);

            await connection.commit();

            res.status(201).json({
                Message: 'Shipping address added successfully',
                Data: {
                    address_id: addressResult.insertId,
                    address_line1,
                    address_line2,
                    postcode,
                    states,
                    country,
                    is_default
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Adding Shipping Address:', error);
        res.status(500).json({ Error: 'Error Adding Shipping Address' });
    }
}

// Update Shipping Address
async function updateShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;
        const { 
            address_line1, 
            address_line2, 
            postcode, 
            states, 
            country, 
            is_default 
        } = req.body;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id 
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // If setting as default, remove default from other addresses
            if (is_default) {
                await connection.query(
                    'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                    [user_id]
                );
                await connection.query(
                    'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                    [user_id, addressId]
                );
            }

            // Update address details
            const updateFields = {};
            if (address_line1) updateFields.address_line1 = address_line1;
            if (address_line2 !== undefined) updateFields.address_line2 = address_line2;
            if (postcode) updateFields.postcode = postcode;
            if (states) updateFields.states = states;
            if (country) updateFields.country = country;

            if (Object.keys(updateFields).length > 0) {
                await connection.query(
                    'UPDATE address SET ? WHERE address_id = ?',
                    [updateFields, addressId]
                );
            }

            await connection.commit();

            res.status(200).json({
                Message: 'Shipping address updated successfully',
                Data: {
                    address_id: parseInt(addressId),
                    ...updateFields,
                    is_default
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Updating Shipping Address:', error);
        res.status(500).json({ Error: 'Error Updating Shipping Address' });
    }
}

// Delete Shipping Address
async function deleteShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id, ua.is_default
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        // Check if address is used in any orders
        const [orders] = await pool.query(
            'SELECT COUNT(*) as order_count FROM shop_orders WHERE shipping_address_id = ?',
            [addressId]
        );

        if (orders[0].order_count > 0) {
            return res.status(400).json({ 
                Message: 'Cannot delete address that has been used in orders' 
            });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Remove user-address link
            await connection.query(
                'DELETE FROM user_address WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            // Delete address
            await connection.query('DELETE FROM address WHERE address_id = ?', [addressId]);

            // If this was default address, make another one default
            if (userAddress[0].is_default) {
                const [remainingAddresses] = await connection.query(`
                    SELECT ua.address_id 
                    FROM user_address ua 
                    WHERE ua.user_id = ? 
                    LIMIT 1
                `, [user_id]);

                if (remainingAddresses.length > 0) {
                    await connection.query(
                        'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                        [user_id, remainingAddresses[0].address_id]
                    );
                }
            }

            await connection.commit();

            res.status(200).json({ Message: 'Shipping address deleted successfully' });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Deleting Shipping Address:', error);
        res.status(500).json({ Error: 'Error Deleting Shipping Address' });
    }
}

// 5. Set Default Shipping Address
async function setDefaultShippingAddress(req, res) {
    try {
        const user_id = req.user.user_id;
        const { addressId } = req.params;

        // Verify user owns this address
        const [userAddress] = await pool.query(`
            SELECT ua.user_address_id 
            FROM user_address ua 
            WHERE ua.user_id = ? AND ua.address_id = ?
        `, [user_id, addressId]);

        if (userAddress.length === 0) {
            return res.status(404).json({ Message: 'Address not found or access denied' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Remove default from all addresses
            await connection.query(
                'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                [user_id]
            );

            // Set this address as default
            await connection.query(
                'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            await connection.commit();

            res.status(200).json({
                Message: 'Default shipping address updated successfully',
                Data: {
                    address_id: parseInt(addressId),
                    is_default: true
                }
            });
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error('ERROR Setting Default Shipping Address:', error);
        res.status(500).json({ Error: 'Error Setting Default Shipping Address' });
    }
}

// 6. Validate Shipping Address (with Australia Post)
async function validateShippingAddress(req, res) {
    try {
        const { postcode, country = 'Australia' } = req.body;

        if (!postcode) {
            return res.status(400).json({ Message: 'Postcode is required' });
        }

        let isValid = true;
        let localities = [];
        let validationSource = 'manual';

        // If Australian postcode and API available, validate with Australia Post
        if (country.toLowerCase() === 'australia' && process.env.AUSPOST_API_KEY) {
            try {
                const response = await fetch(`https://digitalapi.auspost.com.au/postcode/search.json?q=${postcode}`, {
                    headers: {
                        'AUTH-KEY': process.env.AUSPOST_API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    localities = data.localities?.locality || [];
                    isValid = localities.length > 0;
                    validationSource = 'australia_post';
                }
            } catch (error) {
                console.error('Australia Post validation error:', error);
                // Fall back to basic validation
            }
        }

        // Basic validation for Australian postcodes
        if (country.toLowerCase() === 'australia' && validationSource === 'manual') {
            isValid = /^[0-9]{4}$/.test(postcode) && 
                     parseInt(postcode) >= 800 && 
                     parseInt(postcode) <= 9999;
        }

        res.status(200).json({
            Data: {
                postcode,
                country,
                isValid,
                localities: localities.slice(0, 5), // Limit results
                validationSource,
                suggestions: isValid ? localities.map(loc => ({
                    suburb: loc.name,
                    state: loc.state,
                    postcode: loc.postcode
                })) : []
            }
        });
    } catch (error) {
        console.error('ERROR Validating Shipping Address:', error);
        res.status(500).json({ Error: 'Error Validating Shipping Address' });
    }
};

module.exports = {
    getShippingOptionsForCart,
    createShippingLabel,
    trackOrderWithLabel,
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress,
    validateShippingAddress
};
