import React from "react";

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-8 text-center">
        Contact Us
      </h1>
      <p className="text-center text-gray-700 mb-10">
        Our team is here to assist you with any inquiries. Please fill out the
        form or reach us directly.
      </p>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30 mb-10 text-center">
        <p className="text-gray-700 mb-2">
          <strong>Email:</strong> support@goldmarks.com
        </p>
        <p className="text-gray-700 mb-2">
          <strong>Phone:</strong> +61 2 1234 5678
        </p>
        <p className="text-gray-700">
          <strong>Store:</strong> 123 Luxury Lane, Sydney, Australia
        </p>
      </div>

      {/* Form */}
      <form className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gold/30">
        <input
          type="text"
          placeholder="Full Name"
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        />
        <textarea
          placeholder="Your Message"
          rows="4"
          className="w-full border px-3 py-3 rounded-md focus:ring-2 focus:ring-gold outline-none"
        ></textarea>
        <button className="bg-gold text-white w-full px-6 py-3 rounded-md font-semibold hover:bg-yellow-600 transition">
          Send Message
        </button>
      </form>
    </div>
  );
}
