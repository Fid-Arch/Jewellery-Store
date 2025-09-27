import React from "react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-yellow-600">My Profile</h1>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-400/40 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Account Details
        </h2>
        <p className="text-gray-600">Name: Bipesh Lama</p>
        <p className="text-gray-600">Email: customer@goldmarks.com</p>
        <p className="text-gray-600">Member since: 2022</p>
      </div>

      {/* Orders */}
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

      {/* Wishlist Summary */}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Wishlist</h2>
        <p className="text-gray-600">
          You have <b>5 items</b> saved for later.
        </p>
      </div>
    </div>
  );
}
