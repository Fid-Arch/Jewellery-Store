import React, { useState, useEffect } from "react";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";

export default function FineJewellery() {
  const { products, loading, error, loadProducts, searchProducts } = useProducts();
  const cats = ["Rings", "Necklaces", "Pendants"];
  const [active, setActive] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Load products on component mount
  useEffect(() => {
    loadProducts(1, 50); // Load first 50 products
  }, [loadProducts]);

  // Filter products based on category and search
  useEffect(() => {
    if (!products.length) return;

    let filtered = products.filter((p) => {
      // First filter by fine jewellery categories
      const isFineJewellery = cats.includes(p.category_name || p.category);
      
      if (!isFineJewellery) return false;
      
      // Then filter by active category
      if (active === "All") return true;
      return (p.category_name || p.category) === active;
    });

    setFilteredProducts(filtered);
  }, [products, active, cats]);

  const handleCategoryChange = (category) => {
    setActive(category);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <p className="mt-2 text-gray-600">Loading fine jewellery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center text-red-600">
          <p>Error loading products: {error}</p>
          <button 
            onClick={() => loadProducts(1, 50)}
            className="mt-4 px-4 py-2 bg-gold text-white rounded hover:bg-yellow-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-3">Fine Jewellery</h1>
      <p className="text-gray-600 mb-8">
        Rings, necklaces, and pendants — crafted for everyday elegance.
      </p>
      <CategoryFilter 
        categories={cats} 
        active={active} 
        onChange={handleCategoryChange} 
      />
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No fine jewellery products found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredProducts.map((p) => (
            <ProductCard key={p.product_id || p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
