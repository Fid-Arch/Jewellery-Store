import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { UserPlus, UserCog, Trash2 } from "lucide-react";

// Sample users (replace with API later)
const initialCustomers = [
  {
    id: "C001",
    name: "Alice Johnson",
    email: "alice@email.com",
    role: "Customer",
  },
  {
    id: "C002",
    name: "Michael Lee",
    email: "michael@email.com",
    role: "Customer",
  },
];

const initialStaff = [
  { id: "S001", name: "David Kim", email: "david@email.com", role: "Staff" },
  { id: "S002", name: "Sarah Kim", email: "sarah@email.com", role: "Staff" },
];

function Users() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [staff, setStaff] = useState(initialStaff);

  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "Customer",
  });

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Open modal (Add User)
  const openModal = (role) => {
    setForm({ id: "", name: "", email: "", role });
    setModalOpen(true);
  };

  // Save user
  const saveUser = () => {
    const newUser = { ...form, id: `${form.role[0]}${Date.now()}` };
    if (form.role === "Customer") {
      setCustomers([...customers, newUser]);
    } else {
      setStaff([...staff, newUser]);
    }
    setModalOpen(false);
  };

  // Delete user
  const deleteUser = (id, role) => {
    if (role === "Customer") {
      setCustomers(customers.filter((u) => u.id !== id));
    } else {
      setStaff(staff.filter((u) => u.id !== id));
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Manage Users
      </h1>

      {/* Customers Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
          <button
            onClick={() => openModal("Customer")}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            <UserPlus size={18} /> Add Customer
          </button>
        </div>
        <DataTable
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Role", accessor: "role" },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <button
                  onClick={() => deleteUser(row.id, "Customer")}
                  className="text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              ),
            },
          ]}
          data={customers.map((u) => ({ ...u, actions: "" }))}
        />
      </div>

      {/* Staff Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Staff</h2>
          <button
            onClick={() => openModal("Staff")}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            <UserCog size={18} /> Add Staff
          </button>
        </div>
        <DataTable
          columns={[
            { header: "ID", accessor: "id" },
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "email" },
            { header: "Role", accessor: "role" },
            {
              header: "Actions",
              accessor: "actions",
              cell: (row) => (
                <button
                  onClick={() => deleteUser(row.id, "Staff")}
                  className="text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              ),
            },
          ]}
          data={staff.map((u) => ({ ...u, actions: "" }))}
        />
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add ${form.role}`}
      >
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-2"
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            onClick={saveUser}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-semibold py-2 rounded-lg hover:scale-105 transition"
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default Users;
