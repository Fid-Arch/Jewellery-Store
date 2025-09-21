import React from "react";
import ProductCard from "../components/ProductCard";
import products from "../data/products.json";

export default function ExclusiveShowcase() {
  // Only premium products (flagged in products.json with "premium": true)
  const premiumProducts = products.filter((p) => p.premium);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Luxury Banner */}
      <div className="bg-gradient-to-r from-yellow-200 to-yellow-400 text-center py-16 rounded-2xl shadow-lg mb-12">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">
          ✨ Exclusive Showcase
        </h1>
        <p className="text-lg text-gray-800">
          Discover our most prestigious and timeless pieces, crafted for true
          connoisseurs of luxury.
        </p>
      </div>

      {/* Products */}
      {premiumProducts.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {premiumProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">
          No exclusive products available right now. Please check back later.
        </p>
      )}
    </div>
  );
}
