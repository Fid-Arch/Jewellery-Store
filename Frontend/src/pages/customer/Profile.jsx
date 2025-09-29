import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { updateUserProfile, getUserProfile } from "../../utils/api";
import { getUserShippingAddresses, addShippingAddress, updateShippingAddress } from "../../utils/AddressAPI";
import UserReviews from "../../components/UserReviews";

const dummyOrders = [
  {
    id: "1001",
    product: "Gold Ring",
    total: "$1,200",
    status: "Delivered",
    date: "2025-07-15",
  },
  {
    id: "1002",
    product: "Diamond Necklace",
    total: "$3,400",
    status: "Processing",
    date: "2025-08-10",
  },
  {
    id: "1003",
    product: "Luxury Watch",
    total: "$5,800",
    status: "Shipped",
    date: "2025-09-01",
  },
];

// ✅ Australian states (from Checkout.jsx)
const australianStates = [
  'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, wishlist, login } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [shippingAddresses, setShippingAddresses] = useState([]); // ✅ Fetched list
  const [selectedAddress, setSelectedAddress] = useState(null); // ✅ Selected for display/edit (like Checkout)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false); // ✅ Toggle form (like Checkout)
  const [addressForm, setAddressForm] = useState({ // ✅ Separate form state (like Checkout)
    address_line1: '',
    address_line2: '',
    postcode: '',
    states: '', // ✅ Plural like Checkout/Backend
    country: 'Australia', // ✅ Default like Checkout
    is_default: false
  });
  const [addressMessage, setAddressMessage] = useState({ type: '', text: '' }); // ✅ Messages like Checkout

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || hasFetched) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        setUpdateError(null);
        const data = await getUserProfile(user.id, user.token);

        // Update edit form with fetched data (profile only)
        setEditForm({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
        });

        const updatedUser = { ...user, ...data.user };
        if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
          login(updatedUser);
        }

        // ✅ Fetch shipping addresses (like Checkout: no token, expect { data: { addresses: [] } })
        const addressesData = await getUserShippingAddresses(); // No token - uses internal getAuthToken()
        console.log("Fetched addressesData:", addressesData); // Debug: Check structure
        const userAddresses = addressesData.data?.addresses || []; // ✅ Match Checkout format
        setShippingAddresses(userAddresses);

        // Auto-select default or first (like Checkout)
        const defaultAddr = userAddresses.find(addr => addr.is_default) || userAddresses[0] || null;
        setSelectedAddress(defaultAddr);

        setHasFetched(true);
      } catch (err) {
        console.error("Fetch profile error:", err);
        setUpdateError(err.message || "Failed to load profile details");
        setEditForm({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phoneNumber: user?.phoneNumber || "",
        });

        // ✅ Still try to fetch addresses on error (like Checkout)
        try {
          const addressesData = await getUserShippingAddresses();
          console.log("Fallback addressesData:", addressesData); // Debug
          const userAddresses = addressesData.data?.addresses || [];
          setShippingAddresses(userAddresses);
          const defaultAddr = userAddresses.find(addr => addr.is_default) || userAddresses[0] || null;
          setSelectedAddress(defaultAddr);
        } catch (addrErr) {
          console.error("Fetch addresses error:", addrErr);
          setAddressMessage({ type: 'error', text: 'Failed to load addresses' });
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id, login, hasFetched]);

  const getMemberSince = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).getFullYear();
    }
    return "Recent";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (updateError) setUpdateError(null);
  };

  // ✅ Address form change (like Checkout)
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (addressMessage.type === 'error') setAddressMessage({ type: '', text: '' });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setUpdateError("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (editForm.phoneNumber && !phoneRegex.test(editForm.phoneNumber)) {
      setUpdateError("Please enter a valid phone number.");
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      const profileData = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phoneNumber: editForm.phoneNumber.trim(),
      };
      const data = await updateUserProfile(user.id, profileData, user.token);

      login({
        ...user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setUpdateError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Add/Update Address (like Checkout's handleAddNewAddress, but handles edit too)
  const handleSaveAddress = async (e) => {
    e?.preventDefault();
    if (!addressForm.address_line1 || !addressForm.postcode || !addressForm.states || !addressForm.country) {
      setAddressMessage({ type: 'error', text: 'Address Line 1, Postcode, State, and Country are required.' });
      return;
    }

    setUpdating(true);
    setAddressMessage({ type: '', text: '' });

    try {
      let result;
      const formData = { ...addressForm }; // Copy for API

      if (selectedAddress && selectedAddress.address_id) {
        // Update existing (use address_id like Checkout)
        result = await updateShippingAddress(selectedAddress.address_id, formData);
        setAddressMessage({ type: 'success', text: 'Address updated successfully!' });
      } else {
        // Add new
        result = await addShippingAddress(formData);
        setAddressMessage({ type: 'success', text: 'Address added successfully!' });
      }

      // Refresh list (like Checkout)
      const addressesData = await getUserShippingAddresses();
      const updatedAddresses = addressesData.data?.addresses || [];
      setShippingAddresses(updatedAddresses);

      // Select new/updated as primary
      const newSelected = updatedAddresses.find(addr => addr.address_id === (result.data?.address_id || selectedAddress?.address_id)) || updatedAddresses[0];
      setSelectedAddress(newSelected);

      // Close form and reset
      setShowAddAddressForm(false);
      setAddressForm({
        address_line1: '',
        address_line2: '',
        postcode: '',
        states: '',
        country: 'Australia',
        is_default: false
      });

      // Update context with primary address
      login({ ...user, address: newSelected });

      setIsEditingAddress(false);
    } catch (err) {
      console.error("Address save error:", err);
      setAddressMessage({ type: 'error', text: err.message || 'Failed to save address' });
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Cancel Address (reset form, close)
  const handleCancelAddress = () => {
    setShowAddAddressForm(false);
    setAddressForm({
      address_line1: '',
      address_line2: '',
      postcode: '',
      states: '',
      country: 'Australia',
      is_default: false
    });
    setAddressMessage({ type: '', text: '' });
    if (!selectedAddress) setIsEditingAddress(false); // Only close edit if no selection
  };

  // ✅ Select Address for Edit (pre-fill form)
  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    if (isEditingAddress && showAddAddressForm) {
      // Pre-fill for edit
      setAddressForm({
        address_line1: addr.address_line1 || '',
        address_line2: addr.address_line2 || '',
        postcode: addr.postcode || '',
        states: addr.states || '', // ✅ Plural
        country: addr.country || 'Australia',
        is_default: addr.is_default || false
      });
    }
  };

  const handleCancel = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setIsEditing(false);
    setUpdateError(null);
  };

  const hasAddress = shippingAddresses.length > 0;

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-red-500">Please log in to view your profile.</p>
        <button onClick={() => navigate("/login")} className="btn-primary mt-4">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-yellow-600">My Profile</h1>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-400/40 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-yellow-600 hover:underline text-sm font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>
        {isEditing ? (
          <form className="space-y-4">
            {updateError && <p className="text-red-500 text-sm">{updateError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={editForm.firstName}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={editForm.lastName}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={editForm.phoneNumber}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., +1-123-456-7890"
                disabled={updating}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updating || !editForm.firstName || !editForm.lastName || !editForm.email}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={updating}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Member since: {getMemberSince()}</p>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">
              Name: {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || "N/A"}
            </p>
            <p className="text-gray-600">Email: {user.email || "N/A"}</p>
            <p className="text-gray-600">Phone: {user.phoneNumber || "N/A"}</p>
            <p className="text-gray-600">Member since: {getMemberSince()}</p>
          </div>
        )}
      </div>

      {/* Address Section (Adapted from Checkout.jsx) */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-400/40 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Shipping Address</h2>
          {!isEditingAddress && (
            <button
              onClick={() => setIsEditingAddress(true)}
              className="text-yellow-600 hover:underline text-sm font-medium"
            >
              {hasAddress ? "Manage Addresses" : "Add Address"}
            </button>
          )}
        </div>

        {/* Address Messages (like Checkout) */}
        {addressMessage.text && (
          <div className={`mb-4 p-3 rounded-md ${
            addressMessage.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {addressMessage.text}
          </div>
        )}

        {isEditingAddress ? (
          // ✅ Edit Mode: List + Add/Edit Form (like Checkout)
          <div className="space-y-6">
            {/* Existing Addresses List (like Checkout) */}
            {shippingAddresses.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Select Primary Address</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {shippingAddresses.map((address) => (
                    <div
                      key={address.address_id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddress?.address_id === address.address_id
                          ? 'border-yellow-600 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-400'
                      }`}
                      onClick={() => handleSelectAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          {address.is_default && (
                            <span className="inline-block bg-yellow-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                              Default
                            </span>
                          )}
                          <p className="font-medium">{address.address_line1}</p>
                          {address.address_line2 && <p className="text-gray-600">{address.address_line2}</p>}
                          <p className="text-gray-600">
                            {address.states} {address.postcode}, {address.country}
                          </p>
                        </div>
                        <input
                          type="radio"
                          checked={selectedAddress?.address_id === address.address_id}
                          onChange={() => handleSelectAddress(address)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Form Toggle (like Checkout) */}
            <div>
              <button
                onClick={() => {
                  setShowAddAddressForm(!showAddAddressForm);
                  if (!showAddAddressForm && selectedAddress) {
                    // Pre-fill for edit on open
                    setAddressForm({
                      address_line1: selectedAddress.address_line1 || '',
                      address_line2: selectedAddress.address_line2 || '',
                      postcode: selectedAddress.postcode || '',
                      states: selectedAddress.states || '',
                      country: selectedAddress.country || 'Australia',
                      is_default: selectedAddress.is_default || false
                    });
                  } else if (showAddAddressForm) {
                    // Reset for add
                    setAddressForm({
                      address_line1: '',
                      address_line2: '',
                      postcode: '',
                      states: '',
                      country: 'Australia',
                      is_default: false
                    });
                  }
                }}
                className="flex items-center text-yellow-600 hover:text-yellow-700 font-medium mb-3"
              >
                {showAddAddressForm ? 'Cancel Edit' : (selectedAddress ? 'Edit Selected' : 'Add New Address')}
              </button>

              {showAddAddressForm && (
                <form onSubmit={handleSaveAddress} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <h4 className="font-medium">{selectedAddress ? 'Edit Address' : 'Add New Address'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        name="address_line1"
                        value={addressForm.address_line1}
                        onChange={handleAddressFormChange}
                        required
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        name="address_line2"
                        value={addressForm.address_line2}
                        onChange={handleAddressFormChange}
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <select
                        name="states" // ✅ Plural like Checkout
                        value={addressForm.states}
                        onChange={handleAddressFormChange}
                        required
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select State</option>
                        {australianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Postcode *</label>
                      <input
                        type="text"
                        name="postcode"
                        value={addressForm.postcode}
                        onChange={handleAddressFormChange}
                        required
                        pattern="[0-9]{4}"
                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressFormChange}
                      className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressFormChange}
                      className="mr-2"
                    />
                    <label className="text-sm">Set as default address</label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn-primary px-4 py-2 disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : (selectedAddress ? 'Update Address' : 'Add Address')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddress}
                      disabled={updating}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Done Button */}
            <button
              onClick={() => setIsEditingAddress(false)}
              disabled={updating || showAddAddressForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Done
            </button>
          </div>
        ) : (
          // ✅ View Mode: Show Selected Primary (like Checkout summary)
          <div className="space-y-2">
            {hasAddress && selectedAddress ? (
              <div className="text-gray-600 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedAddress.address_line1}</p>
                {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
                <p>{selectedAddress.states} {selectedAddress.postcode}, {selectedAddress.country}</p>
                {selectedAddress.is_default && <p className="text-sm text-yellow-600 mt-1">Default Address</p>}
                {shippingAddresses.length > 1 && (
                  <p className="text-sm text-gray-500 mt-2">
                    You have {shippingAddresses.length} addresses. <button onClick={() => setIsEditingAddress(true)} className="text-yellow-600 hover:underline">Manage All</button>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No shipping address saved.</p>
                <p className="text-sm text-gray-400">Add an address to streamline your checkout.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Orders</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2">Order ID</th>
              <th>Product</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {dummyOrders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-yellow-50">
                <td>{o.id}</td>
                <td>{o.product}</td>
                <td>{o.total}</td>
                <td className="font-semibold text-yellow-600">{o.status}</td>
                <td>{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* My Reviews */}
      <div className="mb-10">
        <UserReviews user={user} />
      </div>

      {/* Wishlist */}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Wishlist</h2>
        <p className="text-gray-600">
          You have <b>{wishlist.length}</b> items saved for later.
          {wishlist.length > 0 && (
            <button onClick={() => navigate("/wishlist")} className="ml-2 text-yellow-600 hover:underline">
              View Wishlist
            </button>
          )}
        </p>
      </div>
    </div>
  );
}