"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { CartItem } from "../../types";
import { getDocument, setDocument } from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartSubtotal: number;
  cartTotalItems: number;
  loadingCart: boolean;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  cartSubtotal: 0,
  cartTotalItems: 0,
  loadingCart: true,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // 1. Load cart on mount or when user status changes
  useEffect(() => {
    const loadCart = async () => {
      setLoadingCart(true);
      if (user) {
        // Logged in: fetch from Firestore
        try {
          const userCartDoc = await getDocument<{ items: CartItem[] }>("cart", user.uid);
          const localCartStr = localStorage.getItem(`yumi_cart_guest`);
          let localCart: CartItem[] = [];
          if (localCartStr) {
            try {
              localCart = JSON.parse(localCartStr);
            } catch (e) {
              console.error("Error parsing local cart", e);
            }
          }

          if (userCartDoc) {
            // Merge local guest cart and Firestore cart if any
            if (localCart.length > 0) {
              const merged = mergeCarts(userCartDoc.items, localCart);
              await setDocument("cart", user.uid, {
                userId: user.uid,
                items: merged,
                updatedAt: Timestamp.now(),
              });
              setCartItems(merged);
              localStorage.removeItem(`yumi_cart_guest`);
            } else {
              setCartItems(userCartDoc.items || []);
            }
          } else {
            // No cart in firestore yet, save local cart to firestore
            const itemsToSave = localCart;
            await setDocument("cart", user.uid, {
              userId: user.uid,
              items: itemsToSave,
              updatedAt: Timestamp.now(),
            });
            setCartItems(itemsToSave);
            localStorage.removeItem(`yumi_cart_guest`);
          }
        } catch (error) {
          console.error("Error loading cart from Firestore:", error);
        }
      } else {
        // Logged out: fetch from localStorage
        const localCartStr = localStorage.getItem(`yumi_cart_guest`);
        if (localCartStr) {
          try {
            setCartItems(JSON.parse(localCartStr));
          } catch (e) {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
      setLoadingCart(false);
    };

    loadCart();
  }, [user]);

  // Helper to merge two carts
  const mergeCarts = (dbCart: CartItem[], localCart: CartItem[]): CartItem[] => {
    const merged = [...dbCart];
    localCart.forEach((localItem) => {
      const matchIndex = merged.findIndex(
        (dbItem) =>
          dbItem.productId === localItem.productId &&
          dbItem.size === localItem.size &&
          dbItem.color === localItem.color
      );
      if (matchIndex > -1) {
        // Merge quantities, cap at maxStock if applicable
        const newQty = merged[matchIndex].quantity + localItem.quantity;
        merged[matchIndex].quantity = Math.min(newQty, merged[matchIndex].maxStock);
      } else {
        merged.push(localItem);
      }
    });
    return merged;
  };

  // Sync cart to local or remote storage
  const syncCart = async (newItems: CartItem[]) => {
    setCartItems(newItems);
    if (user) {
      try {
        await setDocument("cart", user.uid, {
          userId: user.uid,
          items: newItems,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Error saving cart to Firestore:", error);
      }
    } else {
      localStorage.setItem(`yumi_cart_guest`, JSON.stringify(newItems));
    }
  };

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const matchIndex = cartItems.findIndex(
      (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
    );

    let newItems = [...cartItems];
    if (matchIndex > -1) {
      const newQty = newItems[matchIndex].quantity + quantity;
      newItems[matchIndex].quantity = Math.min(newQty, item.maxStock);
    } else {
      newItems.push({ ...item, quantity: Math.min(quantity, item.maxStock) });
    }

    await syncCart(newItems);
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    const newItems = cartItems.filter(
      (i) => !(i.productId === productId && i.size === size && i.color === color)
    );
    await syncCart(newItems);
  };

  const updateQuantity = async (productId: string, size: string, color: string, quantity: number) => {
    const newItems = cartItems.map((i) => {
      if (i.productId === productId && i.size === size && i.color === color) {
        return { ...i, quantity: Math.min(Math.max(1, quantity), i.maxStock) };
      }
      return i;
    });
    await syncCart(newItems);
  };

  const clearCart = async () => {
    await syncCart([]);
  };

  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = item.discountPrice ?? item.price;
    return acc + price * item.quantity;
  }, 0);

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartTotalItems,
        loadingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
