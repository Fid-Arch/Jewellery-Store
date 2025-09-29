import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export default function ReviewForm({ productId, onReviewSubmitted, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const user = localStorage.getItem('user');
      if (!user) {
        throw new Error('Please log in to write a review');
      }

      const userData = JSON.parse(user);
      
      const response = await fetch(`http://localhost:3000/reviews/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.Message || 'Failed to submit review');
      }

      // Reset form
      setRating(0);
      setComment('');
      
      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(result.data);
      }
      
      // Close form
      if (onClose) {
        onClose();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ currentRating, onRatingChange, size = 24 }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRatingChange(star)}
          >
            <Star
              size={size}
              className={`transition-colors ${
                star <= (hoveredRating || currentRating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gold/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRating
            currentRating={rating}
            onRatingChange={setRating}
            size={32}
          />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            id="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters (minimum 10)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 bg-gold-500 text-white px-4 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}