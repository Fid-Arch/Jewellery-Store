import React, { useState, useEffect } from 'react';
import { Star, User, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReviewList({ productId, onReviewsLoaded }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadReviews();
    loadAverageRating();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/reviews/products/${productId}/reviews`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.Message || 'Failed to load reviews');
      }

      // Ensure we always have an array
      const reviewsData = result.data;
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData);
        setTotalReviews(reviewsData.length);
      } else {
        console.warn('Reviews data is not an array:', reviewsData);
        setReviews([]);
        setTotalReviews(0);
      }
      
      if (onReviewsLoaded) {
        onReviewsLoaded(result.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAverageRating = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/products/${productId}/rating`);
      const result = await response.json();

      if (response.ok && result.data) {
        setAverageRating(result.data.averageRating || 0);
      }
    } catch (err) {
      console.error('Failed to load average rating:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StarDisplay = ({ rating, size = 16 }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const RatingBreakdown = () => {
    if (totalReviews === 0) return null;

    const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: Array.isArray(reviews) ? reviews.filter(review => review.rating === rating).length : 0
    }));

    return (
      <div className="space-y-2">
        {ratingCounts.map(({ rating, count }) => (
          <div key={rating} className="flex items-center space-x-2 text-sm">
            <span className="w-8 text-gray-600">{rating}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{
                  width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%'
                }}
              />
            </div>
            <span className="w-8 text-gray-600 text-right">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gold/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-red/20">
        <p className="text-red-600">Error loading reviews: {error}</p>
      </div>
    );
  }

  const displayedReviews = showAll 
    ? (Array.isArray(reviews) ? reviews : []) 
    : (Array.isArray(reviews) ? reviews.slice(0, 3) : []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gold/20">
      {/* Reviews Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Customer Reviews
          </h3>
          {totalReviews > 0 ? (
            <div className="flex items-center space-x-3">
              <StarDisplay rating={Math.round(averageRating)} size={20} />
              <span className="text-lg font-medium text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <p className="text-gray-600">No reviews yet</p>
          )}
        </div>
      </div>

      {/* Rating Breakdown */}
      {totalReviews > 0 && (
        <div className="mb-6">
          <RatingBreakdown />
        </div>
      )}

      {/* Reviews List */}
      {totalReviews > 0 ? (
        <div className="space-y-6">
          {displayedReviews.map((review) => (
            <div key={review.review_id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-gold-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {review.first_name} {review.last_name?.charAt(0)}.
                    </h4>
                    {review.verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <StarDisplay rating={review.rating} />
                    <span className="text-sm text-gray-500">
                      {formatDate(review.review_date)}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Show More/Less Button */}
          {Array.isArray(reviews) && reviews.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 text-gold-600 hover:text-gold-500 font-medium flex items-center justify-center space-x-1 border-t border-gray-200"
            >
              <span>
                {showAll ? 'Show Less' : `Show All ${totalReviews} Reviews`}
              </span>
              {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
}