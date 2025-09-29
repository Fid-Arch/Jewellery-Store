import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { useStore } from "../context/StoreContext";
import { Star, Edit, Heart } from "lucide-react";
import ReviewForm from "../components/ReviewForm.jsx";
import ReviewList from "../components/ReviewList.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { getProduct } = useProducts();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist, user } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await getProduct(id);
        setProduct(productData);
      } catch (err) {
        console.error('Failed to load product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, getProduct]);

  useEffect(() => {
    if (user && id) {
      checkUserPurchaseStatus();
      checkUserReviewStatus();
    }
  }, [user, id]);

  const checkUserPurchaseStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3000/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const orders = result.data || [];
        
        // Check if user has purchased this product
        const hasPurchased = orders.some(order =>
          order.items && order.items.some(item => item.product_id === parseInt(id))
        );
        
        setUserHasPurchased(hasPurchased);
      }
    } catch (err) {
      console.error('Failed to check purchase status:', err);
    }
  };

  const checkUserReviewStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reviews/my-reviews`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const userReviews = result.data || [];
        
        // Check if user has already reviewed this product
        const hasReviewed = userReviews.some(review => review.product_id === parseInt(id));
        setUserHasReviewed(hasReviewed);
      }
    } catch (err) {
      console.error('Failed to check review status:', err);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setShowReviewForm(false);
    setUserHasReviewed(true);
    // Refresh the reviews list
    window.location.reload();
  };

  const handleReviewsLoaded = (reviewsData) => {
    if (Array.isArray(reviewsData)) {
      setReviews(reviewsData);
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(avgRating);
      }
    } else {
      setReviews([]);
      setAverageRating(0);
    }
  };

  // Local state to track wishlist status for immediate UI feedback
  const [localIsInWishlist, setLocalIsInWishlist] = useState(false);
  
  useEffect(() => {
    const isInList = wishlist?.some(item => {
      const itemId = item.product_id || item._id || item.id;
      const productId = product?.product_id || parseInt(id);
      return itemId === productId;
    });
    setLocalIsInWishlist(isInList);
  }, [wishlist, product, id]);
  
  // Use local state for immediate UI feedback
  const isInWishlist = localIsInWishlist;

  const handleWishlistToggle = async () => {
    const productId = product.product_id || parseInt(id);
    
    try {
      if (isInWishlist) {
        // Immediately update local state for instant feedback
        setLocalIsInWishlist(false);
        await removeFromWishlist(productId);
      } else {
        // Immediately update local state for instant feedback
        setLocalIsInWishlist(true);
        await addToWishlist(product);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      // Revert local state on error
      setLocalIsInWishlist(!isInWishlist);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        <p className="mt-2 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center text-red-600">
        <p>Error loading product: {error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">Product not found.</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Product Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Product Image */}
        <img
          src={product.product_image || product.image_url}
          alt={product.productname || product.name}
          className="w-full h-[26rem] object-cover rounded-xl shadow-lg border border-gold/20"
        />

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-serif font-bold mb-3 text-gray-900">
            {product.productname || product.name}
          </h1>
          
          {/* Rating Display */}
          {averageRating > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={`${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({Array.isArray(reviews) ? reviews.length : 0} review{(Array.isArray(reviews) ? reviews.length : 0) !== 1 ? 's' : ''})
              </span>
            </div>
          )}
          
          <p className="text-gray-600 mb-4">{product.description}</p>
          {product.category_name && (
            <p className="text-sm text-gray-500 mb-2">Category: {product.category_name}</p>
          )}
          <p className="text-2xl font-semibold text-gold-600 mb-6">
            ${product.price}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {/* Add to Cart */}
              <button
                onClick={() => addToCart(product, 1)}
                className="btn-primary flex-1 text-center"
              >
                Add to Cart
              </button>

              {/* Save to Wishlist */}
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 px-6 py-2 border-2 font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 ${
                  isInWishlist 
                    ? 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'border-gold-500 text-gold-600 hover:bg-gold-500 hover:text-black'
                }`}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                <span>{isInWishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
              </button>
            </div>

            {/* Write Review Button */}
            {user && userHasPurchased && !userHasReviewed && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition flex items-center justify-center space-x-2"
              >
                <Edit size={18} />
                <span>Write a Review</span>
              </button>
            )}

            {/* Review Status Messages */}
            {user && !userHasPurchased && (
              <p className="text-sm text-gray-500 text-center">
                Purchase this product to write a review
              </p>
            )}
            
            {user && userHasReviewed && (
              <p className="text-sm text-green-600 text-center">
                ✓ You have reviewed this product
              </p>
            )}
            
            {!user && (
              <p className="text-sm text-gray-500 text-center">
                Please log in to write a review
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full">
            <ReviewForm
              productId={id}
              onReviewSubmitted={handleReviewSubmitted}
              onClose={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div>
        <ReviewList
          productId={id}
          onReviewsLoaded={handleReviewsLoaded}
        />
      </div>
    </div>
  );
}
