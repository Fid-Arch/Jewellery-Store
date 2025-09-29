import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { Plus, Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useProducts } from "../../context/ProductContext";
import { createProduct, updateProduct, deleteProduct, createProductWithStock, updateProductWithStock, getProductItems } from "../../utils/productAPI";
import { getAllCategories } from "../../utils/categoryAPI";

function Products() {
  const { products = [], loading = false, error = null, loadProducts } = useProducts();

  const [categories, setCategories] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    productname: "",
    description: "",
    product_image: "",
    category_id: "",
    is_featured: false,
    // Stock management fields
    sku: "",
    price: "",
    qty_in_stock: "",
  });



  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (loadProducts) {
          await loadProducts(1, 50); // Load first 50 products for admin
        }
        await loadCategories();
      } catch (error) {
        console.error('Failed to initialize admin products page:', error);
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    
    initializeData();
  }, []); // Empty dependency array - only run once on mount

  // Load categories
  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      const result = await getAllCategories();
      console.log('Categories result:', result);
      setCategories(result.data?.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setMessage({ type: 'error', text: 'Failed to load categories' });
      // Set empty array as fallback
      setCategories([]);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Open modal (Add or Edit)
  const openModal = async (product = null) => {
    setEditingProduct(product);
    
    if (product) {
      // For editing, load the product details including items
      try {
        const productDetail = await getProductItems(product.product_id);
        const productItems = productDetail.data?.items || [];
        const firstItem = productItems[0] || {};
        
        setForm({
          productname: product.productname || '',
          description: product.description || '',
          product_image: product.product_image || '',
          category_id: product.category_id || '',
          is_featured: Boolean(product.is_featured),
          // Stock fields from first product item
          sku: firstItem.sku || '',
          price: firstItem.price || '',
          qty_in_stock: firstItem.qty_in_stock || '',
        });
      } catch (error) {
        console.error('Failed to load product details:', error);
        // Fallback to basic product data
        setForm({
          productname: product.productname || '',
          description: product.description || '',
          product_image: product.product_image || '',
          category_id: product.category_id || '',
          is_featured: Boolean(product.is_featured),
          sku: '',
          price: '',
          qty_in_stock: '',
        });
      }
    } else {
      // For creating new product
      setForm({
        productname: "",
        description: "",
        product_image: "",
        category_id: "",
        is_featured: false,
        sku: "",
        price: "",
        qty_in_stock: "",
      });
    }
    
    setMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  // Save product
  const saveProduct = async () => {
    if (!form.productname.trim() || !form.description.trim()) {
      setMessage({ type: 'error', text: 'Product name and description are required' });
      return;
    }

    setIsSubmitting(true);
    console.log('=== SAVE PRODUCT DEBUG ===');
    console.log('Editing product:', editingProduct);
    console.log('Form data:', form);
    
    try {
      if (editingProduct) {
        // Update existing product with stock
        console.log('UPDATING PRODUCT:', editingProduct.product_id);
        console.log('Form data being sent:', form);
        const result = await updateProductWithStock(editingProduct.product_id, form);
        console.log('Update result:', result);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        // Create new product with stock
        console.log('Creating new product:', form);
        const result = await createProductWithStock(form);
        console.log('Create product result:', result);
        setMessage({ type: 'success', text: 'Product created successfully!' });
      }
      
      // Reload products and close modal
      console.log('Reloading products after save...');
      await loadProducts(1, 50); // Load first 50 products for admin
      console.log('Products after reload:', products);
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save product:', err);
      console.error('Error details:', err.message);
      setMessage({ type: 'error', text: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProduct(productId);
      setMessage({ type: 'success', text: 'Product deleted successfully!' });
      await loadProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete product' });
    }
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

      {/* Status Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            Error loading products: {error}
          </div>
        </div>
      )}



      {/* Products Table */}
      {!loading && !error && (
        <DataTable
          columns={[
            { header: "ID", accessor: "product_id" },
            { header: "Name", accessor: "productname" },
            { header: "Category", accessor: "category_name" },
            { 
              header: "Price Range", 
              accessor: "price_range",
              cell: (row) => {
                if (row.min_price && row.max_price) {
                  return row.min_price === row.max_price 
                    ? `$${row.min_price}` 
                    : `$${row.min_price} - $${row.max_price}`;
                }
                return 'Not set';
              }
            },
            { 
              header: "Stock", 
              accessor: "stock_status",
              cell: (row) => {
                const stock = row.variants_count || 0;
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stock > 10 
                      ? 'bg-green-100 text-green-800' 
                      : stock > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {stock > 0 ? `${stock} variants` : 'Out of stock'}
                  </span>
                );
              }
            },
            { 
              header: "Featured", 
              accessor: "is_featured",
              cell: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  row.is_featured 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {row.is_featured ? 'Yes' : 'No'}
                </span>
              )
            },
            { 
              header: "Created", 
              accessor: "created_at",
              cell: (row) => new Date(row.created_at).toLocaleDateString()
            },
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
                    onClick={() => handleDeleteProduct(row.product_id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={Array.isArray(products) ? products.map((p) => ({ ...p, actions: "" })) : []}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="space-y-4">
          {/* Status Messages in Modal */}
          {message.text && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="productname"
              value={form.productname}
              onChange={handleChange}
              placeholder="Enter product name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL
            </label>
            <input
              type="url"
              name="product_image"
              value={form.product_image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU (Stock Keeping Unit)
            </label>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="Enter unique SKU code"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Price and Stock Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                name="qty_in_stock"
                value={form.qty_in_stock}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Featured Product */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_featured"
              checked={form.is_featured}
              onChange={handleChange}
              className="w-4 h-4 text-gold bg-gray-100 border-gray-300 rounded focus:ring-gold focus:ring-2"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Featured Product
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-400 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={saveProduct}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-semibold py-2 rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:transform-none"
            >
              {isSubmitting ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default Products;
