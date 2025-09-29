import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Heart, LogOut, MapPin, UserCog } from "lucide-react";
import { useStore } from "../context/StoreContext";
import LuxuryButton from "./LuxuryButton";

function Navbar() {
  const { cartCount, wishlistCount, user, logout } = useStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const linkCls = ({ isActive }) =>
    "relative group hover:text-gold-400 transition " +
    (isActive ? "text-gold-400" : "");

  const handleLogout = () => {
    logout();
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
            <div className="relative group" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 hover:text-gold-400 focus:outline-none"
              >
                <User className="h-6 w-6" />
                <span className="text-sm text-gray-700">
                  {user.first_name || user.role.toUpperCase()}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user.role.toUpperCase()} Account
                    </div>
                    
                    {user.role === 'customer' && (
                      <>
                        <NavLink
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gold-50 hover:text-gold-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Profile
                        </NavLink>
                        <NavLink
                          to="/addresses"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gold-50 hover:text-gold-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Address Book
                        </NavLink>
                      </>
                    )}
                    
                    {user.role === 'admin' && (
                      <NavLink
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gold-50 hover:text-gold-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </NavLink>
                    )}
                    
                    {user.role === 'staff' && (
                      <NavLink
                        to="/staff"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gold-50 hover:text-gold-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Staff Dashboard
                      </NavLink>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
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
