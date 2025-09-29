// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Create payment intent
async function createPaymentIntent(amount, currency = 'usd') {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to process payment');
        }

        const response = await fetch(`http://localhost:3000/payments/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, currency })
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to create payment intent');
        }
        return result;
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

// Confirm payment
async function confirmPayment(paymentIntentId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to confirm payment');
        }

        const response = await fetch(`http://localhost:3000/payments/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to confirm payment');
        }
        return result;
    } catch (error) {
        console.error('Error confirming payment:', error);
        throw error;
    }
}

// Get payment history
async function getPaymentHistory() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to view payment history');
        }

        const response = await fetch(`http://localhost:3000/payments/history`, {
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
            throw new Error(result.Message || result.message || 'Failed to get payment history');
        }
        return result;
    } catch (error) {
        console.error('Error getting payment history:', error);
        throw error;
    }
}

// Get payment by ID
async function getPaymentById(paymentId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to view payment details');
        }

        const response = await fetch(`http://localhost:3000/payments/${paymentId}`, {
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
            throw new Error(result.Message || result.message || 'Failed to get payment details');
        }
        return result;
    } catch (error) {
        console.error('Error getting payment by ID:', error);
        throw error;
    }
}

// Refund payment
async function refundPayment(paymentId, amount = null) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to process refund');
        }

        const response = await fetch(`http://localhost:3000/payments/${paymentId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to process refund');
        }
        return result;
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
}

// Get all payments (admin)
async function getAllPayments(page = 1, limit = 10) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to view all payments');
        }

        const response = await fetch(`http://localhost:3000/payments?page=${page}&limit=${limit}`, {
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
            throw new Error(result.Message || result.message || 'Failed to get all payments');
        }
        return result;
    } catch (error) {
        console.error('Error getting all payments:', error);
        throw error;
    }
}

export {
    createPaymentIntent,
    confirmPayment,
    getPaymentHistory,
    getPaymentById,
    refundPayment,
    getAllPayments
};
