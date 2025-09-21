import React from "react";
import HeroSlider from "../components/HeroSlider";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <HeroSlider />
      {/* Welcome */}
      <section className="text-center py-16 bg-gradient-to-r from-yellow-50 to-white">
        <h2 className="text-4xl font-serif font-bold text-gold-500 mb-4 animate-pulse">
          Welcome to Goldmarks
        </h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Where timeless craftsmanship meets modern luxury. Discover our curated
          collections designed to celebrate life’s most precious moments.
        </p>
      </section>

      {/* Collections */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        <Link to="/high-jewellery" className="card group">
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?q=80&w=1200"
            alt="High Jewellery"
          />
          <div className="p-4">
            <h3 className="font-serif font-semibold text-lg text-gold-600">
              High Jewellery
            </h3>
            <p className="text-gray-600">
              Exquisite masterpieces for life’s grandest moments.
            </p>
          </div>
        </Link>
        <Link to="/fine-jewellery" className="card group">
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1604467754076-0f5c0c04c2f3?q=80&w=1200"
            alt="Fine Jewellery"
          />
          <div className="p-4">
            <h3 className="font-serif font-semibold text-lg text-gold-600">
              Fine Jewellery
            </h3>
            <p className="text-gray-600">
              Everyday elegance in precious metals and stones.
            </p>
          </div>
        </Link>
        <Link to="/luxury-collections" className="card group">
          <img
            className="h-72 w-full object-cover group-hover:scale-105 transition"
            src="https://images.unsplash.com/photo-1622445275649-0f5b4fc66b37?q=80&w=1200"
            alt="Luxury Collections"
          />
          <div className="p-4">
            <h3 className="font-serif font-semibold text-lg text-gold-600">
              Luxury Collections
            </h3>
            <p className="text-gray-600">
              Bracelets, earrings, and timepieces to treasure.
            </p>
          </div>
        </Link>
      </section>

      {/* Trust CTA */}
      <section className="bg-gradient-to-r from-yellow-100 to-yellow-200 py-16 text-center">
        <h2 className="text-3xl font-serif font-bold mb-4 text-gray-900">
          Confidence in Every Purchase 💍
        </h2>
        <p className="mb-6 text-gray-700 max-w-xl mx-auto">
          Certified gemstones, lifetime service guarantee, and luxury packaging
          with every order. Shop with confidence knowing your treasures last a
          lifetime.
        </p>
        <Link to="/policies" className="btn-primary">
          Learn More
        </Link>
      </section>
    </div>
  );
}
