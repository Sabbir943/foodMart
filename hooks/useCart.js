"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discountType, discountValue, minOrderAmount }

  // Load cart from localStorage on mount
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const storedCart = localStorage.getItem("foodmart_cart");
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          setCartItems(parsed.cartItems || []);
          setRestaurantId(parsed.restaurantId || null);
          setRestaurantName(parsed.restaurantName || "");
          if (parsed.coupon) setCoupon(parsed.coupon);
        }
      } catch (err) {
        console.error("Error reading cart from localStorage:", err);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Save cart to localStorage whenever it changes
  const saveCartToStorage = (items, restId, restName, cp = coupon) => {
    localStorage.setItem(
      "foodmart_cart",
      JSON.stringify({ cartItems: items, restaurantId: restId, restaurantName: restName, coupon: cp })
    );
  };

  const addToCart = (item, restId, restName) => {
    // If the cart is already associated with another restaurant, return error/warning
    if (restaurantId && restaurantId !== restId) {
      return { success: false, conflict: true };
    }

    let updatedItems = [...cartItems];
    const existingIndex = updatedItems.findIndex(
      (i) => i.menuItemId === item.menuItemId && i.variant === item.variant
    );

    if (existingIndex > -1) {
      // Item with same variant exists - update quantity
      updatedItems[existingIndex].qty += item.qty;
    } else {
      // Add as new item
      updatedItems.push(item);
    }

    setCartItems(updatedItems);
    setRestaurantId(restId);
    setRestaurantName(restName);
    saveCartToStorage(updatedItems, restId, restName);
    return { success: true };
  };

  const removeFromCart = (menuItemId, variant) => {
    const updatedItems = cartItems.filter(
      (item) => !(item.menuItemId === menuItemId && item.variant === variant)
    );

    let nextRestId = restaurantId;
    let nextRestName = restaurantName;

    if (updatedItems.length === 0) {
      nextRestId = null;
      nextRestName = "";
      setCoupon(null);
    }

    setCartItems(updatedItems);
    setRestaurantId(nextRestId);
    setRestaurantName(nextRestName);
    saveCartToStorage(updatedItems, nextRestId, nextRestName, updatedItems.length === 0 ? null : coupon);
  };

  const updateQty = (menuItemId, variant, qty) => {
    if (qty <= 0) {
      removeFromCart(menuItemId, variant);
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (item.menuItemId === menuItemId && item.variant === variant) {
        return { ...item, qty };
      }
      return item;
    });

    setCartItems(updatedItems);
    saveCartToStorage(updatedItems, restaurantId, restaurantName);
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
    setRestaurantName("");
    setCoupon(null);
    localStorage.removeItem("foodmart_cart");
  };

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
    saveCartToStorage(cartItems, restaurantId, restaurantName, couponData);
  };

  const removeCoupon = () => {
    setCoupon(null);
    saveCartToStorage(cartItems, restaurantId, restaurantName, null);
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 0 ? 5.0 : 0.0;
  const tax = subtotal * 0.1; // 10% tax

  let discount = 0;
  if (coupon && subtotal >= (coupon.minOrderAmount || 0)) {
    if (coupon.discountType === "percent") {
      discount = subtotal * (coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }
  }

  const totalAmount = Math.max(0, subtotal + deliveryFee + tax - discount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurantId,
        restaurantName,
        coupon,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        applyCoupon,
        removeCoupon,
        subtotal,
        deliveryFee,
        tax,
        discount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
