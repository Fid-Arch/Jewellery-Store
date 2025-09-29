// Native fetch works in browser; no node-fetch needed
async function loginUser(data) {
    try {
        const response = await fetch(`http://localhost:3000/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Login failed');
        }
        return result;
    } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
    }
}

async function registerUser(data) {
    try {
        const response = await fetch(`http://localhost:3000/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
        }
        return result;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

async function updateUserProfile(userId, updateData, token) {
    try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`, // ✅ Auth with token
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Update failed');
        }
        return result; // e.g., { user: { id, firstName, lastName, ... } }
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

async function getUserProfile(userId, token) {
    try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // ✅ Auth with token
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Fetch failed');
        }
        return result; // e.g., { user: { id, firstName, lastName, email, ... } }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

export {
    registerUser,
    loginUser,
    updateUserProfile,
    getUserProfile,
};