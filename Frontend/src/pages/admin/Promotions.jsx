import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/Layout';
import DataTable from '../../components/admin/DataTable';
import Modal from '../../components/admin/Modal';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import apiService from '../../services/apiService';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_rate: '',
    discount_type: 'percentage',
    promotion_code: '',
    start_date: '',
    end_date: '',
    minimum_order_value: '',
    usage_limit: '',
    is_active: true,
    applicable_categories: []
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await apiService.promotion.getAllPromotions();
      console.log('API Response:', response); // Debug log
      
      // Handle different response structures
      const promotions = response.data?.promotions || response.promotions || response.data || [];
      console.log('Extracted promotions:', promotions); // Debug log
      
      setPromotions(Array.isArray(promotions) ? promotions : []);
      
      if (promotions.length === 0) {
        setMessage({ type: 'info', text: 'No promotions found. Create your first promotion!' });
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setMessage({ type: 'error', text: `Failed to fetch promotions: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert to camelCase field names that match the backend controller
      const submitData = {
        name: formData.name,
        description: formData.description,
        promotionCode: formData.promotion_code,
        discountRate: parseFloat(formData.discount_rate),
        discountType: formData.discount_type,
        minimumOrderValue: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : 0,
        usageLimit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        startDate: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        endDate: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        isActive: Boolean(formData.is_active),
        applicableCategories: formData.applicable_categories
      };

      if (editingPromotion) {
        await apiService.promotion.updatePromotion(editingPromotion.promotionId || editingPromotion.id, submitData);
        setMessage({ type: 'success', text: 'Promotion updated successfully' });
      } else {
        await apiService.promotion.createPromotion(submitData);
        setMessage({ type: 'success', text: 'Promotion created successfully' });
      }

      setShowModal(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      setMessage({ type: 'error', text: error.response?.data?.Message || 'Failed to save promotion' });
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name || '',
      description: promotion.description || '',
      discount_rate: promotion.discountRate || '',
      discount_type: promotion.discountType || 'percentage',
      promotion_code: promotion.promotionCode || '',
      start_date: promotion.startDate ? new Date(promotion.startDate).toISOString().slice(0, 16) : '',
      end_date: promotion.endDate ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
      minimum_order_value: promotion.minimumOrderValue || '',
      usage_limit: promotion.usageLimit || '',
      is_active: Boolean(promotion.isActive),
      applicable_categories: promotion.applicableCategories ? JSON.parse(promotion.applicableCategories) : []
    });
    setShowModal(true);
  };

  const handleDelete = async (promotion) => {
    if (window.confirm('Are you sure you want to deactivate this promotion?')) {
      try {
        await apiService.promotion.deletePromotion(promotion.promotionId || promotion.id);
        setMessage({ type: 'success', text: 'Promotion deactivated successfully' });
        fetchPromotions();
      } catch (error) {
        console.error('Error deleting promotion:', error);
        setMessage({ type: 'error', text: 'Failed to deactivate promotion' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_rate: '',
      discount_type: 'percentage',
      promotion_code: '',
      start_date: '',
      end_date: '',
      minimum_order_value: '',
      usage_limit: '',
      is_active: true,
      applicable_categories: []
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
    resetForm();
  };

  const columns = [
    { 
      accessor: 'name', 
      header: 'Promotion Details',
      cell: (row) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
          <div className="text-sm text-gold-600 font-medium">{row.promotionCode}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
            {row.description || 'No description'}
          </div>
        </div>
      )
    },
    { 
      accessor: 'discountRate', 
      header: 'Discount',
      cell: (row) => (
        <div className="text-center">
          <div className="font-bold text-lg text-gold-600">
            {row.discountType === 'percentage' ? `${row.discountRate}%` : `$${row.discountRate}`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {row.discountType.replace('_', ' ')}
          </div>
        </div>
      )
    },
    { 
      accessor: 'startDate', 
      header: 'Duration',
      cell: (row) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-white">
            <strong>Start:</strong> {row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-gray-900 dark:text-white">
            <strong>End:</strong> {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    { 
      accessor: 'usageCount', 
      header: 'Usage Stats',
      cell: (row) => (
        <div className="text-center">
          <div className="font-bold text-lg text-gray-900 dark:text-white">{row.usageCount || 0}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {row.usageLimit ? `of ${row.usageLimit} uses` : 'Unlimited'}
          </div>
          {row.minimumOrderValue > 0 && (
            <div className="text-xs text-gold-600 mt-1">
              Min: ${row.minimumOrderValue}
            </div>
          )}
        </div>
      )
    },
    { 
      accessor: 'isActive', 
      header: 'Status',
      cell: (row) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
            row.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              row.isActive ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Message Display */}
        {message.text && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Tag className="h-8 w-8 mr-3 text-gold-600" />
              Promotions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage promotional codes and discounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Promotion
          </button>
        </div>

        {/* Promotions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <DataTable
            data={promotions}
            columns={columns}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No promotions found"
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Promotion Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="Enter promotion name"
              />
            </div>

            {/* Promotion Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Promotion Code *
              </label>
              <input
                type="text"
                name="promotion_code"
                value={formData.promotion_code}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase transition-colors"
                placeholder="e.g., SAVE20"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="col-span-full">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
              placeholder="Enter promotion description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Discount Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Type *
              </label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ($)</option>
              </select>
            </div>

            {/* Discount Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount'} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="discount_rate"
                  value={formData.discount_rate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors pr-12"
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {formData.discount_type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Minimum Order Value */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Minimum Order Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="minimum_order_value"
                  value={formData.minimum_order_value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors pl-8"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">$</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for no minimum</p>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="e.g., 100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for unlimited uses</p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-5 w-5 text-gold-600 focus:ring-gold-500 focus:ring-2 border-gray-300 dark:border-gray-500 rounded transition-colors"
            />
            <label className="ml-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Active Promotion
            </label>
            <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              (Users can apply this promotion code)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-semibold transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
            >
              {editingPromotion ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Promotion
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promotion
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default Promotions;