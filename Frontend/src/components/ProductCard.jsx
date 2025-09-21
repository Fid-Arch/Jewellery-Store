import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function ProductCard({ product }) {
  const { addToCart, addToWishlist } = useStore();

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition group overflow-hidden">
      {/* Product Image + Badges + Shine */}
      <div
        className={`overflow-hidden relative ${
          product.premium ? "premium-shine" : ""
        }`}
      >
        {/* Premium Badge (Gold, Left) */}
        {product.premium && (
          <span className="badge-premium absolute top-3 left-3">
            ✨ Exclusive
          </span>
        )}

        {/* New Arrival Badge (Silver, Right) */}
        {product.new && (
          <span className="badge-new absolute top-3 right-3">🆕 New</span>
        )}

        {/* Product Image */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-lg text-gray-800">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4">${product.price}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/product/${product.id}`}
            className="bg-gold text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
          >
            View
          </Link>
          <button
            onClick={() => addToCart(product, 1)}
            className="flex items-center gap-1 px-3 py-2 border border-gold rounded-md hover:bg-gold hover:text-white transition"
          >
            <ShoppingCart className="h-5 w-5" /> Add
          </button>
          <button
            onClick={() => addToWishlist(product)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gold hover:text-white transition"
          >
            <Heart className="h-5 w-5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
