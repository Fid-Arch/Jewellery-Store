// API Integration Test
// This file can be used to test the API integration

import apiService from '../services/apiService';

// Test function to verify API integration
export const testAPIIntegration = async () => {
    console.log('🧪 Testing API Integration...');
    
    try {
        // Test 1: Get categories (public endpoint)
        console.log('1. Testing categories API...');
        const categories = await apiService.category.getAllCategories();
        console.log('✅ Categories API working:', categories);
        
        // Test 2: Get products (public endpoint)
        console.log('2. Testing products API...');
        const products = await apiService.product.getAllProducts(1, 5);
        console.log('✅ Products API working:', products);
        
        // Test 3: Get featured products
        console.log('3. Testing featured products API...');
        const featured = await apiService.product.getFeaturedProducts();
        console.log('✅ Featured products API working:', featured);
        
        console.log('🎉 All API tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        return false;
    }
};

// Test authenticated endpoints (requires login)
export const testAuthenticatedAPIs = async () => {
    console.log('🔐 Testing Authenticated APIs...');
    
    try {
        // Check if user is logged in
        const isAuthenticated = apiService.utils.isAuthenticated();
        if (!isAuthenticated) {
            console.log('⚠️ User not authenticated, skipping authenticated tests');
            return false;
        }
        
        // Test cart API
        console.log('1. Testing cart API...');
        const cart = await apiService.cart.getUserCart();
        console.log('✅ Cart API working:', cart);
        
        // Test user profile
        console.log('2. Testing user profile API...');
        const user = apiService.utils.getCurrentUser();
        if (user?.id) {
            const profile = await apiService.user.getUserProfile(user.id);
            console.log('✅ User profile API working:', profile);
        }
        
        console.log('🎉 All authenticated API tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ Authenticated API test failed:', error);
        return false;
    }
};

// Run all tests
export const runAllTests = async () => {
    console.log('🚀 Starting API Integration Tests...');
    
    const publicTests = await testAPIIntegration();
    const authTests = await testAuthenticatedAPIs();
    
    if (publicTests && authTests) {
        console.log('🎉 All tests passed! API integration is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the console for details.');
    }
    
    return publicTests && authTests;
};

// Export for easy testing
export default {
    testAPIIntegration,
    testAuthenticatedAPIs,
    runAllTests
};
