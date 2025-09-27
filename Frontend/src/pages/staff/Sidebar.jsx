import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  MessageSquare,
} from "lucide-react";
import { StoreContext } from "../../context/StoreContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all duration-300 
   hover:bg-yellow-100 hover:text-yellow-700 ${
     isActive ? "bg-yellow-200 text-yellow-800" : "text-gray-700"
   }`;

function Sidebar() {
  const { user } = useContext(StoreContext);

  return (
    <aside className="w-64 bg-gradient-to-b from-yellow-50 to-white shadow-xl border-r border-yellow-200 fixed top-0 bottom-0 left-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-yellow-200">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Goldmarks {user?.role === "staff" ? "Staff" : "Admin"}
        </h1>
      </div>

      {/* Links */}
      <nav className="p-4 flex flex-col gap-2">
        {user?.role === "ADMIN" ? (
          <>
            <NavLink to="/admin" end className={linkClass}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
            <NavLink to="/admin/products" className={linkClass}>
              <Package size={20} /> Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkClass}>
              <ShoppingCart size={20} /> Orders
            </NavLink>
            <NavLink to="/admin/users" className={linkClass}>
              <Users size={20} /> Users
            </NavLink>
            <NavLink to="/admin/reports" className={linkClass}>
              <BarChart2 size={20} /> Reports
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              <Settings size={20} /> Settings
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/staff/orders" className={linkClass}>
              <ShoppingCart size={20} /> Orders
            </NavLink>
            <NavLink to="/staff/reviews" className={linkClass}>
              <MessageSquare size={20} /> Reviews
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
