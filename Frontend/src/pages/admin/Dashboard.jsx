import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout";
import StatsCard from "../../components/admin/StatsCard";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- Fake Data (replace with API later) ---
const salesData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3200 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 4700 },
  { month: "May", sales: 6200 },
  { month: "Jun", sales: 5400 },
];

const categoryData = [
  { name: "High Jewellery", value: 35 },
  { name: "Fine Jewellery", value: 25 },
  { name: "Accessories", value: 20 },
  { name: "Gifts", value: 20 },
];

const orders = [
  {
    id: "#1001",
    customer: "Alice Johnson",
    total: "$2,450",
    status: "Delivered",
  },
  { id: "#1002", customer: "Michael Lee", total: "$980", status: "Processing" },
  { id: "#1003", customer: "Sarah Kim", total: "$1,720", status: "Pending" },
];

// Status colors
const statusColors = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-red-100 text-red-700",
};

function Dashboard() {
  const [openOrder, setOpenOrder] = useState(null);

  return (
    <AdminLayout>
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Revenue"
          value="$124,500"
          icon={DollarSign}
          color="from-yellow-500 to-yellow-700"
        />
        <StatsCard
          title="Orders"
          value="1,230"
          icon={ShoppingBag}
          color="from-pink-500 to-pink-700"
        />
        <StatsCard
          title="Customers"
          value="540"
          icon={Users}
          color="from-green-500 to-green-700"
        />
        <StatsCard
          title="Growth"
          value="+12.5%"
          icon={TrendingUp}
          color="from-blue-500 to-blue-700"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📈 Sales Overview
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#eab308"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            💎 Category Share
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#eab308"
                dataKey="value"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      ["#facc15", "#f59e0b", "#d97706", "#b45309"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🛒 Recent Orders
        </h2>
        <table className="w-full text-left border-collapse">
          <thead className="bg-yellow-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Order ID
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Customer
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Total
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
                <td className="px-6 py-4">{order.customer}</td>
                <td className="px-6 py-4">{order.total}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setOpenOrder(order)}
                    className="text-yellow-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Order Details */}
      <Modal
        isOpen={!!openOrder}
        onClose={() => setOpenOrder(null)}
        title="Order Details"
      >
        {openOrder && (
          <div>
            <p>
              <strong>ID:</strong> {openOrder.id}
            </p>
            <p>
              <strong>Customer:</strong> {openOrder.customer}
            </p>
            <p>
              <strong>Total:</strong> {openOrder.total}
            </p>
            <p>
              <strong>Status:</strong> {openOrder.status}
            </p>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default Dashboard;
