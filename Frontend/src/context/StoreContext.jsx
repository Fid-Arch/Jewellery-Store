import React, { createContext, useContext, useState, useEffect } from "react";

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

  // Add to cart
  const addToCart = (product, qty = 1) => {
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
  };

  // Remove from cart
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
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

  // Login (sets user and saves)
  const login = (userData) => {
    setUser(userData);
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
        addToWishlist,
        removeFromWishlist,
        login,
        logout,
        cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
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
