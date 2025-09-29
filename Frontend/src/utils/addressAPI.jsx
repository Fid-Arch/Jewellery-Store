// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get user's shipping addresses
async function getUserShippingAddresses() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to access your addresses');
        }

        const response = await fetch(`http://localhost:3000/addresses/shipping`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to get addresses');
        }
        return result;
    } catch (error) {
        console.error('Error getting user addresses:', error);
        throw error;
    }
}

// Add new shipping address
async function addShippingAddress(addressData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to add addresses');
        }

        const response = await fetch(`http://localhost:3000/addresses/shipping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to add address');
        }
        return result;
    } catch (error) {
        console.error('Error adding address:', error);
        throw error;
    }
}

// Update shipping address
async function updateShippingAddress(addressId, addressData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to update addresses');
        }

        const response = await fetch(`http://localhost:3000/addresses/shipping/${addressId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to update address');
        }
        return result;
    } catch (error) {
        console.error('Error updating address:', error);
        throw error;
    }
}

// Delete shipping address
async function deleteShippingAddress(addressId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to delete addresses');
        }

        const response = await fetch(`http://localhost:3000/addresses/shipping/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to delete address');
        }
        return result;
    } catch (error) {
        console.error('Error deleting address:', error);
        throw error;
    }
}

// Set default shipping address
async function setDefaultShippingAddress(addressId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to set default address');
        }

        const response = await fetch(`http://localhost:3000/addresses/shipping/${addressId}/default`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to set default address');
        }
        return result;
    } catch (error) {
        console.error('Error setting default address:', error);
        throw error;
    }
}

export {
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress
};