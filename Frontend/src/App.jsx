import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { StoreContext } from "./context/StoreContext";

// Components & Pages
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import CustomerLogin from "./pages/customer/Login";
import CustomerRegister from "./pages/customer/Register";
import AdminLogin from "./pages/admin/Login";
import AdminRegister from "./pages/admin/Register";
import ExclusiveShowcase from "./pages/ExclusiveShowcase";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Wishlist from "./pages/customer/Wishlist";
import Profile from "./pages/customer/Profile";
import OrderTracking from "./pages/customer/OrderTracking";
import Jewellery from "./pages/Jewellery";
import HighJewellery from "./pages/HighJewellery";
import FineJewellery from "./pages/FineJewellery";
import LuxuryCollections from "./pages/LuxuryCollections";
import Accessories from "./pages/Accessories";
import Gifts from "./pages/Gifts";
import ProductDetail from "./pages/ProductDetail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// Staff pages
import StaffOrders from "./pages/staff/Orders";
import StaffReviews from "./pages/staff/Reviews";

// CMS pages
import AboutUs from "./pages/cms/AboutUs";
import FAQ from "./pages/cms/FAQ";
import Policies from "./pages/cms/Policies";
import Contact from "./pages/cms/Contact";

function App() {
  const { user } = useContext(StoreContext);

  // Handle role-based redirect after login
  const getRedirectPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "staff") return "/staff/orders";
    return "/";
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={user ? <Navigate to={getRedirectPath()} /> : <CustomerLogin />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <CustomerRegister />}
        />
        <Route
          path="/admin/login"
          element={user ? <Navigate to={getRedirectPath()} /> : <AdminLogin />}
        />
        <Route
          path="/admin/register"
          element={user ? <Navigate to="/" /> : <AdminRegister />}
        />

        {/* Customer routes */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<OrderTracking />} />

        {/* Product routes */}
        <Route path="/jewellery" element={<Jewellery />} />
        <Route path="/high-jewellery" element={<HighJewellery />} />
        <Route path="/fine-jewellery" element={<FineJewellery />} />
        <Route path="/luxury-collections" element={<LuxuryCollections />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Luxury Exclusive Page */}
        <Route path="/exclusive" element={<ExclusiveShowcase />} />

        {/* CMS pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/contact" element={<Contact />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            user?.role === "ADMIN" ? <AdminDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/admin/products"
          element={user?.role === "ADMIN" ? <Products /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/orders"
          element={user?.role === "ADMIN" ? <Orders /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/users"
          element={user?.role === "ADMIN" ? <Users /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/reports"
          element={user?.role === "ADMIN" ? <Reports /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/settings"
          element={user?.role === "ADMIN" ? <Settings /> : <Navigate to="/" />}
        />

        {/* Staff routes */}
        <Route
          path="/staff/orders"
          element={
            user?.role === "staff" ? <StaffOrders /> : <Navigate to="/" />
          }
        />
        <Route
          path="/staff/reviews"
          element={
            user?.role === "staff" ? <StaffReviews /> : <Navigate to="/" />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
