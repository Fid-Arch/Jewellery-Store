import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Heart, LogOut } from "lucide-react";
import { useStore } from "../context/StoreContext";
import LuxuryButton from "./LuxuryButton";

function Navbar() {
  const { cartCount, wishlistCount, user, logoutUser } = useStore();
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    "relative group hover:text-gold-400 transition " +
    (isActive ? "text-gold-400" : "");

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <nav className="bg-white/95 backdrop-blur shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent animate-pulse"
        >
          Goldmarks
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex space-x-8 items-center font-medium text-gray-700">
          <NavLink to="/" className={linkCls}>
            Home
          </NavLink>
          <NavLink to="/high-jewellery" className={linkCls}>
            High Jewellery
          </NavLink>
          <NavLink to="/jewellery" className={linkCls}>
            Jewellery
          </NavLink>
          <NavLink to="/accessories" className={linkCls}>
            Accessories
          </NavLink>
          <NavLink to="/gifts" className={linkCls}>
            Gifts
          </NavLink>
          <div className="relative group">
            <button className="hover:text-gold-400">Catalogue ▾</button>
            <div className="absolute hidden group-hover:block bg-white text-gray-700 mt-2 rounded shadow-lg w-56">
              <NavLink
                to="/fine-jewellery"
                className="block px-4 py-2 hover:bg-gold-400 hover:text-black"
              >
                Fine Jewellery
              </NavLink>
              <NavLink
                to="/luxury-collections"
                className="block px-4 py-2 hover:bg-gold-400 hover:text-black"
              >
                Luxury Collections
              </NavLink>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <NavLink to="/wishlist" className="relative hover:text-gold-400">
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span className="badge absolute -top-2 -right-2">
                {wishlistCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/cart" className="relative hover:text-gold-400">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="badge absolute -top-2 -right-2">
                {cartCount}
              </span>
            )}
          </NavLink>

          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {user.role.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-500 hover:text-red-700"
              >
                <LogOut className="h-6 w-6 mr-1" /> Logout
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="hover:text-gold-400 flex items-center"
            >
              <User className="h-6 w-6 mr-1" /> Login
            </NavLink>
          )}

          {/* Luxury CTA Button */}
          <LuxuryButton
            to="/luxury-collections"
            className="hidden sm:inline-block"
          >
            ✨ Exclusive Collections
          </LuxuryButton>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
