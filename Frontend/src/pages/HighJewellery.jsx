import React from "react";
import products from "../data/products.json";
import ProductCard from "../components/ProductCard";

export default function HighJewellery() {
  const premium = products.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-3">High Jewellery</h1>
      <p className="text-gray-600 mb-8">
        Masterpieces crafted by our artisans — limited, rare, and extraordinary.
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {premium.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
