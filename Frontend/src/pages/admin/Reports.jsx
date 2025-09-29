import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/Layout';
import StatsCard from '../../components/admin/StatsCard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Download,
  Eye
} from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [reportsData, setReportsData] = useState({
    stats: {
      totalRevenue: 125000,
      totalOrders: 854,
      totalUsers: 2340,
      totalProducts: 156,
      avgOrderValue: 146.36,
      conversionRate: 3.2
    },
    sales: [],
    userGrowth: [],
    topProducts: [],
    orderStatus: [],
    categoryPerformance: []
  });

  // Generate mock data for demonstration
  const generateMockData = () => {
    // Sales data for the last 30 days
    const salesData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      salesData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 2000,
        orders: Math.floor(Math.random() * 50) + 20,
        visitors: Math.floor(Math.random() * 200) + 100
      });
    }

    // User growth data for the last 12 months
    const userGrowthData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      userGrowthData.push({
        month: months[i],
        newUsers: Math.floor(Math.random() * 100) + 50,
        totalUsers: 200 + (i * 150) + Math.floor(Math.random() * 100)
      });
    }

    // Top products
    const topProducts = [
      { name: 'Diamond Engagement Ring', sales: 45, revenue: 67500 },
      { name: 'Gold Tennis Bracelet', sales: 32, revenue: 48000 },
      { name: 'Pearl Necklace Set', sales: 28, revenue: 33600 },
      { name: 'Sapphire Earrings', sales: 25, revenue: 37500 },
      { name: 'Ruby Pendant', sales: 22, revenue: 26400 }
    ];

    // Order status distribution
    const orderStatus = [
      { name: 'Completed', value: 65, color: '#10b981' },
      { name: 'Processing', value: 20, color: '#3b82f6' },
      { name: 'Shipped', value: 10, color: '#f59e0b' },
      { name: 'Cancelled', value: 5, color: '#ef4444' }
    ];

    // Category performance
    const categoryPerformance = [
      { category: 'Rings', sales: 156, revenue: 78000 },
      { category: 'Necklaces', sales: 134, revenue: 67000 },
      { category: 'Earrings', sales: 98, revenue: 49000 },
      { category: 'Bracelets', sales: 87, revenue: 43500 },
      { category: 'Watches', sales: 76, revenue: 38000 }
    ];

    setReportsData(prev => ({
      ...prev,
      sales: salesData,
      userGrowth: userGrowthData,
      topProducts,
      orderStatus,
      categoryPerformance
    }));
  };

  useEffect(() => {
    generateMockData();
  }, []);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Export data to CSV
  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Reports & Analytics
        </h1>
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={() => exportCSV(reportsData.sales, 'sales_report')}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(reportsData.stats.totalRevenue)}
          icon={DollarSign}
          color="from-green-500 to-green-700"
        />
        <StatsCard
          title="Total Orders"
          value={reportsData.stats.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          color="from-blue-500 to-blue-700"
        />
        <StatsCard
          title="Total Users"
          value={reportsData.stats.totalUsers.toLocaleString()}
          icon={Users}
          color="from-purple-500 to-purple-700"
        />
        <StatsCard
          title="Total Products"
          value={reportsData.stats.totalProducts.toLocaleString()}
          icon={Package}
          color="from-indigo-500 to-indigo-700"
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrency(reportsData.stats.avgOrderValue)}
          icon={TrendingUp}
          color="from-yellow-500 to-yellow-700"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${reportsData.stats.conversionRate}%`}
          icon={Eye}
          color="from-pink-500 to-pink-700"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📈 Sales Trend</h2>
            <button
              onClick={() => exportCSV(reportsData.sales, 'sales_trend')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Download size={16} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportsData.sales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#facc15" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Visitors'
              ]} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#facc15"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">👥 User Growth</h2>
            <button
              onClick={() => exportCSV(reportsData.userGrowth, 'user_growth')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Download size={16} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="newUsers" fill="#3b82f6" name="New Users" />
              <Bar dataKey="totalUsers" fill="#10b981" name="Total Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📊 Order Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportsData.orderStatus}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {reportsData.orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white shadow-md rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">🏷️ Category Performance</h2>
            <button
              onClick={() => exportCSV(reportsData.categoryPerformance, 'category_performance')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Download size={16} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsData.categoryPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="category" type="category" stroke="#9ca3af" />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : 'Sales'
              ]} />
              <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white shadow-md rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">🏆 Top Products</h2>
          <button
            onClick={() => exportCSV(reportsData.topProducts, 'top_products')}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <Download size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Rank</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Sales</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Revenue</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-yellow-50 transition">
                  <td className="px-6 py-4 font-semibold">#{index + 1}</td>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.sales}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4">
                    {formatCurrency(product.revenue / product.sales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;