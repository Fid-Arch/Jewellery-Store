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
import AdminRegister from "./pages/admin/Register";
import StaffRegister from "./pages/staff/Register";
import ExclusiveShowcase from "./pages/ExclusiveShowcase";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Wishlist from "./pages/customer/Wishlist";
import Profile from "./pages/customer/Profile";
import OrderTracking from "./pages/customer/OrderTracking";
import AddressManagement from "./pages/customer/AddressManagement";
import Jewellery from "./pages/Jewellery";
import HighJewellery from "./pages/HighJewellery";
import FineJewellery from "./pages/FineJewellery";
import LuxuryCollections from "./pages/LuxuryCollections";
import Accessories from "./pages/Accessories";
import Gifts from "./pages/Gifts";
import ProductDetail from "./pages/ProductDetail";
import ProductSearch from "./pages/ProductSearch";
import ProductAPITest from "./pages/ProductAPITest";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Promotions from "./pages/admin/Promotions";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import HelpSupport from "./pages/admin/HelpSupport";
import PromotionalEvents from "./pages/admin/PromotionalEvents";

// Staff pages
import StaffOrders from "./pages/staff/Orders";
import StaffReviews from "./pages/staff/Reviews";

// CMS pages
import AboutUs from "./pages/cms/AboutUs";
import FAQ from "./pages/cms/FAQ";
import Policies from "./pages/cms/Policies";
import Contact from "./pages/cms/Contact";

function App() {
  const { user, isLoading } = useContext(StoreContext);

  // Handle role-based redirect after login
  const getRedirectPath = () => {
    if (!user) return "/";
    if (user.role.toLowerCase() === "admin") return "/admin";
    if (user.role.toLowerCase() === "staff") return "/staff/orders";
    return "/";
  };

  // ✅ Show loader while hydrating
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
          path="/admin/register"
          element={user ? <Navigate to="/" /> : <AdminRegister />}
        />
        <Route
          path="/staff/register"
          element={user ? <Navigate to="/" /> : <StaffRegister />}
        />

        {/* Customer routes - Cart accessible to guests and customers */}
        <Route path="/cart" element={<Cart />} />
        
        {/* Customer-only routes (require login) */}
        <Route path="/checkout" element={
          user?.role.toLowerCase() === "customer" ? <Checkout /> : <Navigate to="/login" />} />
        <Route path="/wishlist" element={
          user?.role.toLowerCase() === "customer" ? <Wishlist /> : <Navigate to="/login" />} />
        <Route path="/profile" element={
          user?.role.toLowerCase() === "customer" ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/orders" element={
          user?.role.toLowerCase() === "customer" ? <OrderTracking /> : <Navigate to="/login" />} />
        <Route path="/addresses" element={
          user?.role.toLowerCase() === "customer" ? <AddressManagement /> : <Navigate to="/login" />} />

        {/* Product routes */}
        <Route path="/jewellery" element={<Jewellery />} />
        <Route path="/high-jewellery" element={<HighJewellery />} />
        <Route path="/fine-jewellery" element={<FineJewellery />} />
        <Route path="/luxury-collections" element={<LuxuryCollections />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/search" element={<ProductSearch />} />
        <Route path="/test-products" element={<ProductAPITest />} />
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
            user?.role.toLowerCase() === "admin" ? <AdminDashboard /> : <Navigate to="/" />
          }
        />
        <Route
          path="/admin/products"
          element={user?.role.toLowerCase() === "admin" ? <Products /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/orders"
          element={user?.role.toLowerCase() === "admin" ? <Orders /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/users"
          element={user?.role.toLowerCase() === "admin" ? <Users /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/promotions"
          element={user?.role.toLowerCase() === "admin" ? <Promotions /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/reports"
          element={user?.role.toLowerCase() === "admin" ? <Reports /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/settings"
          element={user?.role.toLowerCase() === "admin" ? <Settings /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/help-support"
          element={user?.role.toLowerCase() === "admin" ? <HelpSupport /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/promotional-events"
          element={
            user?.role?.toLowerCase() === "admin" || user?.roles_id === 1 ? 
            <PromotionalEvents /> : 
            <div className="p-6">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
              <p className="text-sm text-gray-500">Current user role: {user?.role || user?.roles_id || 'Not logged in'}</p>
              <button 
                onClick={() => window.history.back()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          }
        />

        {/* Staff routes */}
        <Route
          path="/staff/orders"
          element={
            user?.role.toLowerCase() === "staff" ? <StaffOrders /> : <Navigate to="/" />
          }
        />
        <Route
          path="/staff/reviews"
          element={
            user?.role.toLowerCase() === "staff" ? <StaffReviews /> : <Navigate to="/" />
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
