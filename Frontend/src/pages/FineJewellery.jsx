import React, { useMemo, useState } from "react";
import products from "../data/products.json";
import ProductCard from "../components/ProductCard";
import CategoryFilter from "../components/CategoryFilter";

export default function FineJewellery() {
  const cats = ["Rings", "Necklaces", "Pendants"];
  const [active, setActive] = useState("All");
  const list = useMemo(
    () => products.filter((p) => cats.includes(p.category)),
    []
  );
  const filtered =
    active === "All" ? list : list.filter((p) => p.category === active);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-3">Fine Jewellery</h1>
      <p className="text-gray-600 mb-8">
        Rings, necklaces, and pendants — crafted for everyday elegance.
      </p>
      <CategoryFilter categories={cats} active={active} onChange={setActive} />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
