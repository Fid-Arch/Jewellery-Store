// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get all users (admin only)
async function getAllUsers() {
    try {
        const response = await fetch(`http://localhost:3000/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get users');
        }
        return result;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

// Get user profile by ID
async function getUserProfile(userId) {
    try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get user profile');
        }
        return result;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

// Update user profile
async function updateUserProfile(userId, profileData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to update your profile');
        }

        const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to update user profile');
        }
        return result;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Change password
async function changePassword(userId, passwordData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to change password');
        }

        const response = await fetch(`http://localhost:3000/auth/${userId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to change password');
        }
        return result;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;
    }
}

// Logout user
async function logoutUser() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No active session to logout');
        }

        const response = await fetch(`http://localhost:3000/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to logout');
        }
        return result;
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
}

// Refresh token
async function refreshToken() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No token to refresh');
        }

        const response = await fetch(`http://localhost:3000/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to refresh token');
        }
        return result;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

export {
    getAllUsers,
    getUserProfile,
    updateUserProfile,
    changePassword,
    logoutUser,
    refreshToken
};
