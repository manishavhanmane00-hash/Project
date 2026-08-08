import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

/**
 * CartProvider — manages the shopping cart state
 * Cart is persisted in localStorage so it survives page refreshes
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cafeCart');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem('cafeCart');
      }
    }
  }, []);

  // Persist cart changes to localStorage
  useEffect(() => {
    localStorage.setItem('cafeCart', JSON.stringify(cartItems));
  }, [cartItems]);

  /**
   * Add an item to cart; if already exists, increase quantity
   */
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.subItemId === item.subItemId && i.menuItemId === item.menuItemId
      );
      if (existing) {
        return prev.map((i) =>
          i.subItemId === item.subItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  /**
   * Remove one unit of an item; remove entirely if quantity reaches 0
   */
  const removeFromCart = (subItemId) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.subItemId === subItemId);
      if (existing?.quantity === 1) {
        return prev.filter((i) => i.subItemId !== subItemId);
      }
      return prev.map((i) =>
        i.subItemId === subItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  };

  /**
   * Completely remove an item from cart
   */
  const deleteFromCart = (subItemId) => {
    setCartItems((prev) => prev.filter((i) => i.subItemId !== subItemId));
  };

  /**
   * Clear all items from cart
   */
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cafeCart');
  };

  // Derived values
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * Custom hook for consuming CartContext
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
