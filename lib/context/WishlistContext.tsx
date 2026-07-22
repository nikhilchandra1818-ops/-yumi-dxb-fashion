"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { WishlistItem } from "../../types";
import { getDocument, setDocument } from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { useCart } from "./CartContext";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  moveToCart: (productId: string, size: string, color: string, price: number, discountPrice: number | undefined, maxStock: number, name: string, slug: string, imageUrl: string) => Promise<void>;
  loadingWishlist: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  isInWishlist: () => false,
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  moveToCart: async () => {},
  loadingWishlist: true,
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      setLoadingWishlist(true);
      if (user) {
        try {
          const userWishlistDoc = await getDocument<{ items: WishlistItem[] }>("wishlist", user.uid);
          setWishlistItems(userWishlistDoc?.items || []);
        } catch (error) {
          console.error("Error loading wishlist from Firestore:", error);
        }
      } else {
        setWishlistItems([]);
      }
      setLoadingWishlist(false);
    };

    loadWishlist();
  }, [user]);

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const addToWishlist = async (productId: string) => {
    if (!user) return; // Only logged-in users

    if (isInWishlist(productId)) return;

    const newItems = [...wishlistItems, { productId, addedAt: Timestamp.now() }];
    setWishlistItems(newItems);

    try {
      await setDocument("wishlist", user.uid, {
        userId: user.uid,
        items: newItems,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error saving wishlist to Firestore:", error);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    const newItems = wishlistItems.filter((item) => item.productId !== productId);
    setWishlistItems(newItems);

    try {
      await setDocument("wishlist", user.uid, {
        userId: user.uid,
        items: newItems,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error removing from wishlist in Firestore:", error);
    }
  };

  const moveToCart = async (
    productId: string,
    size: string,
    color: string,
    price: number,
    discountPrice: number | undefined,
    maxStock: number,
    name: string,
    slug: string,
    imageUrl: string
  ) => {
    if (!user) return;

    // Add to cart
    await addToCart(
      {
        productId,
        size,
        color,
        price,
        discountPrice,
        maxStock,
        productName: name,
        productSlug: slug,
        imageUrl,
      },
      1
    );

    // Remove from wishlist
    await removeFromWishlist(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        loadingWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
