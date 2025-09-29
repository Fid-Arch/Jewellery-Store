import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { getUserWishlist, removeFromWishlist, moveWishlistToCart } from "../../utils/wishlistAPI";

export default function Wishlist() {
  const { wishlist, user, addToCart, removeFromWishlist: removeFromLocalWishlist, isLoading: contextLoading } = useStore();
  const [backendWishlist, setBackendWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.token) {
      loadBackendWishlist();
    }
  }, [user]);

  const loadBackendWishlist = async () => {
    try {
      setLoading(true);
      const result = await getUserWishlist();
      setBackendWishlist(result.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (product) => {
    const productId = product.product_id || product.id;
    
    try {
      setActionLoading(prev => ({ ...prev, [`remove-${productId}`]: true }));
      
      if (user?.token) {
        // Remove from backend
        await removeFromWishlist(productId);
        setBackendWishlist(prev => prev.filter(item => 
          (item.product_id || item.id) !== productId
        ));
      } else {
        // Remove from local storage
        removeFromLocalWishlist(productId);
      }
    } catch (err) {
      alert('Error removing from wishlist: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove-${productId}`]: false }));
    }
  };

  const handleMoveToCart = async (product) => {
    const productId = product.product_id || product.id;
    
    try {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: true }));
      
      if (user?.token) {
        // Use backend API to move to cart
        await moveWishlistToCart(productId);
        setBackendWishlist(prev => prev.filter(item => 
          (item.product_id || item.id) !== productId
        ));
      } else {
        // Add to local cart and remove from wishlist
        addToCart(product, 1);
        removeFromLocalWishlist(productId);
      }
    } catch (err) {
      alert('Error moving to cart: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: false }));
    }
  };

  const WishlistItem = ({ product }) => {
    const productId = product.product_id || product.id;
    const productName = product.productname || product.name;
    const productImage = product.product_image || product.image_url;
    
    // Handle price from different sources
    let productPrice = product.price; // For guest wishlist items
    if (!productPrice && product.min_price) {
      // For backend wishlist items
      if (product.min_price === product.max_price) {
        productPrice = product.min_price;
      } else {
        productPrice = `${product.min_price} - ${product.max_price}`;
      }
    }

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gold/20 hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={productImage || '/placeholder-product.jpg'}
            alt={productName}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => navigate(`/product/${productId}`)}
          />
          <button
            onClick={() => handleRemoveFromWishlist(product)}
            disabled={actionLoading[`remove-${productId}`]}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Remove from wishlist"
          >
            {actionLoading[`remove-${productId}`] ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Heart className="w-5 h-5 text-red-500 fill-current" />
            )}
          </button>
        </div>
        
        <div className="p-4">
          <h3 
            className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-gold-600 transition-colors"
            onClick={() => navigate(`/product/${productId}`)}
          >
            {productName}
          </h3>
          
          <p className="text-xl font-bold text-gold-600 mb-4">
            {productPrice ? `$${productPrice}` : 'Price on request'}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleMoveToCart(product)}
              disabled={actionLoading[`cart-${productId}`]}
              className="flex-1 bg-gold-500 text-white px-4 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              {actionLoading[`cart-${productId}`] ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => handleRemoveFromWishlist(product)}
              disabled={actionLoading[`remove-${productId}`]}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Remove"
            >
              <Trash2 size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Determine which wishlist to show - ensure it's always an array with strict type checking
  const safeBackendWishlist = Array.isArray(backendWishlist) ? backendWishlist : [];
  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
  const displayWishlist = user?.token ? safeBackendWishlist : safeWishlist;
  
  const isWishlistEmpty = displayWishlist.length === 0;

  if (loading || contextLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-serif text-gold mb-6">My Wishlist</h1>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
              <div className="bg-gray-200 h-48 rounded mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-6 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-gold">My Wishlist</h1>
        {!isWishlistEmpty && (
          <p className="text-gray-600">
            {displayWishlist.length} item{displayWishlist.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {isWishlistEmpty ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Save items you love for later!</p>
          <button
            onClick={() => navigate('/jewellery')}
            className="bg-gold-500 text-white px-6 py-3 rounded-md hover:bg-gold-400 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayWishlist.map((product) => (
            <WishlistItem 
              key={product.product_id || product.id} 
              product={product} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
