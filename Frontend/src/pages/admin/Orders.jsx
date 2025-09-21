import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";

// Sample orders (replace with API later)
const initialOrders = [
  {
    id: "#1001",
    customer: "Alice Johnson",
    total: "$2,450",
    status: "Delivered",
  },
  { id: "#1002", customer: "Michael Lee", total: "$980", status: "Processing" },
  { id: "#1003", customer: "Sarah Kim", total: "$1,720", status: "Pending" },
  { id: "#1004", customer: "David Kim", total: "$3,200", status: "Cancelled" },
];

const statusColors = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
};

function Orders() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Update order status
  const updateStatus = (id, newStatus) => {
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Manage Orders
      </h1>

      {/* Orders Table */}
      <DataTable
        columns={[
          { header: "Order ID", accessor: "id" },
          { header: "Customer", accessor: "customer" },
          { header: "Total", accessor: "total" },
          {
            header: "Status",
            accessor: "status",
            cell: (row) => (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[row.status]
                }`}
              >
                {row.status}
              </span>
            ),
          },
          {
            header: "Actions",
            accessor: "actions",
            cell: (row) => (
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrder(row)}
                  className="text-yellow-600 hover:underline flex items-center gap-1"
                >
                  <Eye size={16} /> View
                </button>
                <button
                  onClick={() => updateStatus(row.id, "Delivered")}
                  className="text-green-600 hover:underline flex items-center gap-1"
                >
                  <CheckCircle size={16} /> Deliver
                </button>
                <button
                  onClick={() => updateStatus(row.id, "Cancelled")}
                  className="text-red-600 hover:underline flex items-center gap-1"
                >
                  <XCircle size={16} /> Cancel
                </button>
                <button
                  onClick={() => updateStatus(row.id, "Processing")}
                  className="text-yellow-600 hover:underline flex items-center gap-1"
                >
                  <Clock size={16} /> Process
                </button>
              </div>
            ),
          },
        ]}
        data={orders.map((o) => ({ ...o, actions: "" }))}
      />

      {/* Modal for Order Details */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-3">
            <p>
              <strong>ID:</strong> {selectedOrder.id}
            </p>
            <p>
              <strong>Customer:</strong> {selectedOrder.customer}
            </p>
            <p>
              <strong>Total:</strong> {selectedOrder.total}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder.status}
            </p>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default Orders;
