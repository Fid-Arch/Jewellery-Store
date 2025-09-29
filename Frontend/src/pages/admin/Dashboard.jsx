import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import StatsCard from "../../components/admin/StatsCard";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { DollarSign, ShoppingBag, Users, TrendingUp, Package, AlertTriangle } from "lucide-react";
import apiService from "../../services/apiService";
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
  BarChart,
  Bar,
} from "recharts";

// Status colors
const statusColors = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-red-100 text-red-700",
  Shipped: "bg-blue-100 text-blue-700",
  Cancelled: "bg-gray-100 text-gray-700",
};

const CHART_COLORS = ['#facc15', '#f59e0b', '#d97706', '#b45309', '#92400e'];

function Dashboard() {
  const [openOrder, setOpenOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalProducts: 0,
      recentOrders: 0,
      monthlyRevenue: []
    },
    recentOrders: [],
    categoryData: [],
    salesTrend: []
  });

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Debug current user
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      console.log('Dashboard - Current user:', currentUser);
      console.log('Dashboard - Token exists:', !!currentUser?.token);
      console.log('Dashboard - User role:', currentUser?.role);
      
      if (!currentUser || !currentUser.token) {
        console.error('No user token found');
        return;
      }
      
      if (currentUser.role?.toLowerCase() !== 'admin') {
        console.error('User is not admin:', currentUser.role);
        return;
      }
      
      // Fetch dashboard stats
      console.log('Fetching dashboard stats...');
      const statsResponse = await apiService.admin.getDashboardStats();
      console.log('Stats response:', statsResponse);
      
      // Fetch recent orders
      console.log('Fetching recent orders...');
      const ordersResponse = await apiService.admin.getAllOrders();
      console.log('Orders response:', ordersResponse);
      
      // Process the data
      const stats = statsResponse.data || {};
      const recentOrders = (ordersResponse?.data?.orders || ordersResponse?.orders || []).slice(0, 5);
      
      // Create sales trend data from monthly revenue
      const salesTrend = stats.monthlyRevenue?.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en', { month: 'short' }),
        sales: parseFloat(item.revenue) || 0
      })) || [];

      // Mock category data (you can add this to backend later)
      const categoryData = [
        { name: "High Jewellery", value: 35 },
        { name: "Fine Jewellery", value: 25 },
        { name: "Accessories", value: 20 },
        { name: "Gifts", value: 20 },
      ];

      setDashboardData({
        stats,
        recentOrders,
        categoryData,
        salesTrend
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatOrderStatus = (status) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <StatsCard
          title="Revenue"
          value={formatCurrency(dashboardData.stats.totalRevenue)}
          icon={DollarSign}
          color="from-yellow-500 to-yellow-700"
        />
        <StatsCard
          title="Orders"
          value={dashboardData.stats.totalOrders?.toLocaleString() || '0'}
          icon={ShoppingBag}
          color="from-pink-500 to-pink-700"
        />
        <StatsCard
          title="Customers"
          value={dashboardData.stats.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          color="from-green-500 to-green-700"
        />
        <StatsCard
          title="Products"
          value={dashboardData.stats.totalProducts?.toLocaleString() || '0'}
          icon={Package}
          color="from-purple-500 to-purple-700"
        />
        <StatsCard
          title="Recent Orders"
          value={dashboardData.stats.recentOrders?.toLocaleString() || '0'}
          icon={TrendingUp}
          color="from-blue-500 to-blue-700"
        />
        <StatsCard
          title="Growth Rate"
          value="+12.5%"
          icon={AlertTriangle}
          color="from-indigo-500 to-indigo-700"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📈 Sales Overview
          </h2>
          {dashboardData.salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No sales data available
            </div>
          )}
        </div>
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            💎 Category Share
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dashboardData.categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#eab308"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dashboardData.categoryData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🛒 Recent Orders
          </h2>
          <button 
            onClick={fetchDashboardData}
            className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
        {dashboardData.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-yellow-50 transition">
                    <td className="px-6 py-4 font-medium">
                      #{order.order_id}
                    </td>
                    <td className="px-6 py-4">
                      {order.first_name} {order.last_name}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[formatOrderStatus(order.order_status)] || 
                          statusColors.Pending
                        }`}
                      >
                        {formatOrderStatus(order.order_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setOpenOrder(order)}
                        className="text-yellow-600 hover:text-yellow-700 hover:underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent orders found
          </div>
        )}
      </div>

      {/* Modal for Order Details */}
      <Modal
        isOpen={!!openOrder}
        onClose={() => setOpenOrder(null)}
        title="Order Details"
      >
        {openOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold">#{openOrder.order_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">
                  {openOrder.first_name} {openOrder.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{openOrder.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{openOrder.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(openOrder.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[formatOrderStatus(openOrder.order_status)] || 
                    statusColors.Pending
                  }`}
                >
                  {formatOrderStatus(openOrder.order_status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold">
                  {new Date(openOrder.order_date).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className={`font-semibold ${
                  openOrder.payment_status === 'Paid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {openOrder.payment_status}
                </p>
              </div>
            </div>
            {openOrder.shipping_address && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Shipping Address</p>
                <p className="text-sm">{openOrder.shipping_address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default Dashboard;
