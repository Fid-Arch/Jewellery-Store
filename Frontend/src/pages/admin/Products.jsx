import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { Plus, Edit, Trash2 } from "lucide-react";

// Sample products (replace with API)
const initialProducts = [
  {
    id: "P001",
    name: "Diamond Necklace",
    category: "High Jewellery",
    price: "$4,500",
    stock: 12,
  },
  {
    id: "P002",
    name: "Gold Ring",
    category: "Fine Jewellery",
    price: "$1,200",
    stock: 40,
  },
  {
    id: "P003",
    name: "Luxury Watch",
    category: "Accessories",
    price: "$8,300",
    stock: 8,
  },
];

function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
  });

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Open modal (Add or Edit)
  const openModal = (product = null) => {
    setEditingProduct(product);
    setForm(
      product || { id: "", name: "", category: "", price: "", stock: "" }
    );
    setModalOpen(true);
  };

  // Save product
  const saveProduct = () => {
    if (editingProduct) {
      // Update existing
      setProducts(products.map((p) => (p.id === editingProduct.id ? form : p)));
    } else {
      // Add new
      setProducts([...products, { ...form, id: `P${products.length + 1}` }]);
    }
    setModalOpen(false);
  };

  // Delete product
  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Manage Products
        </h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white px-5 py-2 rounded-xl shadow hover:scale-105 transition"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <DataTable
        columns={[
          { header: "ID", accessor: "id" },
          { header: "Name", accessor: "name" },
          { header: "Category", accessor: "category" },
          { header: "Price", accessor: "price" },
          { header: "Stock", accessor: "stock" },
          {
            header: "Actions",
            accessor: "actions",
            cell: (row) => (
              <div className="flex gap-3">
                <button
                  onClick={() => openModal(row)}
                  className="text-yellow-600 hover:underline flex items-center gap-1"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => deleteProduct(row.id)}
                  className="text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            ),
          },
        ]}
        data={products.map((p) => ({ ...p, actions: "" }))}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="space-y-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full border rounded-lg px-4 py-2"
          />
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full border rounded-lg px-4 py-2"
          />
          <input
            type="text"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="w-full border rounded-lg px-4 py-2"
          />
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock"
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            onClick={saveProduct}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-semibold py-2 rounded-lg hover:scale-105 transition"
          >
            Save
          </button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default Products;
