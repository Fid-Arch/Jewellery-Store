// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get user's cart
async function getUserCart() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to access your cart');
        }

        const response = await fetch(`http://localhost:3000/cart`, {
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
            throw new Error(result.Message || result.message || 'Failed to get cart');
        }
        return result;
    } catch (error) {
        console.error('Error getting user cart:', error);
        throw error;
    }
}

// Add item to cart
async function addItemToCart(data) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to add items to cart');
        }

        const response = await fetch(`http://localhost:3000/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to add item to cart');
        }
        return result;
    } catch (error) {
        console.error('Error adding item to cart:', error);
        throw error;
    }
}

// Update cart item quantity
async function updateCartItem(productId, data) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to update cart');
        }

        const response = await fetch(`http://localhost:3000/cart/item/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to update cart item');
        }
        return result;
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
}

// Remove item from cart
async function removeCartItem(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to remove items from cart');
        }

        const response = await fetch(`http://localhost:3000/cart/item/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to remove cart item');
        }
        return result;
    } catch (error) {
        console.error('Error removing cart item:', error);
        throw error;
    }
}

// Clear entire cart
async function clearUserCart() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to clear cart');
        }

        const response = await fetch(`http://localhost:3000/cart/clear`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to clear cart');
        }
        return result;
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
}

// Get cart summary
async function getCartSummary() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to get cart summary');
        }

        const response = await fetch(`http://localhost:3000/cart/summary`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get cart summary');
        }
        return result;
    } catch (error) {
        console.error('Error getting cart summary:', error);
        throw error;
    }
}

export {
    getUserCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearUserCart,
    getCartSummary
};