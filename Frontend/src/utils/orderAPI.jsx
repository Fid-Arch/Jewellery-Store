// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Create new order
async function createOrder(orderData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to create an order');
        }

        const response = await fetch(`http://localhost:3000/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to create order');
        }
        return result;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Get user's orders
async function getUserOrders() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to view your orders');
        }

        const response = await fetch(`http://localhost:3000/orders/my-orders`, {
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
            throw new Error(result.Message || result.message || 'Failed to get orders');
        }
        return result;
    } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
    }
}

// Get order by ID
async function getOrderById(orderId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to view order details');
        }

        const response = await fetch(`http://localhost:3000/orders/${orderId}`, {
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
            throw new Error(result.Message || result.message || 'Failed to get order');
        }
        return result;
    } catch (error) {
        console.error('Error getting order by ID:', error);
        throw error;
    }
}

// Track order by label (public endpoint)
async function trackOrderByLabel(orderLabel) {
    try {
        const response = await fetch(`http://localhost:3000/orders/track/${orderLabel}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to track order');
        }
        return result;
    } catch (error) {
        console.error('Error tracking order:', error);
        throw error;
    }
}

// Admin: Get all orders
async function getAllOrdersAdmin() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to view all orders');
        }

        const response = await fetch(`http://localhost:3000/orders`, {
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
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to get all orders');
        }
        return result;
    } catch (error) {
        console.error('Error getting all orders:', error);
        throw error;
    }
}

// Admin: Update order status
async function updateOrderStatus(orderId, statusData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to update order status');
        }

        const response = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(statusData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to update order status');
        }
        return result;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

export {
    createOrder,
    getUserOrders,
    getOrderById,
    trackOrderByLabel,
    getAllOrdersAdmin,
    updateOrderStatus
};
