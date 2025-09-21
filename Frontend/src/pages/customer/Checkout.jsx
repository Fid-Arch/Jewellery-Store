import React, { useState } from "react";

export default function Checkout() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">Checkout</h1>
      <div className="bg-white rounded-xl shadow-md p-6 border border-gold/30">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Shipping Info</h2>
            <input
              className="w-full border px-3 py-3 rounded-md mb-3"
              placeholder="Address"
            />
            <input
              className="w-full border px-3 py-3 rounded-md mb-3"
              placeholder="City"
            />
            <button
              onClick={() => setStep(2)}
              className="bg-gold text-white px-6 py-3 rounded-md hover:bg-yellow-600"
            >
              Next
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Info</h2>
            <input
              className="w-full border px-3 py-3 rounded-md mb-3"
              placeholder="Card Number"
            />
            <button
              onClick={() => setStep(3)}
              className="bg-gold text-white px-6 py-3 rounded-md hover:bg-yellow-600"
            >
              Next
            </button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review & Confirm</h2>
            <p className="text-gray-600 mb-4">Your order looks great!</p>
            <button className="bg-gold text-white px-6 py-3 rounded-md hover:bg-yellow-600">
              Place Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
