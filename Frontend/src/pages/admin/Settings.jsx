import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout";

function Settings() {
  const [form, setForm] = useState({
    storeName: "Goldmarks Luxury",
    logo: "",
    theme: "gold",
    email: "support@goldmarks.com",
    phone: "+61 400 000 000",
    address: "123 Luxury St, Sydney, Australia",
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0].name : value,
    });
  };

  // Save settings (later connect to backend)
  const saveSettings = () => {
    alert("✅ Settings saved successfully!");
    console.log("Updated Settings:", form);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Settings
      </h1>

      {/* Form */}
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        {/* Store Name */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Store Name
          </label>
          <input
            type="text"
            name="storeName"
            value={form.storeName}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">Logo</label>
          <input
            type="file"
            name="logo"
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />
          {form.logo && (
            <p className="mt-2 text-sm text-gray-500">Current: {form.logo}</p>
          )}
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Theme
          </label>
          <select
            name="theme"
            value={form.theme}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="gold">Gold (Luxury)</option>
            <option value="black">Black & White (Minimal)</option>
            <option value="blue">Blue (Professional)</option>
          </select>
        </div>

        {/* Contact Info */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Support Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows="3"
            className="w-full border rounded-lg px-4 py-2"
          ></textarea>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-semibold py-3 rounded-xl hover:scale-105 transition"
        >
          Save Settings
        </button>
      </div>
    </AdminLayout>
  );
}

export default Settings;
