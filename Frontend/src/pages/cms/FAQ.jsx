import React, { useState } from "react";

export default function FAQ() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: "What is Goldmarks’ return policy?",
      a: "We accept returns within 30 days of purchase with proof of receipt, provided the item is unworn and in its original packaging.",
    },
    {
      q: "Do you provide international shipping?",
      a: "Yes, Goldmarks offers insured worldwide shipping with premium courier services for your peace of mind.",
    },
    {
      q: "Can I book a virtual appointment?",
      a: "Absolutely. Our specialists are available for private in-store and virtual consultations.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-10 text-center">
        Frequently Asked Questions
      </h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md border border-gold/30"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center"
            >
              <span>{faq.q}</span>
              <span className="text-gold">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="px-6 pb-4 text-gray-600">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
