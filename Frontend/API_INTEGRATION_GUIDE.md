# Backend-Frontend API Integration Guide

## Overview
This guide explains how to use the centralized API service to integrate your React frontend with the Node.js backend API.

## Quick Start

### 1. Import the API Service
```jsx
import apiService from '../services/apiService';
```

### 2. Use API Functions
```jsx
// Get products
const products = await apiService.product.getAllProducts(1, 10);

// Add to cart
await apiService.cart.addItemToCart({ product_item_id: 123, qty: 1 });

// Create order
const order = await apiService.order.createOrder(orderData);
```

## Available API Modules

### Authentication (`apiService.auth`)
- `login(credentials)` - User login
- `register(userData)` - User registration
- `refreshToken()` - Refresh JWT token
- `changePassword(userId, data)` - Change password
- `logout()` - User logout

### Products (`apiService.product`)
- `getAllProducts(page, limit)` - Get paginated products
- `getProductById(id)` - Get single product
- `searchProducts(query, page, limit)` - Search products
- `getFeaturedProducts()` - Get featured products
- `getProductsByCategory(categoryId, page, limit)` - Get products by category
- `createProduct(data)` - Create product (admin)
- `updateProduct(id, data)` - Update product (admin)
- `deleteProduct(id)` - Delete product (admin)

### Cart (`apiService.cart`)
- `getUserCart()` - Get user's cart
- `addItemToCart(data)` - Add item to cart
- `updateCartItem(productId, data)` - Update cart item
- `removeCartItem(productId)` - Remove item from cart
- `clearUserCart()` - Clear entire cart
- `getCartSummary()` - Get cart summary

### Orders (`apiService.order`)
- `createOrder(data)` - Create new order
- `getUserOrders()` - Get user's orders
- `getOrderById(id)` - Get order details
- `trackOrderByLabel(label)` - Track order (public)
- `getAllOrdersAdmin()` - Get all orders (admin)
- `updateOrderStatus(id, data)` - Update order status (admin)

### Users (`apiService.user`)
- `getAllUsers()` - Get all users
- `getUserProfile(id)` - Get user profile
- `updateUserProfile(id, data)` - Update user profile

### Reviews (`apiService.review`)
- `getProductReviews(productId, page, limit)` - Get product reviews
- `getUserReviews()` - Get user's reviews
- `createReview(data)` - Create review
- `updateReview(id, data)` - Update review
- `deleteReview(id)` - Delete review
- `getAllReviews(page, limit)` - Get all reviews (admin)

### Wishlist (`apiService.wishlist`)
- `getUserWishlist()` - Get user's wishlist
- `addToWishlist(productId)` - Add to wishlist
- `removeFromWishlist(productId)` - Remove from wishlist
- `isInWishlist(productId)` - Check if in wishlist
- `clearWishlist()` - Clear wishlist

### Payments (`apiService.payment`)
- `createPaymentIntent(amount, currency)` - Create payment intent
- `confirmPayment(paymentIntentId)` - Confirm payment
- `getPaymentHistory()` - Get payment history
- `getPaymentById(id)` - Get payment details
- `refundPayment(id, amount)` - Process refund
- `getAllPayments(page, limit)` - Get all payments (admin)

### Categories (`apiService.category`)
- `getAllCategories()` - Get all categories

### Addresses (`apiService.address`)
- `getUserAddresses()` - Get user addresses
- `createAddress(data)` - Create address
- `updateAddress(id, data)` - Update address
- `deleteAddress(id)` - Delete address

### Promotions (`apiService.promotion`)
- `getAllPromotions()` - Get all promotions
- `getActivePromotions()` - Get active promotions
- `createPromotion(data)` - Create promotion (admin)
- `updatePromotion(id, data)` - Update promotion (admin)
- `deletePromotion(id)` - Delete promotion (admin)

### Admin (`apiService.admin`)
- `getDashboardStats()` - Get dashboard statistics
- `getAllUsers()` - Get all users
- `getAllOrders()` - Get all orders
- `getAllProducts()` - Get all products
- `getReports(type, dateRange)` - Get reports

## Error Handling

The API service includes comprehensive error handling:

```jsx
try {
    const result = await apiService.product.getAllProducts();
    // Handle success
} catch (error) {
    // Error is automatically handled with appropriate messages
    console.error('API Error:', error.message);
    
    // Common error types:
    // - 401: Session expired (user redirected to login)
    // - 403: Access denied
    // - 404: Resource not found
    // - 422: Invalid data
    // - 500: Server error
}
```

## Configuration

### Environment Variables
Create a `.env` file in your frontend directory:

```env
REACT_APP_API_URL=http://localhost:3000
```

### API Configuration
The API service is configured in `src/utils/apiConfig.jsx`:

```jsx
const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};
```

## Usage Examples

### 1. Product Listing Component
```jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const result = await apiService.product.getAllProducts(1, 20);
                setProducts(result.data || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {products.map(product => (
                <div key={product.id}>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                </div>
            ))}
        </div>
    );
};
```

### 2. Cart Management
```jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const Cart = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const result = await apiService.cart.getUserCart();
                setCart(result.data);
            } catch (error) {
                console.error('Error fetching cart:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, []);

    const addToCart = async (productId) => {
        try {
            await apiService.cart.addItemToCart({ 
                product_item_id: productId, 
                qty: 1 
            });
            // Refresh cart
            const result = await apiService.cart.getUserCart();
            setCart(result.data);
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await apiService.cart.removeCartItem(productId);
            // Refresh cart
            const result = await apiService.cart.getUserCart();
            setCart(result.data);
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2>Your Cart</h2>
            {cart?.items?.map(item => (
                <div key={item.id}>
                    <h4>{item.product_name}</h4>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ${item.price}</p>
                    <button onClick={() => removeFromCart(item.product_id)}>
                        Remove
                    </button>
                </div>
            ))}
        </div>
    );
};
```

### 3. Order Creation
```jsx
import React, { useState } from 'react';
import apiService from '../services/apiService';

const Checkout = () => {
    const [orderData, setOrderData] = useState({
        shipping_address: '',
        billing_address: '',
        payment_method: 'stripe'
    });

    const createOrder = async () => {
        try {
            const result = await apiService.order.createOrder(orderData);
            console.log('Order created:', result);
            // Redirect to order confirmation
        } catch (error) {
            console.error('Error creating order:', error);
        }
    };

    return (
        <div>
            <h2>Checkout</h2>
            <form onSubmit={(e) => { e.preventDefault(); createOrder(); }}>
                <input
                    type="text"
                    placeholder="Shipping Address"
                    value={orderData.shipping_address}
                    onChange={(e) => setOrderData({
                        ...orderData,
                        shipping_address: e.target.value
                    })}
                />
                <button type="submit">Place Order</button>
            </form>
        </div>
    );
};
```

## Migration from Legacy APIs

If you're updating existing components that use the old API files:

### Before (Legacy)
```jsx
import { getAllProducts } from '../utils/productAPI';
import { addItemToCart } from '../utils/cartAPI';
```

### After (New Service)
```jsx
import apiService from '../services/apiService';

// Use the centralized service
const products = await apiService.product.getAllProducts();
await apiService.cart.addItemToCart(data);
```

## Best Practices

1. **Always handle errors** - The API service provides consistent error handling
2. **Use loading states** - Show loading indicators during API calls
3. **Cache data when appropriate** - Use React state or context for frequently accessed data
4. **Implement retry logic** - The service includes automatic retries for failed requests
5. **Use TypeScript** - Consider adding TypeScript for better type safety

## Testing

The API service can be easily mocked for testing:

```jsx
// Mock the API service
jest.mock('../services/apiService', () => ({
    product: {
        getAllProducts: jest.fn().mockResolvedValue({ data: [] })
    },
    cart: {
        addItemToCart: jest.fn().mockResolvedValue({})
    }
}));
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend has CORS configured properly
2. **Authentication Errors**: Check if JWT tokens are being sent correctly
3. **Network Errors**: Verify the API base URL is correct
4. **Timeout Errors**: Increase the timeout in API_CONFIG if needed

### Debug Mode

Enable debug logging by setting:
```jsx
localStorage.setItem('debug', 'api');
```

This will log all API requests and responses to the console.
