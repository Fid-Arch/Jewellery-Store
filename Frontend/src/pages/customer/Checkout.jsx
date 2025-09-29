import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { getUserShippingAddresses, addShippingAddress } from "../../utils/addressAPI";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, CreditCard, Package, Truck } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../../components/PaymentForm";

// Initialize Stripe outside component to prevent re-initialization
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('VITE_STRIPE_PUBLISHABLE_KEY not found in environment variables');
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default function Checkout() {
  const { user, cart, clearCart, appliedPromotion } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    postcode: '',
    states: '',
    country: 'Australia',
    is_default: false
  });

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);

  // Shipping methods with prices and delivery times (matching database IDs)
  const shippingMethods = [
    {
      id: 1,
      key: 'standard',
      name: 'Standard Shipping',
      description: 'Free shipping on orders over $100',
      price: 0,
      estimatedDays: '5-7 business days',
      icon: '📦'
    },
    {
      id: 2,
      key: 'express',
      name: 'Express Shipping',
      description: 'Fast delivery',
      price: 15.00,
      estimatedDays: '2-3 business days',
      icon: '🚚'
    },
    {
      id: 3,
      key: 'overnight',
      name: 'Overnight Express',
      description: 'Next business day delivery',
      price: 35.00,
      estimatedDays: '1 business day',
      icon: '⚡'
    }
  ];

  // Australian states
  const australianStates = [
    'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'
  ];

  useEffect(() => {
    // Check if user is logged in and cart has items
    const hasCartItems = cart && (
      (Array.isArray(cart) && cart.length > 0) || 
      (cart.items && Array.isArray(cart.items) && cart.items.length > 0)
    );
    
    if (!user || !hasCartItems) {
      navigate('/cart');
      return;
    }
    loadAddresses();
  }, [user, cart, navigate]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await getUserShippingAddresses();
      const userAddresses = response.data?.addresses || [];
      setAddresses(userAddresses);
      
      // Auto-select default address if available
      const defaultAddress = userAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setMessage({ type: 'error', text: 'Failed to load addresses' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePaymentSuccess = (paymentMethodData) => {
    setPaymentMethod(paymentMethodData);
    setMessage({ type: 'success', text: 'Payment method validated successfully! You can now review your order.' });
    // Don't auto-advance to step 3, let user click "Review Order" button
  };

  const handlePaymentError = (error) => {
    setMessage({ type: 'error', text: error.message || 'Payment validation failed' });
    setLoading(false);
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await addShippingAddress(addressForm);
      setMessage({ type: 'success', text: 'Address added successfully!' });
      
      // Add the new address to the list and select it
      const newAddress = response.data;
      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddress(newAddress);
      
      // Reset form and close
      setAddressForm({
        address_line1: '',
        address_line2: '',
        postcode: '',
        states: '',
        country: 'Australia',
        is_default: false
      });
      setShowAddAddressForm(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    
    if (Array.isArray(cart) && cart.length > 0) {
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    if (cart.items && Array.isArray(cart.items) && cart.items.length > 0) {
      return cart.items.reduce((total, item) => total + (item.price * item.qty), 0);
    }
    
    return cart.total_amount || 0;
  };

  const calculateShippingCost = () => {
    if (!selectedShippingMethod) return 0;
    
    const subtotal = calculateSubtotal();
    // Free standard shipping on orders over $100
    if (selectedShippingMethod.key === 'standard' && subtotal >= 100) {
      return 0;
    }
    
    return selectedShippingMethod.price || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShippingCost();
    const promotionDiscount = appliedPromotion ? appliedPromotion.discount : 0;
    return Math.max(0, subtotal + shipping - promotionDiscount);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setMessage({ type: 'error', text: 'Please select a shipping address' });
      return;
    }

    if (!selectedShippingMethod) {
      setMessage({ type: 'error', text: 'Please select a shipping method' });
      return;
    }

    if (!paymentMethod) {
      setMessage({ type: 'error', text: 'Please complete payment information' });
      return;
    }

    try {
      setLoading(true);
      
      // First, create a payment intent on the backend
      const paymentIntentResponse = await fetch('http://localhost:3000/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: Math.round(calculateTotal() * 100), // Convert to cents
          currency: 'aud',
          payment_method_id: paymentMethod.id,
          shipping_address_id: selectedAddress.address_id,
          shipping_method: selectedShippingMethod.id,
          shipping_cost: calculateShippingCost(),
          subtotal: calculateSubtotal(),
          promotion_code: appliedPromotion?.code || null,
          promotion_discount: appliedPromotion?.discount || 0
        })
      });

      const paymentIntentResult = await paymentIntentResponse.json();
      
      if (!paymentIntentResponse.ok) {
        throw new Error(paymentIntentResult.Message || 'Failed to create payment intent');
      }

      // Create order with payment intent
      const orderData = {
        shipping_address_id: selectedAddress.address_id,
        shipping_method_id: selectedShippingMethod.id,
        shipping_method_name: selectedShippingMethod.name,
        shipping_cost: calculateShippingCost(),
        subtotal: calculateSubtotal(),
        total_amount: calculateTotal(),
        payment_method: 'stripe',
        payment_intent_id: paymentIntentResult.payment_intent_id,
        promotion_code: appliedPromotion?.code || null,
        promotion_discount: appliedPromotion?.discount || 0,
        stripe_payment_method_id: paymentMethod.id
      };

      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.Message || 'Failed to place order');
      }

      // Clear cart and redirect
      clearCart();
      setMessage({ type: 'success', text: 'Order placed successfully!' });
      
      // Redirect to order confirmation or orders page
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Check if cart has items for rendering
  const hasCartItems = cart && (
    (Array.isArray(cart) && cart.length > 0) || 
    (cart.items && Array.isArray(cart.items) && cart.items.length > 0)
  );

  if (!user || !hasCartItems) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-serif text-gold mb-6">Your cart is empty</h1>
        <button 
          onClick={() => navigate('/jewellery')}
          className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-gold-400 transition-all"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-8">Checkout</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center ${step >= 1 ? 'text-gold' : 'text-gray-400'}`}>
            <MapPin className="h-5 w-5 mr-1" />
            <span className="font-medium text-sm">Address</span>
          </div>
          <div className="w-6 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-gold' : 'text-gray-400'}`}>
            <Truck className="h-5 w-5 mr-1" />
            <span className="font-medium text-sm">Shipping</span>
          </div>
          <div className="w-6 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-gold' : 'text-gray-400'}`}>
            <CreditCard className="h-5 w-5 mr-1" />
            <span className="font-medium text-sm">Payment</span>
          </div>
          <div className="w-6 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 4 ? 'text-gold' : 'text-gray-400'}`}>
            <Package className="h-5 w-5 mr-1" />
            <span className="font-medium text-sm">Review</span>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
          'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gold" />
                Shipping Address
              </h2>

              {/* Existing Addresses */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Select an Address</h3>
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.address_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedAddress?.address_id === address.address_id
                            ? 'border-gold bg-amber-50'
                            : 'border-gray-200 hover:border-gold/50'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            {address.is_default && (
                              <span className="inline-block bg-amber-600 text-white text-xs px-2 py-1 rounded-full mb-2">
                                Default
                              </span>
                            )}
                            <p className="font-medium">{address.address_line1}</p>
                            {address.address_line2 && (
                              <p className="text-gray-600">{address.address_line2}</p>
                            )}
                            <p className="text-gray-600">
                              {address.states} {address.postcode}, {address.country}
                            </p>
                          </div>
                          <input
                            type="radio"
                            checked={selectedAddress?.address_id === address.address_id}
                            onChange={() => setSelectedAddress(address)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Address Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                  className="flex items-center text-gold hover:text-yellow-600 font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </button>
              </div>

              {/* Add New Address Form */}
              {showAddAddressForm && (
                <form onSubmit={handleAddNewAddress} className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-4">Add New Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        name="address_line1"
                        value={addressForm.address_line1}
                        onChange={handleAddressFormChange}
                        required
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        name="address_line2"
                        value={addressForm.address_line2}
                        onChange={handleAddressFormChange}
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <select
                        name="states"
                        value={addressForm.states}
                        onChange={handleAddressFormChange}
                        required
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
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
                        className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressFormChange}
                      className="mr-2"
                    />
                    <label className="text-sm">Set as default address</label>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gold-500 text-white px-4 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Adding...' : 'Add Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm(false)}
                      className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Next Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!selectedAddress}
                className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {/* Step 2: Shipping Method */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-gold" />
                Choose Shipping Method
              </h2>

              <div className="grid gap-4">
                {shippingMethods.map((method) => {
                  const subtotal = calculateSubtotal();
                  const isStandardFree = method.key === 'standard' && subtotal >= 100;
                  const displayPrice = isStandardFree ? 0 : method.price;

                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedShippingMethod(method)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedShippingMethod?.id === method.id
                          ? 'border-gold-500 bg-gold-50'
                          : 'border-gray-200 hover:border-gold-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                            <p className="text-sm text-gray-600">{method.description}</p>
                            <p className="text-sm text-gray-500">{method.estimatedDays}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {displayPrice === 0 ? 'FREE' : `$${displayPrice.toFixed(2)}`}
                          </p>
                          {isStandardFree && method.key === 'standard' && (
                            <p className="text-xs text-green-600">Free on orders $100+</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedShippingMethod}
                  className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-gold" />
                Payment Information
              </h2>

              {getStripe() ? (
                <Elements stripe={getStripe()}>
                  <PaymentForm 
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    loading={loading}
                    setLoading={setLoading}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600">Stripe configuration error. Please check environment variables.</p>
                </div>
              )}

              {/* Payment Method Status */}
              {paymentMethod && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-700">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">
                      Payment method validated - {paymentMethod.card.brand.toUpperCase()} ending in {paymentMethod.card.last4}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!paymentMethod}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    paymentMethod 
                      ? 'bg-gold-500 text-white hover:bg-gold-400 shadow-md' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2 text-gold" />
                Review & Confirm
              </h2>

              {/* Shipping Address Review */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{selectedAddress?.address_line1}</p>
                  {selectedAddress?.address_line2 && (
                    <p>{selectedAddress.address_line2}</p>
                  )}
                  <p>{selectedAddress?.states} {selectedAddress?.postcode}, {selectedAddress?.country}</p>
                </div>
              </div>

              {/* Payment Method Review */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Payment Method</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {paymentMethod ? (
                    <>
                      <p className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {paymentMethod.card.brand.toUpperCase()} ending in **** {paymentMethod.card.last4}
                      </p>
                      <p className="text-sm text-gray-600">{paymentMethod.billing_details.name}</p>
                      <p className="text-sm text-green-600 mt-1">✓ Payment method verified</p>
                    </>
                  ) : (
                    <p className="text-gray-500">No payment method selected</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(3)}
                  className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30 sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            {(() => {
              const items = Array.isArray(cart) ? cart : (cart?.items || []);
              return items.map((item) => (
                <div key={item.product_item_id || item.cart_item_id} className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productname}</p>
                    <p className="text-gray-600 text-xs">Qty: {item.quantity || item.qty}</p>
                  </div>
                  <p className="font-medium">${((item.price * (item.quantity || item.qty)) || 0).toFixed(2)}</p>
                </div>
              ));
            })()}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              {appliedPromotion && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Promotion ({appliedPromotion.code}):</span>
                  <span>-${appliedPromotion.discount.toFixed(2)}</span>
                </div>
              )}
              
              {selectedShippingMethod && (
                <div className="flex justify-between items-center mb-2">
                  <span>Shipping ({selectedShippingMethod.name}):</span>
                  <span>
                    {calculateShippingCost() === 0 ? 'FREE' : `$${calculateShippingCost().toFixed(2)}`}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-gold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
