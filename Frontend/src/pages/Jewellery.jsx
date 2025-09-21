import React from "react";
import { Link } from "react-router-dom";

export default function Jewellery() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-serif text-gold mb-10 text-center">
        Our Jewellery
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        <Link
          to="/fine-jewellery"
          className="bg-white rounded-xl shadow hover:shadow-lg transition group overflow-hidden"
        >
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1520962922320-2038eebab146?q=80&w=1200&auto=format&fit=crop"
            alt="Fine Jewellery"
          />
          <div className="p-5">
            <h3 className="font-serif text-xl text-gray-800">Fine Jewellery</h3>
            <p className="text-gray-600">
              Everyday elegance, crafted with care.
            </p>
          </div>
        </Link>
        <Link
          to="/luxury-collections"
          className="bg-white rounded-xl shadow hover:shadow-lg transition group overflow-hidden"
        >
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1617038260897-43e95f1d30bb?q=80&w=1200&auto=format&fit=crop"
            alt="Luxury Collections"
          />
          <div className="p-5">
            <h3 className="font-serif text-xl text-gray-800">
              Luxury Collections
            </h3>
            <p className="text-gray-600">Statement pieces for refined taste.</p>
          </div>
        </Link>
        <Link
          to="/gifts"
          className="bg-white rounded-xl shadow hover:shadow-lg transition group overflow-hidden"
        >
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1622445275649-0f5b4fc66b37?q=80&w=1200&auto=format&fit=crop"
            alt="Gifts"
          />
          <div className="p-5">
            <h3 className="font-serif text-xl text-gray-800">Gifts</h3>
            <p className="text-gray-600">
              Curated collections for every moment.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
