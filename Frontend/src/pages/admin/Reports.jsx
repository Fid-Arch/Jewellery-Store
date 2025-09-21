import React from "react";
import AdminLayout from "../../components/admin/Layout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

// --- Sample Data (replace with API later) ---
const salesData = [
  { month: "Jan", revenue: 12400, orders: 320 },
  { month: "Feb", revenue: 9800, orders: 280 },
  { month: "Mar", revenue: 15200, orders: 410 },
  { month: "Apr", revenue: 13200, orders: 360 },
  { month: "May", revenue: 17400, orders: 460 },
  { month: "Jun", revenue: 16200, orders: 430 },
];

function Reports() {
  // Export CSV function
  const exportCSV = () => {
    const header = "Month,Revenue,Orders\n";
    const rows = salesData
      .map((d) => `${d.month},${d.revenue},${d.orders}`)
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + header + rows;
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "sales_report.csv";
    link.click();
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Reports & Analytics
        </h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white px-5 py-2 rounded-xl shadow hover:scale-105 transition"
        >
          <Download size={20} /> Export CSV
        </button>
      </div>

      {/* Sales Revenue Line Chart */}
      <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          📈 Monthly Revenue
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#eab308"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Bar Chart */}
      <div className="bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🛒 Monthly Orders
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="orders" fill="#facc15" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
}

export default Reports;
