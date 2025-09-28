import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { updateUserProfile, getUserProfile } from "../../utils/api";

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
    address: user?.address || {
      address_line1: "",
      address_line2: "",
      postcode: "",
      state: "",
      country: "",
    },
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || hasFetched) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        setUpdateError(null);
        const data = await getUserProfile(user.id, user.token); // ✅ Fetch latest profile (assumes { user: { ..., phone } })

        // Update edit form with fetched data
        setEditForm({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          address: data.user.address || {
            address_line1: "",
            address_line2: "",
            postcode: "",
            state: "",
            country: "",
          },
        });

        const updatedUser = { ...user, ...data.user };
        if (JSON.stringify(updatedUser) !== JSON.stringify(user)) { // Simple diff check
          login(updatedUser);
        }

        setHasFetched(true); // ✅ Mark as fetched
      } catch (err) {
        console.error("Fetch profile error:", err);
        setUpdateError(err.message || "Failed to load profile details");
        setEditForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          address: user.address || {
            address_line1: "",
            address_line2: "",
            postcode: "",
            state: "",
            country: "",
          },
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id, login, hasFetched]);

  const getMemberSince = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).getFullYear(); // e.g., "2025"
    }
    return "Recent"; // Fallback if no date
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      // Handle nested address fields (e.g., "address.street")
      const field = name.split(".")[1];
      setEditForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
    if (updateError) setUpdateError(null); // Clear error on change
  };

  const handleSave = async () => {
    if (!user) return;

    // ✅ Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setUpdateError("Please enter a valid email address.");
      setUpdating(false);
      return;
    }

    // ✅ Basic phone validation (optional; adjust regex as needed)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/; // e.g., +1-123-456-7890 or 1234567890
    if (editForm.phoneNumber && !phoneRegex.test(editForm.phoneNumber)) {
      setUpdateError("Please enter a valid phone number.");
      setUpdating(false);
      return;
    }

    const hasAddress = editForm.address.postcode && editForm.address.country;
    if (isEditingAddress && !hasAddress) {
      setUpdateError("Please provide at least city and country for address.");
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      const data = await updateUserProfile(
        user.id, // userId
        {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim().toLowerCase(),
          phoneNumber: editForm.phoneNumber.trim(),
          address: editForm.address,
        }, // updateData
        user.token // token
      );

      // Update context with new user data
      login({
        ...user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
        address: data.user.address,
      });

      setIsEditing(false);
      setIsEditingAddress(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setUpdateError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || {
        address_line1: "",
        address_line2: "",
        postcode: "",
        state: "",
        country: "",
      },
    });
    setIsEditing(false);
    setIsEditingAddress(false);
    setUpdateError(null);
  };

  const hasAddress = user?.address && (user.address.postcode || user.address.country);

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // ✅ Fallback if no user (shouldn't happen due to route guard)
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-red-500">Please log in to view your profile.</p>
        <button
          onClick={() => navigate("/login")}
          className="btn-primary mt-4"
        >
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

      {/* Account Info - Dynamic from user */}
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
          // ✅ Edit Form
          <form className="space-y-4">
            {updateError && <p className="text-red-500 text-sm">{updateError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email" // ✅ Keeps type="email" for validation
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500" // ✅ Removed bg-gray-100
                required
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel" // ✅ type="tel" for phone
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
                onClick={handleSave}
                disabled={updating || !editForm.firstName || !editForm.lastName}
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
            <p className="text-xs text-gray-500 mt-2">
              Member since: {getMemberSince()}
            </p>
          </form>
        ) : (
          // ✅ View Mode
          <div className="space-y-2">
            <p className="text-gray-600">
              Name: {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email || "N/A"}
            </p>
            <p className="text-gray-600">
              Email: {user.email || "N/A"}
            </p>
            <p className="text-gray-600">
              Phone: {user.phoneNumber || "N/A"}
            </p>
            <p className="text-gray-600">
              Member since: {getMemberSince()}
            </p>
          </div>
        )}
      </div>

      {/* Address Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-yellow-400/40 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Shipping Address</h2>
          {!isEditingAddress && (
            <button
              onClick={() => setIsEditingAddress(true)}
              className="text-yellow-600 hover:underline text-sm font-medium"
            >
              {hasAddress ? "Edit Address" : "Add Address"} {/* ✅ Dynamic button text */}
            </button>
          )}
        </div>
        {isEditingAddress ? (
          // ✅ Address Edit Form
          <form className="space-y-4">
            {updateError && <p className="text-red-500 text-sm">{updateError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                name="address.address_line1"
                value={editForm.address.address_line1}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="123 Main St"
                disabled={updating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                name="address.address_line2"
                value={editForm.address.address_line2}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                placeholder="Apartment 4B"
                disabled={updating}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  name="address.postcode"
                  value={editForm.address.postcode}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={editForm.address.state}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="CA"
                  disabled={updating}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="address.country"
                value={editForm.address.country}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
                placeholder="United States"
                disabled={updating}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={updating || !editForm.address.postcode || !editForm.address.country}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Address"}
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
          </form>
        ) : (
          // ✅ Address View Mode
          <div className="space-y-2">
            {hasAddress ? (
              // ✅ Display saved address
              <div className="text-gray-600">
                <p><strong>Address Line 1:</strong> {user.address.address_line1 || "N/A"}</p>
                <p><strong>Address Line 2:</strong> {user.address.address_line2 || "N/A"}</p>
                <p><strong>Postcode:</strong> {user.address.postcode || "N/A"}</p>
                <p><strong>State:</strong> {user.address.state || "N/A"}</p>
                <p><strong>Country:</strong> {user.address.country || "N/A"}</p>
              </div>
            ) : (
              // ✅ No address saved
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No shipping address saved.</p>
                <p className="text-sm text-gray-400">Add an address to streamline your checkout.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders - Still dummy;*/}
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
              <tr
                key={o.id}
                className="border-b border-gray-100 hover:bg-yellow-50"
              >
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

      {/* Wishlist Summary - Dynamic from context */}
      <div className="bg-white rounded-xl shadow p-6 border border-yellow-400/40">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Wishlist</h2>
        <p className="text-gray-600">
          You have <b>{wishlist.length}</b> items saved for later. {/* ✅ Dynamic count from context */}
          {wishlist.length > 0 && (
            <button
              onClick={() => navigate("/wishlist")}
              className="ml-2 text-yellow-600 hover:underline"
            >
              View Wishlist
            </button>
          )}
        </p>
      </div>
    </div>
  );
}