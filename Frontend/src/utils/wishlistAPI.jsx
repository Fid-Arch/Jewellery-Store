// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get user's wishlist
async function getUserWishlist() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to access your wishlist');
        }

        const response = await fetch(`http://localhost:3000/wishlist`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            console.error('Wishlist API Error:', response.status, result);
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || result.Error || `Failed to get wishlist (${response.status})`);
        }
        return result;
    } catch (error) {
        console.error('Error getting user wishlist:', error);
        throw error;
    }
}

// Add item to wishlist
async function addToWishlist(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to add items to wishlist');
        }

        const response = await fetch(`http://localhost:3000/wishlist/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: productId })
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to add item to wishlist');
        }
        return result;
    } catch (error) {
        console.error('Error adding item to wishlist:', error);
        throw error;
    }
}

// Remove item from wishlist
async function removeFromWishlist(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to remove items from wishlist');
        }

        const response = await fetch(`http://localhost:3000/wishlist/item/${productId}`, {
            method: 'DELETE',
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
            throw new Error(result.Message || result.message || 'Failed to remove item from wishlist');
        }
        return result;
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        throw error;
    }
}

// Check if product is in wishlist
async function isInWishlist(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            return false; // Not logged in, can't be in wishlist
        }

        const response = await fetch(`http://localhost:3000/wishlist/check/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                return false; // Session expired
            }
            return false; // Not in wishlist or error
        }
        return result.isInWishlist || false;
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        return false;
    }
}

// Clear entire wishlist
async function clearWishlist() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to clear wishlist');
        }

        const response = await fetch(`http://localhost:3000/wishlist/clear`, {
            method: 'DELETE',
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
            throw new Error(result.Message || result.message || 'Failed to clear wishlist');
        }
        return result;
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        throw error;
    }
}

// Move item from wishlist to cart
async function moveWishlistToCart(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to move items to cart');
        }

        const response = await fetch(`http://localhost:3000/wishlist/move-to-cart/${productId}`, {
            method: 'POST',
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
            throw new Error(result.Message || result.message || 'Failed to move item to cart');
        }
        return result;
    } catch (error) {
        console.error('Error moving item to cart:', error);
        throw error;
    }
}

export {
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    moveWishlistToCart
};
