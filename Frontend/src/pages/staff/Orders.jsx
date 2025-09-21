import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout"; // ✅ reuses luxury layout
import { CheckCircle, XCircle, Clock } from "lucide-react";

// Sample data
const initialOrders = [
  {
    id: "#2001",
    product: "Diamond Necklace",
    customer: "Alice Johnson",
    status: "Processing",
  },
  {
    id: "#2002",
    product: "Gold Ring",
    customer: "Michael Lee",
    status: "Pending",
  },
  {
    id: "#2003",
    product: "Luxury Watch",
    customer: "Sarah Kim",
    status: "Delivered",
  },
];

const statusColors = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
};

function StaffOrders() {
  const [orders, setOrders] = useState(initialOrders);

  const updateOrderStatus = (id, newStatus) => {
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Staff Orders
      </h1>

      <div className="bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🛒 Assigned Orders
        </h2>

        <table className="w-full text-left border-collapse">
          <thead className="bg-yellow-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Order ID
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Product
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Customer
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-yellow-50 transition">
                <td className="px-6 py-4">{order.id}</td>
                <td className="px-6 py-4">{order.product}</td>
                <td className="px-6 py-4">{order.customer}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button
                    onClick={() => updateOrderStatus(order.id, "Delivered")}
                    className="text-green-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle size={16} /> Deliver
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, "Processing")}
                    className="text-yellow-600 hover:underline flex items-center gap-1"
                  >
                    <Clock size={16} /> Process
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, "Cancelled")}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <XCircle size={16} /> Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default StaffOrders;
