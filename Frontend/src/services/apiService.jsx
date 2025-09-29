// Centralized API Service
import api, { getAuthToken } from '../utils/apiConfig';

// ==================== AUTHENTICATION ====================
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    refreshToken: () => api.post('/auth/refresh-token'),
    changePassword: (userId, data) => api.patch(`/auth/${userId}/password`, data),
    logout: () => api.post('/auth/logout')
};

// ==================== USERS ====================
export const userAPI = {
    getAllUsers: () => api.get('/users'),
    getUserProfile: (userId) => api.get(`/users/${userId}`),
    updateUserProfile: (userId, data) => api.patch(`/users/${userId}`, data)
};

// ==================== PRODUCTS ====================
export const productAPI = {
    getAllProducts: (page = 1, limit = 10) => api.get(`/products?page=${page}&limit=${limit}`),
    getProductById: (productId) => api.get(`/products/${productId}`),
    searchProducts: (query, page = 1, limit = 10) => api.get(`/products/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
    getFeaturedProducts: () => api.get('/products/featured'),
    getProductsByCategory: (categoryId, page = 1, limit = 10) => api.get(`/products/category/${categoryId}?page=${page}&limit=${limit}`),
    getProductSuggestions: (productId) => api.get(`/products/${productId}/suggestions`),
    getProductItems: (productId) => api.get(`/products/${productId}`),
    
    // Admin functions
    createProduct: (data) => api.post('/products', data),
    updateProduct: (productId, data) => api.patch(`/products/${productId}`, data),
    updateProductItem: (itemId, data) => api.patch(`/products/items/${itemId}`, data),
    createProductItem: (productId, data) => api.post(`/products/${productId}/items`, data),
    deleteProduct: (productId) => api.delete(`/products/${productId}`)
};

// ==================== CATEGORIES ====================
export const categoryAPI = {
    getAllCategories: () => api.get('/categories')
};

// ==================== CART ====================
export const cartAPI = {
    getUserCart: () => api.get('/cart'),
    addItemToCart: (data) => api.post('/cart/add', data),
    updateCartItem: (productId, data) => api.put(`/cart/item/${productId}`, data),
    removeCartItem: (productId) => api.delete(`/cart/item/${productId}`),
    clearUserCart: () => api.delete('/cart/clear'),
    getCartSummary: () => api.get('/cart/summary')
};

// ==================== ORDERS ====================
export const orderAPI = {
    createOrder: (data) => api.post('/orders', data),
    getUserOrders: () => api.get('/orders/my-orders'),
    getOrderById: (orderId) => api.get(`/orders/${orderId}`),
    trackOrderByLabel: (orderLabel) => api.get(`/orders/track/${orderLabel}`),
    
    // Admin functions
    getAllOrdersAdmin: () => api.get('/orders'),
    updateOrderStatus: (orderId, data) => api.patch(`/orders/${orderId}/status`, data)
};

// ==================== REVIEWS ====================
export const reviewAPI = {
    getProductReviews: (productId, page = 1, limit = 10) => api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`),
    getUserReviews: () => api.get('/reviews/my-reviews'),
    createReview: (data) => api.post('/reviews', data),
    updateReview: (reviewId, data) => api.patch(`/reviews/${reviewId}`, data),
    deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
    getReviewById: (reviewId) => api.get(`/reviews/${reviewId}`),
    
    // Admin functions
    getAllReviews: (page = 1, limit = 10) => api.get(`/reviews?page=${page}&limit=${limit}`)
};

// ==================== WISHLIST ====================
export const wishlistAPI = {
    getUserWishlist: () => api.get('/wishlist'),
    addToWishlist: (productId) => api.post('/wishlist/add', { product_id: productId }),
    removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`),
    isInWishlist: (productId) => api.get(`/wishlist/check/${productId}`),
    clearWishlist: () => api.delete('/wishlist/clear')
};

// ==================== PAYMENTS ====================
export const paymentAPI = {
    createPaymentIntent: (amount, currency = 'usd') => api.post('/payments/create-intent', { amount, currency }),
    confirmPayment: (paymentIntentId) => api.post('/payments/confirm', { payment_intent_id: paymentIntentId }),
    getPaymentHistory: () => api.get('/payments/history'),
    getPaymentById: (paymentId) => api.get(`/payments/${paymentId}`),
    refundPayment: (paymentId, amount = null) => api.post(`/payments/${paymentId}/refund`, { amount }),
    
    // Admin functions
    getAllPayments: (page = 1, limit = 10) => api.get(`/payments?page=${page}&limit=${limit}`)
};

// ==================== ADDRESSES ====================
export const addressAPI = {
    getUserAddresses: () => api.get('/addresses'),
    createAddress: (data) => api.post('/addresses', data),
    updateAddress: (addressId, data) => api.patch(`/addresses/${addressId}`, data),
    deleteAddress: (addressId) => api.delete(`/addresses/${addressId}`),
    getAddressById: (addressId) => api.get(`/addresses/${addressId}`)
};

// ==================== PROMOTIONS ====================
export const promotionAPI = {
    getAllPromotions: () => api.get('/promotions'),
    getPromotionById: (promotionId) => api.get(`/promotions/${promotionId}`),
    getActivePromotions: () => api.get('/promotions/active'),
    
    // Admin functions
    createPromotion: (data) => api.post('/promotions', data),
    updatePromotion: (promotionId, data) => api.patch(`/promotions/${promotionId}`, data),
    deletePromotion: (promotionId) => api.delete(`/promotions/${promotionId}`)
};

// ==================== ADMIN ====================
export const adminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard'),
    getAllUsers: () => api.get('/admin/users'),
    getAllOrders: () => api.get('/admin/orders'),
    getAllProducts: () => api.get('/admin/products'),
    getAllReviews: () => api.get('/admin/reviews'),
    getReports: (type, dateRange) => api.get(`/admin/reports/${type}?start=${dateRange.start}&end=${dateRange.end}`)
};

// ==================== UTILITY FUNCTIONS ====================
export const apiUtils = {
    // Check if user is authenticated
    isAuthenticated: () => {
        const token = getAuthToken();
        return !!token;
    },
    
    // Get current user from localStorage
    getCurrentUser: () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        return user;
    },
    
    // Clear all user data
    clearUserData: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userCart');
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
    },
    
    // Handle API errors consistently
    handleError: (error) => {
        console.error('API Error:', error);
        
        if (error.status === 401) {
            // Session expired, clear user data
            apiUtils.clearUserData();
            // Optionally redirect to login page
            window.location.href = '/login';
        }
        
        return error;
    }
};

// Export all APIs as a single object for easy importing
export default {
    auth: authAPI,
    user: userAPI,
    product: productAPI,
    category: categoryAPI,
    cart: cartAPI,
    order: orderAPI,
    review: reviewAPI,
    wishlist: wishlistAPI,
    payment: paymentAPI,
    address: addressAPI,
    promotion: promotionAPI,
    admin: adminAPI,
    utils: apiUtils
};
