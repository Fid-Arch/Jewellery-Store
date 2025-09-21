import React from "react";

export default function Policies() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-8 text-center">
        Our Policies
      </h1>

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gold/30">
          <h2 className="text-xl font-serif text-gold mb-3">Returns</h2>
          <p className="text-gray-700">
            Items may be returned within 30 days of purchase, in original
            packaging, unworn and accompanied by proof of purchase.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gold/30">
          <h2 className="text-xl font-serif text-gold mb-3">Warranty</h2>
          <p className="text-gray-700">
            Goldmarks offers a 2-year warranty against manufacturing defects on
            all jewellery items.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gold/30">
          <h2 className="text-xl font-serif text-gold mb-3">Privacy</h2>
          <p className="text-gray-700">
            We respect your privacy and comply with the Australian Privacy Act
            and APPs. Your personal information is always secure and never
            shared without consent.
          </p>
        </div>
      </div>
    </div>
  );
}
