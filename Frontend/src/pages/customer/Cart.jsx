import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";
import PromotionCodeInput from "../../components/PromotionCodeInput";

export default function Cart() {
  const { 
    cart, 
    removeFromCart, 
    updateQty, 
    user, 
    isLoading, 
    appliedPromotion, 
    setAppliedPromotion 
  } = useStore();
  const [cartData, setCartData] = useState({ items: [], total_amount: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [removingItems, setRemovingItems] = useState(new Set());

  // Handle different cart data structures (local vs backend)
  useEffect(() => {
    // Don't process cart if it's still null (not hydrated yet)
    if (cart === null) {
      return;
    }
    
    if (user?.token && cart?.items && Array.isArray(cart.items)) {
      // Backend cart structure with proper data - filter out items being removed
      const filteredCart = {
        ...cart,
        items: cart.items.filter(item => !removingItems.has(item.cart_item_id))
      };
      setCartData(filteredCart);
    } else if (Array.isArray(cart)) {
      // Array structure (local cart or fallback)
      setCartData({
        items: cart,
        total_amount: cart.reduce((sum, item) => {
          const price = item.price || item.min_price;
          const validPrice = price && !isNaN(price) ? Number(price) : 0;
          const qty = item.qty || item.quantity || 1;
          return sum + (validPrice * qty);
        }, 0)
      });
    } else {
      // Empty cart or invalid structure fallback
      setCartData({ items: [], total_amount: 0 });
    }
  }, [cart, user, removingItems]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    setLoading(true);
    try {
      // For logged-in users, we MUST have cart_item_id for backend updates
      // For guests, we can use product IDs for local cart updates
      if (user?.token) {
        // Backend cart - ONLY use cart_item_id
        if (!item.cart_item_id) {
          setMessage({ 
            type: 'error', 
            text: 'This item needs to be re-added to update quantities. Please remove and add it again.' 
          });
          return;
        }
        await updateQty(item.cart_item_id, newQty);
      } else {
        // Guest cart - use product identifiers for local updates
        const itemId = item.id || item.product_id || item.product_item_id;
        if (!itemId) {
          throw new Error('No valid item ID found for guest cart');
        }
        await updateQty(itemId, newQty);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update quantity. Please try refreshing the page.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionApplied = (promotionData) => {
    setAppliedPromotion(promotionData);
  };

  const handlePromotionRemoved = () => {
    setAppliedPromotion(null);
  };

  const handleRemoveItem = async (item) => {
    setLoading(true);
    
    // Add item to removing set for immediate UI feedback
    setRemovingItems(prev => new Set(prev).add(item.cart_item_id));
    
    try {
      // For logged-in users, we MUST have cart_item_id for backend removal
      // For guests, we can use product IDs for local cart removal
      if (user?.token) {
        // Backend cart - ONLY use cart_item_id
        if (!item.cart_item_id) {
          // For items without cart_item_id, remove from localStorage manually
          console.log('Removing stale item from localStorage');
          const savedUserCart = JSON.parse(localStorage.getItem('userCart') || '{"items": [], "total_amount": 0}');
          savedUserCart.items = savedUserCart.items.filter(localItem => 
            localItem.product_id !== item.product_id
          );
          localStorage.setItem('userCart', JSON.stringify(savedUserCart));
          
          // Update the current cart state
          setCartData(prev => ({
            ...prev,
            items: prev.items.filter(localItem => localItem.product_id !== item.product_id)
          }));
          
          setMessage({ 
            type: 'success', 
            text: 'Item removed successfully.' 
          });
          return;
        }
        
        // Call the remove function and let it handle the backend sync
        await removeFromCart(item.cart_item_id);
        
        // Success message
        setMessage({ 
          type: 'success', 
          text: 'Item removed successfully.' 
        });
      } else {
        // Guest cart - use product identifiers for local removal
        const itemId = item.id || item.product_id || item.product_item_id;
        if (!itemId) {
          throw new Error('No valid item ID found for guest cart');
        }
        await removeFromCart(itemId);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      
      // If backend removal failed and we had optimistically updated, we should revert
      // For now, let the next cart refresh handle the sync
      
      setMessage({ 
        type: 'error', 
        text: 'Failed to remove item. The item may still appear until you refresh.' 
      });
    } finally {
      setLoading(false);
      // Remove from removing set after operation completes
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.cart_item_id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">Loading cart...</div>
      </div>
    );
  }

  const clearAllCartData = () => {
    localStorage.removeItem('userCart');
    localStorage.removeItem('cart');
    setCartData({ items: [], total_amount: 0 });
    setMessage({ type: 'success', text: 'Cart cleared successfully! You can now add items fresh.' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-gold">My Cart</h1>
        {cartData.items.length > 0 && (
          <button
            onClick={clearAllCartData}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
          >
            Clear Cart Data
          </button>
        )}
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
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
                  <td>${(() => {
                    const price = item.price || item.min_price;
                    return price && !isNaN(price) ? Number(price).toFixed(2) : '0.00';
                  })()}</td>
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
                  <td>${(() => {
                    const price = item.price || item.min_price;
                    const qty = item.qty || item.quantity || 1;
                    return price && !isNaN(price) ? (Number(price) * qty).toFixed(2) : '0.00';
                  })()}</td>
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

          {/* Promotion Code Section */}
          <PromotionCodeInput
            user={user}
            cartTotal={cartData.total_amount}
            cartItems={cartData.items.map(item => ({
              product_id: item.product_id || item.id,
              category_id: item.category_id || 1,
              price: item.price || item.min_price,
              quantity: item.qty || item.quantity || 1
            }))}
            onPromotionApplied={handlePromotionApplied}
            onPromotionRemoved={handlePromotionRemoved}
            appliedPromotion={appliedPromotion}
          />

          {/* Cart Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${cartData.total_amount && !isNaN(cartData.total_amount) ? Number(cartData.total_amount).toFixed(2) : '0.00'}</span>
              </div>
              
              {appliedPromotion && (
                <div className="flex justify-between text-green-600">
                  <span>Promotion Discount:</span>
                  <span>-${appliedPromotion.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between text-xl font-semibold text-gray-800">
                  <span>Total:</span>
                  <span>
                    ${appliedPromotion 
                      ? appliedPromotion.finalTotal.toFixed(2) 
                      : (cartData.total_amount && !isNaN(cartData.total_amount) ? Number(cartData.total_amount).toFixed(2) : '0.00')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div></div>
            {user?.token ? (
              <Link
                to="/checkout"
                className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 transition font-semibold shadow-lg"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 transition font-semibold shadow-lg border-2 border-gold-400"
              >
                Login to Checkout
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
