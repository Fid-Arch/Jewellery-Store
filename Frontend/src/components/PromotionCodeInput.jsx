import React, { useState } from 'react';
import apiService from '../services/apiService';

const PromotionCodeInput = ({ 
  user, 
  cartTotal, 
  cartItems = [], 
  onPromotionApplied, 
  appliedPromotion = null,
  onPromotionRemoved 
}) => {
  const [promotionCode, setPromotionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleApplyPromotion = async (e) => {
    e.preventDefault();
    
    if (!promotionCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a promotion code.' });
      return;
    }

    if (!user?.token) {
      setMessage({ type: 'error', text: 'Please log in to apply promotions.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('User object:', user);
      console.log('User ID:', user?.user_id);
      
      const validation = {
        promotionCode: promotionCode.toUpperCase(),
        userId: user.id,
        cartTotal: cartTotal,
        cartItems: cartItems
      };
      
      console.log('Validation data being sent:', validation);

      // Use the configured API service to ensure proper base URL and headers
      const response = await apiService.promotion.validatePromotion(validation);
      const result = response;
      
      if (result.valid) {
        const promotionData = {
          code: promotionCode.toUpperCase(),
          discount: result.discountAmount,
          finalTotal: result.finalTotal,
          promotion: result.promotion
        };
        
        onPromotionApplied(promotionData);
        setMessage({ type: 'success', text: result.Message || 'Promotion applied successfully!' });
      } else {
        setMessage({ type: 'error', text: result.Message || 'Invalid promotion code.' });
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      setMessage({ type: 'error', text: 'Error applying promotion. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromotion = () => {
    onPromotionRemoved();
    setPromotionCode('');
    setMessage({ type: 'info', text: 'Promotion removed.' });
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Promotion Code</h3>
      
      {/* Message Display */}
      {message.text && (
        <div className={`mb-3 p-2 rounded text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {!appliedPromotion ? (
        <form onSubmit={handleApplyPromotion} className="flex gap-3">
          <input
            type="text"
            value={promotionCode}
            onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
            placeholder="Enter promotion code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold-500 focus:border-transparent uppercase"
            style={{ textTransform: 'uppercase' }}
            disabled={loading}
            maxLength={50}
          />
          <button
            type="submit"
            disabled={loading || !user?.token || !promotionCode.trim()}
            className="px-4 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
          <div>
            <span className="font-medium text-green-800">
              Code: {appliedPromotion.code}
            </span>
            <div className="text-sm text-green-600">
              Discount: ${appliedPromotion.discount.toFixed(2)}
            </div>
          </div>
          <button
            onClick={handleRemovePromotion}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      )}
      
      {!user?.token && (
        <p className="text-sm text-gray-500 mt-2">
          Please log in to apply promotion codes.
        </p>
      )}
    </div>
  );
};

export default PromotionCodeInput;