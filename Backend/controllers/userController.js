const pool = require('../config/database');

// Get All Users
async function getAllUsers(req, res) {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error("ERROR Fetching Users:", error);
        res.status(500).send('Error Fetching data from the database');
    }
}

// Get User Profile
async function getUserProfile(req, res) {
    try {
        const { id } = req.params;
        const [users] = await pool.query(
            `SELECT u.user_id, u.firstName, u.lastName, u.email, u.phoneNumber, 
                    u.createdAt, r.role_name 
             FROM users u 
             LEFT JOIN roles r ON u.roles_id = r.roles_id 
             WHERE u.user_id = ?`, 
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ Message: 'User not found' });
        }

        const user = users[0];
        res.status(200).json({
            user: {
                id: user.user_id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role_name,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        console.error('ERROR Fetching User Profile:', error);
        res.status(500).json({ Message: 'Error fetching user profile' });
    }
}

// Update User Profile
async function updateUserProfile(req, res) {
    try {
        const user_id = req.user.user_id;
        const { firstName, lastName, email, phoneNumber } = req.body;

        if (!firstName && !lastName && !email && !phoneNumber) {
            return res.status(400).json({ Message: 'At least one field is required to update' });
        }

        // Check if email is being updated and if it's already in use by another user
        if (email) {
            const [existingUser] = await pool.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, user_id]);
            if (existingUser.length > 0) {
                return res.status(400).json({ Message: 'Email already in use by another account' });
            }
        }

        // Build dynamic update query based on provided fields
        const updateFields = [];
        const updateValues = [];

        if (firstName) {
            updateFields.push('firstName = ?');
            updateValues.push(firstName);
        }
        if (lastName) {
            updateFields.push('lastName = ?');
            updateValues.push(lastName);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phoneNumber) {
            updateFields.push('phoneNumber = ?');
            updateValues.push(phoneNumber);
        }

        // Add user_id for WHERE clause
        updateValues.push(user_id);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
        const [result] = await pool.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'User not found' });
        }

        // Fetch updated user data (excluding password)
        const [updatedUser] = await pool.query(
            'SELECT user_id, firstName, lastName, email, phoneNumber, createdAt FROM users WHERE user_id = ?', 
            [user_id]
        );

        res.status(200).json({
            Message: 'Profile updated successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error("ERROR updating User Profile:", error);
        res.status(500).json({ Message: 'Error updating User Profile' });
    }
}

module.exports = {
    getAllUsers,
    getUserProfile,
    updateUserProfile
};