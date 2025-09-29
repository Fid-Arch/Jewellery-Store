import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
    getAllProducts, 
    getProductById, 
    searchProducts, 
    getFeaturedProducts, 
    getProductsByCategory 
} from "../utils/productAPI";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Load featured products on component mount
    useEffect(() => {
        loadFeaturedProducts();
    }, []);

    // Load featured products
    const loadFeaturedProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getFeaturedProducts();
            setFeaturedProducts(result.data?.products || result.products || []);
        } catch (err) {
            console.error('Failed to load featured products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load all products with pagination
    const loadProducts = useCallback(async (page = 1, limit = 10) => {
        try {
            setLoading(true);
            setError(null);
            const result = await getAllProducts(page, limit);
            console.log('ProductContext loadProducts result:', result);
            
            // Handle the correct API response structure
            const productsData = result.data?.products || result.products || [];
            console.log('Extracted products data:', productsData);
            
            setProducts(productsData);
            setCurrentPage(result.data?.pagination?.currentPage || result.currentPage || page);
            setTotalPages(result.data?.pagination?.totalPages || result.totalPages || 1);
            setTotalProducts(result.data?.pagination?.totalItems || result.totalProducts || 0);
        } catch (err) {
            console.error('Failed to load products:', err);
            setError(err.message);
            // Fallback to empty array
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load products by category
    const loadProductsByCategory = async (categoryId, page = 1, limit = 10) => {
        try {
            setLoading(true);
            setError(null);
            const result = await getProductsByCategory(categoryId, page, limit);
            
            setProducts(result.data?.products || result.products || []);
            setCurrentPage(result.data?.pagination?.currentPage || result.currentPage || page);
            setTotalPages(result.data?.pagination?.totalPages || result.totalPages || 1);
            setTotalProducts(result.data?.pagination?.totalItems || result.totalProducts || 0);
        } catch (err) {
            console.error('Failed to load products by category:', err);
            setError(err.message);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Search products
    const searchProductsHandler = useCallback(async (query, page = 1, limit = 10) => {
        if (!query.trim()) {
            loadProducts(page, limit);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('Searching for:', query);
            const result = await searchProducts(query, page, limit);
            console.log('Search API result:', result);
            
            const products = result.data?.products || result.products || [];
            console.log('Extracted products:', products);
            
            setProducts(products);
            setCurrentPage(result.data?.pagination?.currentPage || result.currentPage || page);
            setTotalPages(result.data?.pagination?.totalPages || result.totalPages || 1);
            setTotalProducts(result.data?.pagination?.totalProducts || result.totalProducts || 0);
        } catch (err) {
            console.error('Failed to search products:', err);
            setError(err.message);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [loadProducts]);

    // Get single product by ID
    const getProduct = async (productId) => {
        try {
            const result = await getProductById(productId);
            return result.data || result.product || null;
        } catch (err) {
            console.error('Failed to get product:', err);
            throw err;
        }
    };

    // Clear products (useful for category switches)
    const clearProducts = useCallback(() => {
        setProducts([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalProducts(0);
        setError(null);
    }, []);

    return (
        <ProductContext.Provider
            value={{
                // State
                products,
                featuredProducts,
                loading,
                error,
                currentPage,
                totalPages,
                totalProducts,
                
                // Actions
                loadProducts,
                loadProductsByCategory,
                searchProducts: searchProductsHandler,
                loadFeaturedProducts,
                getProduct,
                clearProducts,
                
                // Computed values
                hasProducts: products.length > 0,
                hasFeaturedProducts: featuredProducts.length > 0,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

// Hook for easy use
export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

// Export both default + named
export { ProductContext };
export default ProductProvider;