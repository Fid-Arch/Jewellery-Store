import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { Eye, CheckCircle, XCircle, Clock, Package, Truck, Search, Filter } from "lucide-react";
import apiService from "../../services/apiService";

const statusColors = {
  pending: "bg-orange-100 text-orange-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-gray-100 text-gray-700",
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  returned: XCircle,
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Debug current user state
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    console.log('Current user state:', currentUser);
    console.log('Token exists:', !!currentUser?.token);
    console.log('User role:', currentUser?.role);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading orders...');
      
      // Check if user is authenticated and is admin
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      console.log('Current user:', currentUser);
      
      if (!currentUser || !currentUser.token) {
        setMessage({ type: 'error', text: 'Please log in to access orders' });
        return;
      }
      
      if (currentUser.role?.toLowerCase() !== 'admin') {
        setMessage({ type: 'error', text: 'Admin access required' });
        return;
      }
      
      const response = await apiService.admin.getAllOrders();
      console.log('Orders response:', response);
      // Handle response structure from backend
      const ordersData = response?.data?.orders || response?.orders || response || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      if (error.status === 401) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to load orders' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load order details
  const loadOrderDetails = async (orderId) => {
    try {
      setLoadingOrderDetails(true);
      const response = await apiService.order.getOrderById(orderId);
      setOrderDetails(response.data || response);
    } catch (error) {
      console.error('Error loading order details:', error);
      setMessage({ type: 'error', text: 'Failed to load order details' });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      await apiService.order.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, order_status: newStatus }
          : order
      ));
      setMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
      
      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format order status
  const formatOrderStatus = (status) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
  };

  // Handle order view
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetails(order.order_id);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = !filters.status || order.order_status === filters.status;
    const matchesSearch = !filters.search || 
      order.first_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.last_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.order_id?.toString().includes(filters.search);
    
    const orderDate = new Date(order.order_date);
    const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo);
    
    return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <AdminLayout>
      {/* Debug Info */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
        <strong>Debug Info:</strong> 
        {(() => {
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          return ` User: ${currentUser?.firstName || 'None'}, Role: ${currentUser?.role || 'None'}, Token: ${currentUser?.token ? 'Present' : 'Missing'}`;
        })()}
      </div>

      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Manage Orders
        </h1>
        <button
          onClick={loadOrders}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="inline w-4 h-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline w-4 h-4 mr-1" />
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        /* Orders Table */
        <DataTable
          columns={[
            { 
              header: "Order ID", 
              accessor: "order_id",
              cell: (row) => `#${row.order_id}`
            },
            { 
              header: "Customer", 
              accessor: "customer",
              cell: (row) => `${row.first_name} ${row.last_name}`
            },
            { 
              header: "Email", 
              accessor: "email" 
            },
            { 
              header: "Total", 
              accessor: "total_amount",
              cell: (row) => formatCurrency(row.total_amount)
            },
            { 
              header: "Date", 
              accessor: "order_date",
              cell: (row) => new Date(row.order_date).toLocaleDateString()
            },
            {
              header: "Payment",
              accessor: "payment_status",
              cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  row.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {row.payment_status}
                </span>
              ),
            },
            {
              header: "Status",
              accessor: "order_status",
              cell: (row) => {
                const status = row.order_status?.toLowerCase() || 'pending';
                const StatusIcon = statusIcons[status] || Clock;
                return (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      statusColors[status] || statusColors.pending
                    }`}
                  >
                    <StatusIcon size={12} />
                    {formatOrderStatus(row.order_status)}
                  </span>
                );
              },
            },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewOrder(row)}
                    className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm"
                  >
                    <Eye size={14} /> View
                  </button>
                  {row.order_status !== 'delivered' && row.order_status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => updateStatus(row.order_id, "processing")}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                        disabled={row.order_status === 'processing'}
                      >
                        <Package size={14} /> Process
                      </button>
                      <button
                        onClick={() => updateStatus(row.order_id, "shipped")}
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
                        disabled={row.order_status === 'shipped'}
                      >
                        <Truck size={14} /> Ship
                      </button>
                      <button
                        onClick={() => updateStatus(row.order_id, "delivered")}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
                      >
                        <CheckCircle size={14} /> Deliver
                      </button>
                    </>
                  )}
                  {row.order_status !== 'delivered' && row.order_status !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(row.order_id, "cancelled")}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredOrders}
        />
      )}

      {/* Modal for Order Details */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setOrderDetails(null);
        }}
        title={`Order Details - #${selectedOrder?.order_id}`}
        size="large"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {loadingOrderDetails ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              </div>
            ) : (
              <>
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold">#{selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold">
                      {new Date(selectedOrder.order_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[selectedOrder.order_status?.toLowerCase()] || statusColors.pending
                      }`}
                    >
                      {formatOrderStatus(selectedOrder.order_status)}
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">
                        {selectedOrder.first_name} {selectedOrder.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedOrder.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`font-semibold ${
                        selectedOrder.payment_status === 'Paid' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                    <p className="p-3 bg-gray-50 rounded-lg">
                      {selectedOrder.shipping_address}
                    </p>
                  </div>
                )}

                {/* Order Items */}
                {orderDetails?.items && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-200 px-4 py-2 text-left">Product</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">SKU</th>
                            <th className="border border-gray-200 px-4 py-2 text-right">Price</th>
                            <th className="border border-gray-200 px-4 py-2 text-right">Quantity</th>
                            <th className="border border-gray-200 px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetails.items.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-200 px-4 py-2">
                                {item.productname || item.product_name}
                              </td>
                              <td className="border border-gray-200 px-4 py-2">
                                {item.sku}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right">
                                {item.quantity}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-right font-semibold">
                                {formatCurrency(item.price * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan="4" className="border border-gray-200 px-4 py-2 text-right font-semibold">
                              Total Amount:
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right font-bold text-green-600">
                              {formatCurrency(selectedOrder.total_amount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Order Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedOrder.order_status !== 'delivered' && selectedOrder.order_status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => updateStatus(selectedOrder.order_id, "processing")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        disabled={selectedOrder.order_status === 'processing'}
                      >
                        Mark as Processing
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.order_id, "shipped")}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        disabled={selectedOrder.order_status === 'shipped'}
                      >
                        Mark as Shipped
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.order_id, "delivered")}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Mark as Delivered
                      </button>
                      <button
                        onClick={() => updateStatus(selectedOrder.order_id, "cancelled")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default Orders;
