import React from "react";
import products from "../data/products.json";
import ProductCard from "../components/ProductCard";

export default function Accessories() {
  const items = products.filter((p) =>
    ["Watches", "Bracelets"].includes(p.category)
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-3">Accessories</h1>
      <p className="text-gray-600 mb-8">
        Complete your look with iconic watches and bracelets from Goldmarks.
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
