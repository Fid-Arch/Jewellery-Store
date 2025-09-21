import React from "react";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart, updateQty } = useStore();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-serif text-gold mb-6">My Cart</h1>
      {cart.length === 0 ? (
        <p className="text-gray-600 text-center py-20">Your cart is empty.</p>
      ) : (
        <>
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="border-b border-gold/30 text-gray-700">
                <th className="py-3">Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4">{item.name}</td>
                  <td>${item.price}</td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateQty(item.id, Number(e.target.value))
                      }
                      className="w-16 border px-2 py-1 rounded"
                    />
                  </td>
                  <td>${(item.price * item.qty).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gold hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold text-gray-800">
              Subtotal: ${subtotal.toFixed(2)}
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
