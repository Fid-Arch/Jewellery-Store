import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
};

export default function PaymentForm({ onPaymentSuccess, onPaymentError, loading, setLoading }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [nameOnCard, setNameOnCard] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setCardError(null);

    const card = elements.getElement(CardElement);

    if (!nameOnCard.trim()) {
      setCardError('Please enter the name on card');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: {
          name: nameOnCard,
        },
      });

      if (error) {
        setCardError(error.message);
        setLoading(false);
        return;
      }

      // Call the success callback with payment method
      onPaymentSuccess(paymentMethod);

    } catch (err) {
      setCardError('An unexpected error occurred');
      onPaymentError(err);
      setLoading(false);
    }
  };

  const handleCardChange = (event) => {
    if (event.error) {
      setCardError(event.error.message);
      setCardComplete(false);
    } else {
      setCardError(null);
      setCardComplete(event.complete);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name on Card */}
      <div>
        <label className="block text-sm font-medium mb-2">Name on Card *</label>
        <input
          type="text"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          placeholder="John Doe"
          required
          className="w-full border border-gray-300 px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
      </div>

      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium mb-2">Card Details *</label>
        <div className="border border-gray-300 px-3 py-3 rounded-md focus-within:ring-2 focus-within:ring-gold focus-within:border-transparent">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className="mt-2 text-sm text-red-600">
            {cardError}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="flex items-center text-sm text-gray-600">
        <Lock className="h-4 w-4 mr-2" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      {/* Validate Payment Button */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || !nameOnCard.trim() || loading}
        className="w-full bg-gold-500 text-white py-3 px-4 rounded-md hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
      >
        {loading ? 'Validating Payment...' : 'Validate Payment Method'}
      </button>

      {/* Stripe Branding */}
      <div className="text-xs text-gray-500 text-center">
        Powered by <span className="font-semibold">Stripe</span>
      </div>
    </form>
  );
}