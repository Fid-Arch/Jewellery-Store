import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-white to-yellow-50 text-gray-700 border-t border-gold/20 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-gold-600 font-serif font-semibold mb-3">
            Goldmarks
          </h3>
          <p className="text-sm text-gray-600">
            Redefining timeless luxury with craftsmanship and care.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gold-500">Explore</h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/high-jewellery"
                className="hover:underline hover:text-gold-600"
              >
                High Jewellery
              </Link>
            </li>
            <li>
              <Link
                to="/jewellery"
                className="hover:underline hover:text-gold-600"
              >
                Jewellery
              </Link>
            </li>
            <li>
              <Link
                to="/accessories"
                className="hover:underline hover:text-gold-600"
              >
                Accessories
              </Link>
            </li>
            <li>
              <Link to="/gifts" className="hover:underline hover:text-gold-600">
                Gifts
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gold-500">Support</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="hover:underline hover:text-gold-600">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:underline hover:text-gold-600">
                FAQ
              </Link>
            </li>
            <li>
              <Link
                to="/policies"
                className="hover:underline hover:text-gold-600"
              >
                Policies
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:underline hover:text-gold-600"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gold-500">Stay Connected</h4>
          <p className="text-gray-600 mb-3">
            Follow us on social media for new launches & offers.
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 py-4 border-t border-gold/10">
        © {new Date().getFullYear()} Goldmarks Jewellery. All rights reserved.
      </p>
    </footer>
  );
}
