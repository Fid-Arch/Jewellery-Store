import React from "react";
import { useStore } from "../../context/StoreContext";
import ProductCard from "../../components/ProductCard";

export default function Wishlist() {
  const { wishlist } = useStore();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <p className="text-gray-600 text-center py-20">No saved items yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {wishlist.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
