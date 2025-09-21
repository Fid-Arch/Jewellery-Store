import React from "react";

export default function OrderTracking() {
  const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];
  const currentStep = 2; // Example: "Shipped"

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">Order Tracking</h1>
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-gold"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
        {steps.map((step, idx) => (
          <div key={idx} className="relative text-center">
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                idx <= currentStep
                  ? "bg-gold text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {idx + 1}
            </div>
            <p className="mt-2 text-sm">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
