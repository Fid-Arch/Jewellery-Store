import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function ProductCard({ product }) {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist, user } = useStore();
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  
  // Local state to track wishlist status for immediate UI feedback
  const [localIsInWishlist, setLocalIsInWishlist] = useState(false);
  
  // Use local state for immediate UI feedback
  const isInWishlist = localIsInWishlist;
  
  useEffect(() => {
    const isInList = wishlist?.some(item => {
      const itemId = item.product_id || item._id || item.id;
      const productId = product.product_id || product.id;
      return itemId === productId;
    });
    setLocalIsInWishlist(isInList);
  }, [wishlist, product]);

  const handleWishlistToggle = async () => {
    const productId = product.product_id || product.id;
    
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

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch(`http://localhost:3000/reviews/products/${product.product_id || product.id}/rating`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setAverageRating(result.data.averageRating || 0);
            setReviewCount(result.data.reviewCount || 0);
          }
        }
      } catch (err) {
        // Silently fail - rating display is optional
      }
    };

    if (product.product_id || product.id) {
      fetchRating();
    }
  }, [product.product_id, product.id]);

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition group overflow-hidden">
      {/* Product Image + Badges + Shine */}
      <div
        className={`overflow-hidden relative ${
          product.premium ? "premium-shine" : ""
        }`}
      >
        {/* Premium Badge (Gold, Left) */}
        {product.premium && (
          <span className="badge-premium absolute top-3 left-3">
            ✨ Exclusive
          </span>
        )}

        {/* New Arrival Badge (Silver, Right) */}
        {product.new && (
          <span className="badge-new absolute top-3 right-3">🆕 New</span>
        )}

        {/* Product Image */}
        <img
          src={product.product_image || product.image_url || '/placeholder-product.jpg'}
          alt={product.productname || product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image';
          }}
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-lg text-gray-800">
          {product.productname || product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          {product.category_name || product.category}
        </p>

        {/* Rating Display */}
        {averageRating > 0 && (
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={`${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {averageRating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}

        <p className="text-gray-600 mb-4">
          {product.price ? `$${product.price}` : 
           product.min_price ? 
             (product.min_price === product.max_price ? 
               `$${product.min_price}` : 
               `$${product.min_price} - $${product.max_price}`) :
             'Price on request'}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/product/${product.product_id || product.id}`}
            className="bg-gold text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
          >
            View
          </Link>
          <button
            onClick={() => addToCart(product, 1)}
            className="flex items-center gap-1 px-3 py-2 border border-gold rounded-md hover:bg-gold hover:text-white transition"
          >
            <ShoppingCart className="h-5 w-5" /> Add
          </button>
          <button
            onClick={handleWishlistToggle}
            className={`flex items-center gap-1 px-3 py-2 border rounded-md transition ${
              isInWishlist 
                ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100' 
                : 'border-gray-300 hover:bg-gold hover:text-white'
            }`}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            {isInWishlist ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
