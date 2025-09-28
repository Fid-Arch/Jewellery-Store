import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart, updateQty, user, isLoading } = useStore();
  const [cartData, setCartData] = useState({ items: [], total_amount: 0 });
  const [loading, setLoading] = useState(false);

  // Handle different cart data structures (local vs backend)
  useEffect(() => {
    if (user?.token && Array.isArray(cart)) {
      // Backend cart structure
      setCartData({
        items: cart,
        total_amount: cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
      });
    } else if (!user?.token && Array.isArray(cart)) {
      // Local cart structure
      setCartData({
        items: cart,
        total_amount: cart.reduce((sum, item) => sum + (item.price * (item.quantity || item.qty || 1)), 0)
      });
    } else if (cart && cart.items) {
      // Backend response structure
      setCartData(cart);
    }
  }, [cart, user]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    setLoading(true);
    try {
      // Use the appropriate ID based on cart structure
      const itemId = item.product_item_id || item.id;
      await updateQty(itemId, newQty);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (item) => {
    setLoading(true);
    try {
      // Use the appropriate ID based on cart structure
      const itemId = item.product_item_id || item.id;
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">My Cart</h1>
      {cartData.items.length === 0 ? (
        <p className="text-gray-600 text-center py-20">Your cart is empty.</p>
      ) : (
        <>
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b border-gold/30 text-gray-700">
                <th className="py-3">Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartData.items.map((item) => (
                <tr key={item.cart_item_id || item.id} className="border-b border-gray-200">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      {item.product_image && (
                        <img 
                          src={item.product_image} 
                          alt={item.productname || item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.productname || item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">{item.sku || 'N/A'}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max={item.qty_in_stock || 999}
                      value={item.qty || item.quantity || 1}
                      onChange={(e) => handleQuantityChange(item, Number(e.target.value))}
                      disabled={loading}
                      className="w-16 border px-2 py-1 rounded disabled:opacity-50"
                    />
                    {item.qty_in_stock && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.qty_in_stock} available
                      </p>
                    )}
                  </td>
                  <td>${(Number(item.price) * (item.qty || item.quantity || 1)).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      disabled={loading}
                      className="text-gold hover:underline disabled:opacity-50"
                    >
                      {loading ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold text-gray-800">
              Subtotal: ${Number(cartData.total_amount).toFixed(2)}
            </p>
            <Link
              to="/checkout"
              className="bg-gold text-white px-6 py-3 rounded-md hover:bg-yellow-600 transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
