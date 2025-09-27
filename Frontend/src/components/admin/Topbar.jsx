import React, { useState, useContext } from "react";
import { Bell, User, LogOut, Moon, Sun } from "lucide-react";
import { StoreContext } from "../../context/StoreContext";

function Topbar() {
  const { user, logout } = useContext(StoreContext);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="flex justify-between items-center bg-white/80 backdrop-blur px-6 py-4 shadow-sm border-b border-yellow-100 sticky top-0 z-40">
      {/* Left */}
      <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Welcome, {user?.role.toLowerCase() === "admin" ? "Admin" : "Staff"}
      </h2>

      {/* Right */}
      <div className="flex items-center gap-6 relative">
        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} className="hover:text-yellow-600">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative hover:text-yellow-600"
          >
            <Bell size={22} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              3
            </span>
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl border p-3">
              <h3 className="font-semibold text-gray-700 mb-2">
                Notifications
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="p-2 hover:bg-yellow-50 rounded">
                  New order placed
                </li>
                <li className="p-2 hover:bg-yellow-50 rounded">
                  Stock running low
                </li>
                <li className="p-2 hover:bg-yellow-50 rounded">
                  Customer review pending
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 hover:text-yellow-600"
          >
            <User size={22} />
            <span className="hidden sm:inline font-medium">
              {user?.name || "User"}
            </span>
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-xl border p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">
                  {user?.name || "User"}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user?.role.toLowerCase() === "admin"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-blue-200 text-blue-800"
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-red-600 hover:underline w-full"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
