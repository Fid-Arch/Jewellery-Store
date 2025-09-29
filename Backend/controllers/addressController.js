const pool = require('../config/database');

// Create Address
async function createAddress(req, res) {
    try {
        const { address_line1, address_line2, postcode, state, country } = req.body;
        if (!address_line1) {
            return res.status(400).json({ Message: 'Address line 1 is required' });
        }
        
        const [inputAddress] = await pool.query(
            'INSERT INTO address (address_line1, address_line2, postcode, states, country) VALUES (?,?,?,?,?)', 
            [address_line1, address_line2, postcode, state, country]
        );
        
        res.status(201).json({
            Message: 'Address added successfully',
            addressId: inputAddress.insertId
        });
    } catch (error) {
        console.error("ERROR Adding Address:", error);
        res.status(500).json({ Message: 'Error adding address' });
    }
}

// Delete Address
async function deleteAddress(req, res) {
    try {
        const { id } = req.params;
        const [deleteResult] = await pool.query('DELETE FROM address WHERE address_id = ?', [id]);
        
        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ Message: 'Address not found' });
        }
        
        res.status(200).json({ Message: 'Address deleted successfully' });
    } catch (error) {
        console.error("ERROR Deleting Address:", error);
        res.status(500).json({ Message: 'Error deleting address' });
    }
}

// Update Address
async function updateAddress(req, res) {
    try {
        const { id } = req.params;
        const fieldAddress = req.body;
        
        if (Object.keys(fieldAddress).length === 0) {
            return res.status(400).json({ Message: 'No fields to update' });
        }
        
        const [updateResult] = await pool.query('UPDATE address SET ? WHERE address_id = ?', [fieldAddress, id]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ Message: `Address ID ${id} not found` });
        }
        
        res.status(200).json({ Message: `Address ID ${id} updated successfully` });
    } catch (error) {
        console.error('ERROR Updating Address:', error);
        res.status(500).json({ Message: 'Error updating address' });
    }
}

// Link User and Address
async function linkUserAddress(req, res) {
    try {
        const { user_id } = req.params;
        const { address_id, is_default = false } = req.body;

        if (!address_id) {
            return res.status(400).json({ Message: 'Address ID is required' });
        }

        // Check if address exists
        const [addressCheck] = await pool.query('SELECT address_id FROM address WHERE address_id = ?', [address_id]);
        if (addressCheck.length === 0) {
            return res.status(404).json({ Message: 'Address not found' });
        }

        // Check if link already exists
        const [existingLink] = await pool.query(
            'SELECT user_address_id FROM user_address WHERE user_id = ? AND address_id = ?', 
            [user_id, address_id]
        );
        
        if (existingLink.length > 0) {
            return res.status(400).json({ Message: 'Address already linked to user' });
        }

        const [linked] = await pool.query(
            'INSERT INTO user_address (user_id, address_id, is_default) VALUES (?,?,?)', 
            [user_id, address_id, is_default]
        );
        
        res.status(201).json({
            Message: 'Address linked to user successfully',
            linkId: linked.insertId
        });
    } catch (error) {
        console.error('ERROR Linking Address to User:', error);
        res.status(500).json({ Message: 'Error linking address to user' });
    }
}

// Get User Shipping Addresses
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
            LEFT JOIN shop_orders so ON a.address_id = so.shipping_address
            WHERE ua.user_id = ?
            GROUP BY a.address_id, a.address_line1, a.address_line2, a.postcode, a.states, a.country, ua.is_default
            ORDER BY ua.is_default DESC, order_count DESC
        `, [user_id]);

        res.status(200).json({
            data: {
                addresses,
                count: addresses.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Shipping Addresses:', error);
        res.status(500).json({ Error: 'Error Fetching Shipping Addresses' });
    }
}

// Add New Shipping Address
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
                data: {
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
                data: {
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

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Remove user-address link
            await connection.query(
                'DELETE FROM user_address WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            // Check if any other users are linked to this address
            const [otherUsers] = await connection.query(
                'SELECT COUNT(*) as count FROM user_address WHERE address_id = ?',
                [addressId]
            );

            // If no other users, delete the address itself
            if (otherUsers[0].count === 0) {
                await connection.query(
                    'DELETE FROM address WHERE address_id = ?',
                    [addressId]
                );
            }

            await connection.commit();

            res.status(200).json({
                Message: 'Shipping address deleted successfully'
            });
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

// Set Default Shipping Address
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

            // Remove default from all user addresses
            await connection.query(
                'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                [user_id]
            );

            // Set new default
            await connection.query(
                'UPDATE user_address SET is_default = 1 WHERE user_id = ? AND address_id = ?',
                [user_id, addressId]
            );

            await connection.commit();

            res.status(200).json({
                Message: 'Default shipping address updated successfully'
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

module.exports = {
    createAddress,
    deleteAddress,
    updateAddress,
    linkUserAddress,
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress
};