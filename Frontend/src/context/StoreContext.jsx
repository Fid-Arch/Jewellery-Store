import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserCart, addItemToCart, updateCartItem, removeCartItem, clearUserCart } from "../utils/cartAPI";
import { getUserWishlist, addToWishlist as addToWishlistAPI, removeFromWishlist as removeFromWishlistAPI } from "../utils/wishlistAPI";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  // Initialize states with a flag to prevent rendering before hydration
  const [cart, setCart] = useState(null); // null instead of [] to detect unhydrated state
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ New: Track hydration
  const [appliedPromotion, setAppliedPromotion] = useState(null);

  // ✅ Load from localStorage on mount (with loading)
  useEffect(() => {
    const loadInitialState = () => {
      console.log("Hydrating from localStorage...");
      try {
        // Load user
        const savedUser = localStorage.getItem("user");
        let parsedUser = null;
        if (savedUser) {
          parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log("User hydrated:", parsedUser);
        }

        // Load cart based on user login status
        if (parsedUser?.token) {
          // For logged-in users, try to load saved backend cart first
          const savedUserCart = localStorage.getItem("userCart");
          
          if (savedUserCart) {
            const parsedUserCart = JSON.parse(savedUserCart);
            setCart(parsedUserCart);
          } else {
            setCart({ items: [], total_amount: 0 }); // Initialize empty for logged-in users
          }
          // Backend cart will be loaded/synced in useEffect
        } else {
          // For guests, load local cart
          const savedCart = localStorage.getItem("cart");
          
          if (savedCart) {
            const parsedGuestCart = JSON.parse(savedCart);
            setCart(parsedGuestCart);
          } else {
            setCart([]); // Initialize empty array for guests
          }
        }

        // Load wishlist (if you have it)
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
          try {
            const parsed = JSON.parse(savedWishlist);
            setWishlist(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            console.error('Error parsing wishlist from localStorage:', e);
            setWishlist([]);
          }
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.error("Hydration error:", err);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
        localStorage.removeItem("wishlist");
      } finally {
        setIsLoading(false); // ✅ Done loading
      }
    };

    loadInitialState();
  }, []);

  // Save cart to localStorage automatically when it changes
  useEffect(() => {
    // Only save if cart is not null (hydrated) and not loading
    if (!isLoading && cart !== null) {
      // For logged-in users, save backend cart structure
      // For guests, save array structure
      if (user?.token) {
        // Save backend cart structure for logged-in users
        localStorage.setItem("userCart", JSON.stringify(cart));
      } else {
        // Save local cart for guests
        const cartToSave = Array.isArray(cart) ? cart : cart?.items || [];
        localStorage.setItem("cart", JSON.stringify(cartToSave));
      }
    }
  }, [cart, isLoading, user]);

  // Save to localStorage when wishlist changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoading]);

  // Save to localStorage when user changes
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user"); // Only remove if explicitly logged out
      }
    }
  }, [user, isLoading]);

  // Load cart from backend when user logs in
  const loadCartFromBackend = async () => {
    if (!user?.token) return;
    
    try {
      const backendCart = await getUserCart();
      console.log('Backend cart response:', backendCart);
      console.log('Backend cart items:', backendCart.data?.items);
      
      // If backend has cart items, use them and save to localStorage
      if (backendCart.data?.items && Array.isArray(backendCart.data.items) && backendCart.data.items.length > 0) {
        console.log('Using backend cart with', backendCart.data.items.length, 'items');
        setCart(backendCart.data);
        // Save to localStorage for persistence
        localStorage.setItem("userCart", JSON.stringify(backendCart.data));
      } else {
        console.log('Backend cart is empty');
        
        // Check if we have a saved cart from previous session
        const savedUserCart = localStorage.getItem("userCart");
        if (savedUserCart) {
          const parsedUserCart = JSON.parse(savedUserCart);
          
          // Only clear if the saved cart has items WITHOUT cart_item_ids (stale data)
          if (parsedUserCart.items?.length > 0) {
            const hasBackendIds = parsedUserCart.items.some(item => item.cart_item_id);
            if (!hasBackendIds) {
              console.log('Saved cart items missing backend IDs, clearing stale data...');
              localStorage.removeItem('userCart');
              setCart({ items: [], total_amount: 0 });
            } else {
              console.log('Using saved user cart with valid backend IDs');
              setCart(parsedUserCart);
            }
          } else {
            console.log('Using empty saved cart');
            setCart(parsedUserCart);
          }
        } else {
          console.log('No saved cart found, using empty cart');
          setCart({ items: [], total_amount: 0 });
        }
      }
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      // Keep local cart as fallback
    }
  };

  // Sync cart to backend when user is logged in
  useEffect(() => {
    if (user?.token && !isLoading) {
      loadCartFromBackend();
      
      // Set up periodic sync to prevent data loss
      const syncInterval = setInterval(() => {
        if (user?.token) {
          console.log('Periodic cart sync...');
          loadCartFromBackend();
        }
      }, 5 * 60 * 1000); // Sync every 5 minutes
      
      return () => clearInterval(syncInterval);
    }
  }, [user, isLoading]);

  // Add to cart
  const addToCart = async (product, qty = 1) => {
    try {
      
      if (user?.token) {
        // If user is logged in, use backend API
        let productItemId = product.product_item_id;
        
        // If we don't have product_item_id, try to get it from the product_id
        if (!productItemId && product.product_id) {
          try {
            // Fetch the default product_item_id for this product
            const response = await fetch(`http://localhost:3000/products/${product.product_id}/items`);
            if (response.ok) {
              const data = await response.json();
              // Get the first available product item
              if (data.data && data.data.length > 0) {
                productItemId = data.data[0].product_item_id;
              }
            }
          } catch (error) {
            console.error('Failed to fetch product items:', error);
          }
        }
        
        if (!productItemId) {
          throw new Error('Unable to find product variant for cart. Please try again or contact support.');
        }
        
        await addItemToCart({ product_item_id: productItemId, qty });
        // Reload cart from backend to get updated state
        await loadCartFromBackend();
      } else {
        // If user is not logged in, use local storage
        setCart((prev) => {
          // Ensure prev is an array for local cart
          const prevArray = Array.isArray(prev) ? prev : [];
          const productId = product.id || product.product_id;
          const existing = prevArray.find((item) => (item.id || item.product_id) === productId);
          if (existing) {
            return prevArray.map((item) =>
              (item.id || item.product_id) === productId
                ? { ...item, quantity: (item.quantity || item.qty || 0) + qty }
                : item
            );
          }
          return [...prevArray, { 
            ...product, 
            quantity: qty,
            id: productId,
            // Ensure we have the necessary fields for guest cart
            product_id: product.product_id || product.id,
            price: product.price || product.min_price,
            productname: product.productname || product.name
          }];
        });
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // Fallback to local storage
      setCart((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const existing = prevArray.find((item) => item.id === product.id);
        if (existing) {
          return prevArray.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + qty }
              : item
          );
        }
        return [...prevArray, { ...product, quantity: qty }];
      });
    }
  };

  // Update cart item quantity
  const updateQty = async (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      if (user?.token) {
        await updateCartItem(productId, { qty: newQty });
        await loadCartFromBackend();
      } else {
        setCart((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map((item) =>
            item.id === productId ? { ...item, quantity: newQty } : item
          );
        });
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      // Fallback to local update
      setCart((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map((item) =>
          item.id === productId ? { ...item, quantity: newQty } : item
        );
      });
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      if (user?.token) {
        await removeCartItem(productId);
        // Wait a moment for backend to process, then reload
        await new Promise(resolve => setTimeout(resolve, 300));
        await loadCartFromBackend();
      } else {
        setCart((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter((item) => item.id !== productId);
        });
      }
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      // Fallback to local removal
      setCart((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter((item) => item.id !== productId);
      });
    }
  };

  // Add to wishlist
  const addToWishlist = async (product) => {
    const productId = product.product_id || product.id;
    
    if (user?.token) {
      // For logged-in users, use backend API
      try {
        // Optimistically add to local state first
        setWishlist((prev) => {
          if (prev.find((item) => (item.product_id || item.id) === productId)) {
            return prev;
          }
          return [...prev, { ...product, product_id: productId }];
        });
        
        // Then call the API
        await addToWishlistAPI(productId);
        
        // Finally sync with backend to get the correct data structure
        await loadUserWishlist();
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        // Remove the optimistic update on error
        setWishlist((prev) => prev.filter((item) => (item.product_id || item.id) !== productId));
        throw error;
      }
    } else {
      // For guests, use local storage
      setWishlist((prev) => {
        if (prev.find((item) => (item.id || item.product_id) === productId)) {
          return prev;
        }
        const newWishlist = [...prev, product];
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        return newWishlist;
      });
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (id) => {
    if (user?.token) {
      // For logged-in users, use backend API
      try {
        // Optimistically remove from local state first
        const originalWishlist = [...wishlist];
        setWishlist((prev) => prev.filter((item) => (item.product_id || item.id) !== id));
        
        // Then call the API
        await removeFromWishlistAPI(id);
        
        // Finally sync with backend
        await loadUserWishlist();
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        // Restore the original wishlist on error
        setWishlist(originalWishlist);
        throw error;
      }
    } else {
      // For guests, use local storage
      setWishlist((prev) => {
        const newWishlist = prev.filter((item) => (item.id || item.product_id) !== id);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        return newWishlist;
      });
    }
  };

  // Load user wishlist from backend
  const loadUserWishlist = async () => {
    if (!user?.token) return;
    
    try {
      const result = await getUserWishlist();
      const wishlistData = result?.data?.items || [];
      setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]); // Fallback to empty array on error
    }
  };

  // Migrate local cart to backend when user logs in
  const migrateLocalCartToBackend = async (localCart) => {
    if (!localCart.length) return;
    
    try {
      for (const item of localCart) {
        await addItemToCart({ 
          product_item_id: item.product_item_id || item.id, 
          qty: item.quantity || item.qty || 1 
        });
      }
      // Clear local cart after successful migration
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Failed to migrate local cart to backend:', error);
    }
  };

  // Login (sets user and saves)
  const login = async (userData) => {
    const localCart = [...cart]; // Save current local cart
    const localWishlist = [...wishlist]; // Save current local wishlist
    setUser(userData);
    
    // If user has items in local cart, migrate them to backend
    if (localCart.length > 0) {
      await migrateLocalCartToBackend(localCart);
      // Reload cart from backend to include migrated items
      setTimeout(() => loadCartFromBackend(), 500);
    }
    
    // Load user's wishlist from backend
    setTimeout(() => loadUserWishlist(), 500);
    
    // TODO: Optionally migrate local wishlist items to backend
    // This would require additional backend endpoint to handle bulk additions
  };

  const clearCart = async () => {
    try {
      if (user?.token) {
        // If user is logged in, clear backend cart
        await clearUserCart();
      }
      // Clear local cart in all cases
      setCart([]);
      localStorage.removeItem("cart");
      localStorage.removeItem("userCart");
      console.log('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // Still clear local cart even if backend clear fails
      setCart([]);
      localStorage.removeItem("cart");
      localStorage.removeItem("userCart");
    }
  };

  // Logout (clears and removes)
  const logout = () => {
    setUser(null);
    setCart([]); // Optional: Clear cart/wishlist on logout
    setWishlist([]);
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    localStorage.removeItem("userCart"); // Clear saved backend cart
    localStorage.removeItem("wishlist");
    console.log('User logged out, cart cleared');
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        user,
        isLoading,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        login,
        logout,
        appliedPromotion,
        setAppliedPromotion,
        cartCount: cart === null 
          ? 0 // Return 0 if cart not hydrated yet
          : Array.isArray(cart) 
            ? cart.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
            : (cart?.items || []).reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0),
        wishlistCount: Array.isArray(wishlist) ? wishlist.length : 0,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// Hook for easy use
export const useStore = () => useContext(StoreContext);

// ✅ Export both default + named
export { StoreContext };
export default StoreProvider;
