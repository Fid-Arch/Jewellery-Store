import React, { useState } from "react";
import AdminLayout from "../../components/admin/Layout"; // ✅ reuse luxury layout
import { CheckCircle, Clock } from "lucide-react";

// Sample reviews
const initialReviews = [
  {
    id: 1,
    product: "Diamond Necklace",
    user: "Alice Johnson",
    review: "Absolutely beautiful!",
    status: "Approved",
  },
  {
    id: 2,
    product: "Gold Ring",
    user: "Michael Lee",
    review: "A bit overpriced, but stunning.",
    status: "Pending",
  },
  {
    id: 3,
    product: "Luxury Watch",
    user: "Sarah Kim",
    review: "Worth every dollar.",
    status: "Approved",
  },
];

function StaffReviews() {
  const [reviews, setReviews] = useState(initialReviews);

  const updateReviewStatus = (id, newStatus) => {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent">
        Staff Reviews
      </h1>

      <div className="bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          💬 Product Reviews
        </h2>

        <table className="w-full text-left border-collapse">
          <thead className="bg-yellow-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Product
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                User
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Review
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-yellow-50 transition">
                <td className="px-6 py-4">{review.product}</td>
                <td className="px-6 py-4">{review.user}</td>
                <td className="px-6 py-4">{review.review}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      review.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {review.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button
                    onClick={() => updateReviewStatus(review.id, "Approved")}
                    className="text-green-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => updateReviewStatus(review.id, "Pending")}
                    className="text-yellow-600 hover:underline flex items-center gap-1"
                  >
                    <Clock size={16} /> Mark Pending
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default StaffReviews;
