import React, { useState, useEffect } from 'react';
import { Star, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserReviews({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserReviews();
    }
  }, [user]);

  const loadUserReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/reviews/my-reviews', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.Message || 'Failed to load reviews');
      }

      // Handle the nested API response structure
      const reviewsData = result.data?.reviews || result.data;
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
      } else {
        console.warn('Reviews data is not an array:', reviewsData);
        setReviews([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review.review_id);
    setEditForm({
      rating: review.rating,
      comment: review.comment
    });
  };

  const handleSaveEdit = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: editForm.rating,
          comment: editForm.comment
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.Message || 'Failed to update review');
      }

      // Update local state
      setReviews(prevReviews => 
        Array.isArray(prevReviews) 
          ? prevReviews.map(review => 
              review.review_id === reviewId 
                ? { ...review, rating: editForm.rating, comment: editForm.comment }
                : review
            )
          : []
      );

      setEditingReview(null);
      setEditForm({ rating: 0, comment: '' });
    } catch (err) {
      alert('Error updating review: ' + err.message);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.Message || 'Failed to delete review');
      }

      // Remove from local state
      setReviews(prevReviews => 
        Array.isArray(prevReviews) 
          ? prevReviews.filter(review => review.review_id !== reviewId)
          : []
      );
    } catch (err) {
      alert('Error deleting review: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StarRating = ({ rating, editable = false, onChange }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!editable}
            onClick={() => editable && onChange && onChange(star)}
            className={`${editable ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
          >
            <Star
              size={16}
              className={`${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gold/20">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Reviews</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gold/20">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Reviews</h2>
        <p className="text-red-600">Error loading reviews: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gold/20">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">My Reviews</h2>
      
      {!Array.isArray(reviews) || reviews.length === 0 ? (
        <p className="text-gray-600">
          You haven't written any reviews yet. Purchase products to start reviewing!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.review_id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 
                      className="font-medium text-gray-900 hover:text-gold-600 cursor-pointer"
                      onClick={() => navigate(`/product/${review.product_id}`)}
                    >
                      {review.productname}
                    </h3>
                    <button
                      onClick={() => navigate(`/product/${review.product_id}`)}
                      className="text-gold-600 hover:text-gold-500"
                      title="View Product"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                  
                  {editingReview === review.review_id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <StarRating
                          rating={editForm.rating}
                          editable={true}
                          onChange={(rating) => setEditForm({ ...editForm, rating })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Review
                        </label>
                        <textarea
                          value={editForm.comment}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(review.review_id)}
                          className="px-3 py-1 bg-gold-500 text-white rounded-md hover:bg-gold-400 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingReview(null);
                            setEditForm({ rating: 0, comment: '' });
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.review_date)}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  )}
                </div>

                {editingReview !== review.review_id && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-blue-600 hover:text-blue-500"
                      title="Edit Review"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(review.review_id)}
                      className="text-red-600 hover:text-red-500"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}