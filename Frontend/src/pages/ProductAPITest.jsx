import React, { useState, useEffect } from "react";
import { getAllProducts, getProductById, searchProducts } from "../utils/productAPI";

export default function ProductAPITest() {
  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [singleProduct, setSingleProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test 1: Get all products
  const testGetAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllProducts(1, 10);
      console.log('All Products Result:', result);
      setProducts(result.data?.products || []);
    } catch (err) {
      console.error('Error getting products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Get single product
  const testGetSingleProduct = async (productId = 3) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProductById(productId);
      console.log('Single Product Result:', result);
      setSingleProduct(result.data || result.product || result);
    } catch (err) {
      console.error('Error getting single product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Search products
  const testSearchProducts = async (query = "ring") => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchProducts(query);
      console.log('Search Results:', result);
      setSearchResults(result.data?.products || []);
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run first test on mount
  useEffect(() => {
    testGetAllProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">Product API Test Page</h1>
      
      {/* Status */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">🔄 Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Test Buttons */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <button 
          onClick={testGetAllProducts}
          className="bg-gold text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition"
        >
          Test: Get All Products
        </button>
        <button 
          onClick={() => testGetSingleProduct(3)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Test: Get Product #3
        </button>
        <button 
          onClick={() => testSearchProducts("ring")}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
        >
          Test: Search "ring"
        </button>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* All Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Products ({products.length})</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {products.map(product => (
              <div key={product.product_id} className="border-b border-gray-200 pb-2 mb-2">
                <h3 className="font-medium">{product.productname}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
                <p className="text-xs text-gray-500">ID: {product.product_id}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Single Product */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Single Product</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {singleProduct ? (
              <div>
                <h3 className="font-medium">{singleProduct.productname}</h3>
                <p className="text-sm text-gray-600">{singleProduct.description}</p>
                <p className="text-xs text-gray-500">ID: {singleProduct.product_id}</p>
                <p className="text-xs text-gray-500">Featured: {singleProduct.is_featured ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p className="text-gray-500">No product loaded</p>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {searchResults.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {searchResults.map(product => (
                  <div key={product.product_id} className="border border-gray-200 rounded p-3">
                    <h3 className="font-medium">{product.productname}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No search results</p>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">How to Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700">
          <li>Click "Get All Products" to load products from backend</li>
          <li>Click "Get Product #3" to load a specific product</li>
          <li>Click "Search 'ring'" to test search functionality</li>
          <li>Check browser console (F12) for detailed API responses</li>
          <li>Verify that data matches what's in your database</li>
        </ol>
      </div>
    </div>
  );
}