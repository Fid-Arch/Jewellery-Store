import React, { useState } from "react";
import products from "../data/products.json";
import ProductCard from "../components/ProductCard";

export default function Gifts() {
  const [range, setRange] = useState("All");
  const ranges = {
    "Under $1200": (p) => p.price < 1200,
    "$1200 - $2000": (p) => p.price >= 1200 && p.price <= 2000,
    "Over $2000": (p) => p.price > 2000,
  };

  const list = products.filter((p) =>
    [
      "Rings",
      "Necklaces",
      "Pendants",
      "Earrings",
      "Bracelets",
      "Watches",
    ].includes(p.category)
  );
  const filtered = range === "All" ? list : list.filter(ranges[range]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-3">Gifts</h1>
      <p className="text-gray-600 mb-8">
        Celebrate life’s moments with timeless Goldmarks gifts.
      </p>
      <div className="flex gap-3 mb-8 flex-wrap">
        {["All", "Under $1200", "$1200 - $2000", "Over $2000"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-full border transition ${
              range === r
                ? "bg-yellow-500 text-black border-yellow-500"
                : "bg-white border-gray-300 text-gray-700 hover:bg-yellow-500 hover:text-black"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
