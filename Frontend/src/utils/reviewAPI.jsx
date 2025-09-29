// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get all reviews for a product
async function getProductReviews(productId, page = 1, limit = 10) {
    try {
        const response = await fetch(`http://localhost:3000/reviews/product/${productId}?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get product reviews');
        }
        return result;
    } catch (error) {
        console.error('Error getting product reviews:', error);
        throw error;
    }
}

// Get user's reviews
async function getUserReviews() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to view your reviews');
        }

        const response = await fetch(`http://localhost:3000/reviews/my-reviews`, {
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
            throw new Error(result.Message || result.message || 'Failed to get user reviews');
        }
        return result;
    } catch (error) {
        console.error('Error getting user reviews:', error);
        throw error;
    }
}

// Create a new review
async function createReview(reviewData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to create a review');
        }

        const response = await fetch(`http://localhost:3000/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to create review');
        }
        return result;
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
}

// Update a review
async function updateReview(reviewId, reviewData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to update review');
        }

        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
            throw new Error(result.Message || result.message || 'Failed to update review');
        }
        return result;
    } catch (error) {
        console.error('Error updating review:', error);
        throw error;
    }
}

// Delete a review
async function deleteReview(reviewId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in to delete review');
        }

        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
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
            throw new Error(result.Message || result.message || 'Failed to delete review');
        }
        return result;
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}

// Get review by ID
async function getReviewById(reviewId) {
    try {
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get review');
        }
        return result;
    } catch (error) {
        console.error('Error getting review by ID:', error);
        throw error;
    }
}

// Get all reviews (admin)
async function getAllReviews(page = 1, limit = 10) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to view all reviews');
        }

        const response = await fetch(`http://localhost:3000/reviews?page=${page}&limit=${limit}`, {
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
            throw new Error(result.Message || result.message || 'Failed to get all reviews');
        }
        return result;
    } catch (error) {
        console.error('Error getting all reviews:', error);
        throw error;
    }
}

export {
    getProductReviews,
    getUserReviews,
    createReview,
    updateReview,
    deleteReview,
    getReviewById,
    getAllReviews
};
