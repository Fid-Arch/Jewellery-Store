import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext"; // ✅ Import context hook

const dummyOrders = [
  {
    id: "1001",
    product: "Gold Ring",
    total: "$1,200",
    status: "Delivered",
    date: "2025-07-15",
  },
  {
    id: "1002",
    product: "Diamond Necklace",
    total: "$3,400",
    status: "Processing",
    date: "2025-08-10",
  },
  {
    id: "1003",
    product: "Luxury Watch",
    total: "$5,800",
    status: "Shipped",
    date: "2025-09-01",
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, wishlist } = useStore(); // ✅ Destructure user (and wishlist for dynamic count)

  // ✅ Helper to format member since (assumes user.createdAt; adjust if different)
  const getMemberSince = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).getFullYear(); // e.g., "2025"
    }
    return "Recent"; // Fallback if no date
  };

  // ✅ Fallback if no user (shouldn't happen due to route guard)
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-red-500">Please log in to view your profile.</p>
        <button
          onClick={() => navigate("/login")}
          className="btn-primary mt-4"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-yellow-600">My Profile</h1>
      </div>

      {/* Account Info - Dynamic from user */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-400/40 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Account Details
        </h2>
        <p className="text-gray-600">
          Name: {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || "N/A"}
        </p>
        <p className="text-gray-600">
          Email: {user.email || "N/A"}
        </p>
        <p className="text-gray-600">
          Member since: {getMemberSince()}
        </p>
      </div>

      {/* Orders - Still dummy;*/}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Orders</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2">Order ID</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {dummyOrders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-gray-100 hover:bg-yellow-50"
              >
                <td>{o.id}</td>
                <td>{o.product}</td>
                <td>{o.total}</td>
                <td className="font-semibold text-yellow-600">{o.status}</td>
                <td>{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wishlist Summary - Dynamic from context */}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Wishlist</h2>
        <p className="text-gray-600">
          You have <b>{wishlist.length}</b> items saved for later. {/* ✅ Dynamic count from context */}
          {wishlist.length > 0 && (
            <button
              onClick={() => navigate("/wishlist")}
              className="ml-2 text-yellow-600 hover:underline"
            >
              View Wishlist
            </button>
          )}
        </p>
      </div>
    </div>
  );
}