import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserCart, addItemToCart, updateCartItem, removeCartItem, clearUserCart } from "../utils/cartAPI";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ New: Track hydration

  // ✅ Load from localStorage on mount (with loading)
  useEffect(() => {
    const loadInitialState = () => {
      console.log("Hydrating from localStorage...");
      try {
        // Load user
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          console.log("User hydrated:", parsedUser);
        }

        // Load cart (if you have it)
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }

        // Load wishlist (if you have it)
        const savedWishlist = localStorage.getItem("wishlist");
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
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

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!isLoading) { // Avoid saving during hydration
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isLoading]);

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
      setCart(backendCart.data?.items || []);
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      // Keep local cart as fallback
    }
  };

  // Sync cart to backend when user is logged in
  useEffect(() => {
    if (user?.token && !isLoading) {
      loadCartFromBackend();
    }
  }, [user, isLoading]);

  // Add to cart
  const addToCart = async (product, qty = 1) => {
    try {
      if (user?.token) {
        // If user is logged in, use backend API
        await addItemToCart({ product_item_id: product.product_item_id, qty });
        // Reload cart from backend to get updated state
        await loadCartFromBackend();
      } else {
        // If user is not logged in, use local storage
        setCart((prev) => {
          const existing = prev.find((item) => item.id === product.id);
          if (existing) {
            return prev.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + qty }
                : item
            );
          }
          return [...prev, { ...product, quantity: qty }];
        });
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // Fallback to local storage
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + qty }
              : item
          );
        }
        return [...prev, { ...product, quantity: qty }];
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
        setCart((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, quantity: newQty } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      // Fallback to local update
      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      if (user?.token) {
        await removeCartItem(productId);
        await loadCartFromBackend();
      } else {
        setCart((prev) => prev.filter((item) => item.id !== productId));
      }
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      // Fallback to local removal
      setCart((prev) => prev.filter((item) => item.id !== productId));
    }
  };

  // Add to wishlist
  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.find((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  // Remove from wishlist
  const removeFromWishlist = (id) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
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
    setUser(userData);
    
    // If user has items in local cart, migrate them to backend
    if (localCart.length > 0) {
      await migrateLocalCartToBackend(localCart);
      // Reload cart from backend to include migrated items
      setTimeout(() => loadCartFromBackend(), 500);
    }
  };

  // Logout (clears and removes)
  const logout = () => {
    setUser(null);
    setCart([]); // Optional: Clear cart/wishlist on logout
    setWishlist([]);
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    localStorage.removeItem("wishlist");
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
        addToWishlist,
        removeFromWishlist,
        login,
        logout,
        cartCount: cart.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0),
        wishlistCount: wishlist.length,
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
