import React, { useState, useEffect } from "react";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import { Search, X } from "lucide-react";

export default function ProductSearch() {
  const { products, loading, error, searchProducts, clearProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  // Debug log to see what products we have
  useEffect(() => {
    console.log('ProductSearch - products:', products);
    console.log('ProductSearch - loading:', loading);
    console.log('ProductSearch - error:', error);
  }, [products, loading, error]);

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log('ProductSearch - Triggering search for:', searchQuery);
        searchProducts(searchQuery);
      } else {
        clearProducts();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchProducts, clearProducts]);

  const clearSearch = () => {
    setSearchQuery("");
    clearProducts();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-gold mb-3">Search Products</h1>
        <p className="text-gray-600">
          Find the perfect piece from our luxury collection
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for rings, necklaces, earrings..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Status */}
      {loading && searchQuery && (
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
          <p className="mt-2 text-gray-600">Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center mb-8 text-red-600">
          <p>Error searching products: {error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && !loading && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {products.length > 0 
              ? `Found ${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`
              : `No results found for "${searchQuery}"`
            }
          </h2>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id || product.id} product={product} />
          ))}
        </div>
      ) : searchQuery && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            Try searching with different keywords or browse our categories
          </p>
          <button
            onClick={clearSearch}
            className="px-6 py-2 bg-gold text-white rounded-lg hover:bg-yellow-600 transition"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Initial State - No Search */}
      {!searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">Start your search</h3>
          <p className="text-gray-500">
            Enter keywords to find products in our luxury collection
          </p>
        </div>
      )}
    </div>
  );
}