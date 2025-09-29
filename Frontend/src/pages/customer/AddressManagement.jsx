import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
    getUserShippingAddresses,
    addShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress
} from '../../utils/addressAPI';

export default function AddressManagement() {
    const { user } = useStore();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        address_line1: '',
        address_line2: '',
        postcode: '',
        states: '',
        country: 'Australia',
        is_default: false
    });

    // Australian states
    const australianStates = [
        'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'
    ];

    useEffect(() => {
        if (user?.token) {
            loadAddresses();
        }
    }, [user]);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const response = await getUserShippingAddresses();
            console.log('Address API Response:', response);
            setAddresses(response.data?.addresses || []);
        } catch (error) {
            console.error('Address loading error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to load addresses' });
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
            setLoading(true);

            if (editingAddress) {
                await updateShippingAddress(editingAddress.address_id, formData);
                setMessage({ type: 'success', text: 'Address updated successfully!' });
            } else {
                await addShippingAddress(formData);
                setMessage({ type: 'success', text: 'Address added successfully!' });
            }

            // Reset form and reload addresses
            setFormData({
                address_line1: '',
                address_line2: '',
                postcode: '',
                states: '',
                country: 'Australia',
                is_default: false
            });
            setShowAddForm(false);
            setEditingAddress(null);
            await loadAddresses();

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setFormData({
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            postcode: address.postcode || '',
            states: address.states || '',
            country: address.country || 'Australia',
            is_default: address.is_default || false
        });
        setShowAddForm(true);
    };

    const handleDelete = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            setLoading(true);
            await deleteShippingAddress(addressId);
            setMessage({ type: 'success', text: 'Address deleted successfully!' });
            await loadAddresses();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            setLoading(true);
            await setDefaultShippingAddress(addressId);
            setMessage({ type: 'success', text: 'Default address updated successfully!' });
            await loadAddresses();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const cancelForm = () => {
        setShowAddForm(false);
        setEditingAddress(null);
        setFormData({
            address_line1: '',
            address_line2: '',
            postcode: '',
            states: '',
            country: 'Australia',
            is_default: false
        });
    };

    if (!user?.token) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to manage your addresses.</p>
                </div>
            </div>
        );
    }

    if (loading && addresses.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center">Loading addresses...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Add New Address
                    </button>
                )}
            </div>

            {/* Message Display */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                    message.type === 'error' 
                        ? 'bg-red-50 border border-red-200 text-red-700' 
                        : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address Line 1 *
                            </label>
                            <input
                                type="text"
                                name="address_line1"
                                value={formData.address_line1}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Street address, P.O. box, etc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address Line 2
                            </label>
                            <input
                                type="text"
                                name="address_line2"
                                value={formData.address_line2}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Apartment, suite, etc. (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Postcode *
                                </label>
                                <input
                                    type="text"
                                    name="postcode"
                                    value={formData.postcode}
                                    onChange={handleInputChange}
                                    required
                                    pattern="[0-9]{4}"
                                    maxLength="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="1234"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    State *
                                </label>
                                <select
                                    name="states"
                                    value={formData.states}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">Select State</option>
                                    {australianStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country *
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_default"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                                Set as default shipping address
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                            </button>
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Address List */}
            <div className="space-y-4">
                {!Array.isArray(addresses) || addresses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No addresses found. Add your first address above.</p>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <div
                            key={address.user_address_id}
                            className={`bg-white p-6 rounded-lg shadow-md border-2 ${
                                address.is_default ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    {address.is_default && (
                                        <span className="inline-block bg-amber-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                                            Default Address
                                        </span>
                                    )}
                                    <div className="text-gray-900">
                                        <p className="font-medium">{address.address_line1}</p>
                                        {address.address_line2 && (
                                            <p>{address.address_line2}</p>
                                        )}
                                        <p>{address.states} {address.postcode}</p>
                                        <p>{address.country}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.address_id)}
                                            disabled={loading}
                                            className="text-amber-600 hover:text-amber-700 text-sm font-medium disabled:opacity-50"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(address)}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.address_id)}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}