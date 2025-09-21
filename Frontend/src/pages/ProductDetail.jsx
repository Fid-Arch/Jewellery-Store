import React from "react";
import { useParams } from "react-router-dom";
import products from "../data/products.json";
import { useStore } from "../context/StoreContext";

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find((p) => p.id === Number(id));
  const { addToCart, addToWishlist } = useStore();

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">Product not found.</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
      {/* Product Image */}
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-[26rem] object-cover rounded-xl shadow-lg border border-gold/20"
      />

      {/* Product Details */}
      <div>
        <h1 className="text-3xl font-serif font-bold mb-3 text-gray-900">
          {product.name}
        </h1>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <p className="text-2xl font-semibold text-gold-600 mb-6">
          ${product.price}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {/* Add to Cart */}
          <button
            onClick={() => addToCart(product, 1)}
            className="btn-primary flex-1 text-center"
          >
            Add to Cart
          </button>

          {/* Save to Wishlist */}
          <button
            onClick={() => addToWishlist(product)}
            className="flex-1 px-6 py-2 border-2 border-gold-500 text-gold-600 font-semibold rounded-lg shadow-sm hover:bg-gold-500 hover:text-black transition"
          >
            Save to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
