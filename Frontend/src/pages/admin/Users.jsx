import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/Layout";
import DataTable from "../../components/admin/DataTable";
import Modal from "../../components/admin/Modal";
import { UserPlus, UserCog, Trash2, Search, Filter, Eye, Lock, Unlock } from "lucide-react";
import apiService from "../../services/apiService";

const roleColors = {
  customer: "bg-blue-100 text-blue-700",
  admin: "bg-red-100 text-red-700",
  staff: "bg-green-100 text-green-700",
};

function Users() {
  console.log('Users component rendering...');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    roles_id: "2", // Default to customer
    isActive: true,
  });

  // Debug log: show current user, token, and role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    console.log('DEBUG: Current user object:', user);
    if (user?.token) {
      console.log('DEBUG: JWT token:', user.token);
      console.log('DEBUG: User role:', user.roles_id);
      console.log('DEBUG: User role type:', typeof user.roles_id);
    } else {
      console.log('DEBUG: No JWT token found in localStorage.');
    }
  }, []);

  // Load users on component mount
  useEffect(() => {
    console.log('useEffect: loadUsers called');
    try {
      loadUsers();
    } catch (error) {
      console.error('Error in useEffect loadUsers:', error);
    }
  }, []);
  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Starting loadUsers, calling apiService.admin.getAllUsers()');
      const response = await apiService.admin.getAllUsers();
      console.log('DEBUG: Users API response:', response);
      
      // Handle the actual backend response structure: { data: { users: [...], pagination: {...} } }
      let usersData = [];
      console.log('DEBUG: Full API response structure:', response);
      console.log('DEBUG: response.data:', response.data);
      console.log('DEBUG: response.data.data:', response.data?.data);
      console.log('DEBUG: response.data.data.users:', response.data?.data?.users);
      
      if (response.data && response.data.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
        console.log('DEBUG: Using response.data.users path');
      } else if (response.data && response.data.data && response.data.data.users) {
        usersData = response.data.data.users;
        console.log('DEBUG: Using response.data.data.users path');
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
        console.log('DEBUG: Using response.data as array');
      } else {
        console.log('DEBUG: No valid users data found in response');
      }
      
      console.log('DEBUG: Raw users data before filtering:', usersData);
      
      // Filter out empty objects and validate user data
      const validUsers = usersData.filter(user => user && (user.user_id || user.id));
      
      console.log('DEBUG: Valid users after filtering:', validUsers);
      console.log('DEBUG: Valid users length:', validUsers.length);
      if (validUsers.length > 0) {
        console.log('DEBUG: First valid user object:', validUsers[0]);
        console.log('DEBUG: First valid user firstName:', validUsers[0].firstName);
        console.log('DEBUG: First valid user first_name:', validUsers[0].first_name);
      }
      
      console.log('DEBUG: About to set users state with:', validUsers);
      console.log('DEBUG: First user in validUsers before setState:', validUsers[0]);
      setUsers(validUsers);
      console.log('DEBUG: setUsers called with', validUsers.length, 'users');
    } catch (error) {
      console.error('DEBUG: Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
      setUsers([]); // Ensure users is set to empty array on error
    } finally {
      setLoading(false);
      console.log('DEBUG: Finished loadUsers, loading state:', loading);
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

  // Open modal for adding new user
  const openModal = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      roles_id: "2",
      isActive: true,
    });
    setMessage({ type: '', text: '' });
    setModalOpen(true);
  };

  // View user details
  const viewUser = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Save new user
  const saveUser = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      const userData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        roles_id: parseInt(form.roles_id),
        isActive: form.isActive
      };

      await apiService.auth.register(userData);
      setMessage({ type: 'success', text: 'User created successfully' });
      setModalOpen(false);
      loadUsers(); // Reload users list
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
    }
  };

  // Toggle user status (activate/deactivate)
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      // This would require an API endpoint to update user status
      // For now, just show message that feature needs backend implementation
      setMessage({ type: 'info', text: 'User status toggle requires backend API implementation' });
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  // Delete user (requires careful implementation)
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      // This would require a delete API endpoint
      setMessage({ type: 'info', text: 'User deletion requires backend API implementation' });
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  // Format role name
  const formatRole = (roleId) => {
    const roles = {
      1: 'Admin',
      2: 'Customer', 
      3: 'Staff'
    };
    return roles[roleId] || 'Unknown';
  };

  // Get role color class
  const getRoleColor = (roleId) => {
    const roleMap = {
      1: 'admin',
      2: 'customer',
      3: 'staff'
    };
    return roleColors[roleMap[roleId]] || roleColors.customer;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      (user.firstName || user.first_name)?.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.lastName || user.last_name)?.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = !filters.role || user.roles_id?.toString() === filters.role;
    
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && user.is_active) ||
      (filters.status === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  try {
    console.log('Users component about to render, users:', users, 'loading:', loading);
    console.log('Users component - users length:', users.length);
    if (users.length > 0) {
      console.log('Users component - first user in state:', users[0]);
      console.log('Users component - first user keys:', users[0] ? Object.keys(users[0]) : 'no keys');
    }
    return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
          Manage Users
        </h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="inline w-4 h-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="inline w-4 h-4 mr-1" />
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="1">Admin</option>
              <option value="2">Customer</option>
              <option value="3">Staff</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">No Users Found</h2>
          <p className="text-gray-500 mb-6">There are no users to display at this time.</p>
          <button
            onClick={loadUsers}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
          >
            Refresh Users
          </button>
        </div>
      ) : (
        /* Users Table */
        <DataTable
            columns={[
            { 
              header: "ID", 
              accessor: "user_id" 
            },
            { 
              header: "Name", 
              accessor: "firstName",
              cell: ({ row }) => {
                if (!row) return 'N/A';
                const firstName = row.firstName || row.first_name || '';
                return firstName || 'N/A';
              }
            },
            { 
              header: "Email", 
              accessor: "email" 
            },
            { 
              header: "Phone", 
              accessor: "phoneNumber",
              cell: ({ row }) => {
                if (!row) return 'N/A';
                return row.phoneNumber || row.phone_number || 'N/A';
              }
            },
            {
              header: "Status",
              accessor: "is_active",
              cell: ({ row }) => {
                if (!row) return <span className="text-gray-500">N/A</span>;
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                );
              },
            },
            { 
              header: "Role & Joined", 
              accessor: "roleAndJoined",
              cell: ({ row }) => {
                if (!row) return <div className="text-gray-500">N/A</div>;
                const role = formatRole(row.roles_id);
                const date = row.createdAt || row.created_at;
                const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
                return (
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium text-gray-900">{role}</div>
                    <div className="text-xs text-gray-500">Joined: {formattedDate}</div>
                  </div>
                );
              }
            },
            {
              header: "Actions",
              accessor: "actions",
              cell: ({ row }) => {
                if (!row || !row.user_id) return <span className="text-gray-500">N/A</span>;
                return (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => viewUser(row)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => toggleUserStatus(row.user_id, row.is_active)}
                      className={`flex items-center gap-1 text-sm ${
                        row.is_active 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {row.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                      {row.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteUser(row.user_id)}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                );
              },
            },
          ]}
          data={filteredUsers}
        />
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="roles_id"
              value={form.roles_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="2">Customer</option>
              <option value="3">Staff</option>
              <option value="1">Admin</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Active User
            </label>
          </div>
          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 
              message.type === 'error' ? 'bg-red-100 text-red-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              onClick={saveUser}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              Create User
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`User Details - ${selectedUser?.firstName || selectedUser?.first_name || ''} ${selectedUser?.lastName || selectedUser?.last_name || ''}`}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">{selectedUser.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">
                  {selectedUser.firstName || selectedUser.first_name || ''} {selectedUser.lastName || selectedUser.last_name || ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{selectedUser.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(selectedUser.roles_id)}`}>
                  {formatRole(selectedUser.roles_id)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Join Date</p>
                <p className="font-semibold">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold">
                  {new Date(selectedUser.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedUser.date_of_birth && (
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-semibold">
                  {new Date(selectedUser.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
    );
  } catch (error) {
    console.error('Error rendering Users component:', error);
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Users</h1>
          <p className="text-gray-600">There was an error loading the users page. Please check the console for details.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">{error.toString()}</pre>
        </div>
      </AdminLayout>
    );
  }
}

export default Users;