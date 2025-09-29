// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Enhanced fetch wrapper with error handling, retries, and timeout
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: API_CONFIG.TIMEOUT,
        ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const response = await fetch(url, {
                ...defaultOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Parse response
            let result;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                result = await response.text();
            }
            
            // Handle different response statuses
            if (!response.ok) {
                const error = new Error(result.Message || result.message || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = result;
                
                // Handle specific status codes
                switch (response.status) {
                    case 401:
                        error.message = 'Your session has expired. Please log in again.';
                        // Optionally clear user data and redirect to login
                        localStorage.removeItem('user');
                        localStorage.removeItem('userCart');
                        break;
                    case 403:
                        error.message = 'Access denied. Insufficient permissions.';
                        break;
                    case 404:
                        error.message = 'Resource not found.';
                        break;
                    case 422:
                        error.message = 'Invalid data provided.';
                        break;
                    case 500:
                        error.message = 'Server error. Please try again later.';
                        break;
                    default:
                        error.message = result.Message || result.message || `Request failed with status ${response.status}`;
                }
                
                throw error;
            }
            
            return result;
            
        } catch (error) {
            lastError = error;
            
            // Don't retry on certain errors
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your connection and try again.');
            }
            
            if (error.status === 401 || error.status === 403 || error.status === 404) {
                throw error; // Don't retry auth/not found errors
            }
            
            // If this is the last attempt, throw the error
            if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
                throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
        }
    }
    
    throw lastError;
}

// Convenience methods for different HTTP methods
export const api = {
    get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, data, options = {}) => apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
    }),
    put: (endpoint, data, options = {}) => apiRequest(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    patch: (endpoint, data, options = {}) => apiRequest(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' })
};

// Export configuration
export { API_CONFIG, getAuthToken };
export default api;
