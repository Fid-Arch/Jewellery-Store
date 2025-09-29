// Example of how to use the new centralized API service
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const APIUsageExample = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Example: Fetch products using the new API service
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await apiService.product.getAllProducts(1, 10);
            setProducts(result.data || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Example: Add item to cart
    const addToCart = async (productId) => {
        try {
            await apiService.cart.addItemToCart({ 
                product_item_id: productId, 
                qty: 1 
            });
            console.log('Item added to cart successfully');
        } catch (err) {
            console.error('Error adding to cart:', err);
        }
    };

    // Example: Create order
    const createOrder = async (orderData) => {
        try {
            const result = await apiService.order.createOrder(orderData);
            console.log('Order created:', result);
            return result;
        } catch (err) {
            console.error('Error creating order:', err);
            throw err;
        }
    };

    // Example: User authentication
    const handleLogin = async (credentials) => {
        try {
            const result = await apiService.auth.login(credentials);
            console.log('Login successful:', result);
            // Store user data in context or localStorage
            return result;
        } catch (err) {
            console.error('Login failed:', err);
            throw err;
        }
    };

    // Example: Get user profile
    const fetchUserProfile = async (userId) => {
        try {
            const result = await apiService.user.getUserProfile(userId);
            console.log('User profile:', result);
            return result;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            throw err;
        }
    };

    // Example: Product reviews
    const fetchProductReviews = async (productId) => {
        try {
            const result = await apiService.review.getProductReviews(productId);
            console.log('Product reviews:', result);
            return result;
        } catch (err) {
            console.error('Error fetching reviews:', err);
            throw err;
        }
    };

    // Example: Wishlist operations
    const toggleWishlist = async (productId) => {
        try {
            const isInWishlist = await apiService.wishlist.isInWishlist(productId);
            
            if (isInWishlist) {
                await apiService.wishlist.removeFromWishlist(productId);
                console.log('Removed from wishlist');
            } else {
                await apiService.wishlist.addToWishlist(productId);
                console.log('Added to wishlist');
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
        }
    };

    // Example: Payment processing
    const processPayment = async (amount) => {
        try {
            // Create payment intent
            const intent = await apiService.payment.createPaymentIntent(amount);
            console.log('Payment intent created:', intent);
            
            // In a real app, you'd integrate with Stripe Elements here
            // For now, just confirm the payment
            const result = await apiService.payment.confirmPayment(intent.client_secret);
            console.log('Payment confirmed:', result);
            return result;
        } catch (err) {
            console.error('Payment failed:', err);
            throw err;
        }
    };

    // Example: Admin operations
    const fetchAdminStats = async () => {
        try {
            const stats = await apiService.admin.getDashboardStats();
            console.log('Admin dashboard stats:', stats);
            return stats;
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>API Usage Examples</h2>
            <p>This component demonstrates how to use the centralized API service.</p>
            
            <div>
                <h3>Products ({products.length})</h3>
                {products.map(product => (
                    <div key={product.id}>
                        <h4>{product.name}</h4>
                        <p>{product.description}</p>
                        <button onClick={() => addToCart(product.id)}>
                            Add to Cart
                        </button>
                        <button onClick={() => toggleWishlist(product.id)}>
                            Toggle Wishlist
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default APIUsageExample;
