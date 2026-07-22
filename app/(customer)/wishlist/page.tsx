"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/context/WishlistContext";
import { useAuth } from "@/lib/context/AuthContext";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product } from "@/types";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { Heart, Loader2, ShoppingBag, ArrowRight, UserCheck } from "lucide-react";

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, loadingWishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      try {
        const productIds = wishlistItems.map((item) => item.productId);
        // Fetch active products from Firestore
        const allProducts = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);

        const filtered = allProducts.filter((p) => productIds.includes(p.id));
        setProducts(filtered);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (!loadingWishlist) {
      fetchWishlistProducts();
    }
  }, [wishlistItems, loadingWishlist]);

  // Loading State
  if (loadingWishlist || (wishlistItems.length > 0 && loadingProducts)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-ivory">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    );
  }

  // Guest State (Not Logged In)
  if (!user) {
    return (
      <div className="min-h-[75vh] bg-ivory py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-ivory-light border border-charcoal/10 rounded-2xl p-8 sm:p-10 text-center shadow-card space-y-6">
          <div className="w-16 h-16 bg-blush-subtle rounded-full flex items-center justify-center mx-auto text-blush">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-navy">Your Favorites Wishlist</h1>
            <p className="text-sm text-charcoal font-normal leading-relaxed">
              Please sign in to save your favorite Kaftans, Abayas, Co-ords, and Floral Nightwear to your personal atelier wishlist.
            </p>
          </div>
          <div className="pt-2 space-y-3">
            <Link
              href="/login"
              className="w-full py-3.5 bg-navy text-ivory hover:bg-navy-light rounded-md text-xs font-semibold uppercase tracking-widest transition-colors shadow-navy flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In to View Wishlist</span>
            </Link>
            <Link
              href="/collections"
              className="w-full py-3.5 bg-transparent border border-charcoal/20 text-charcoal hover:bg-charcoal/5 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty State (Logged in, 0 items)
  if (products.length === 0) {
    return (
      <div className="min-h-[75vh] bg-ivory py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-ivory-light border border-charcoal/10 rounded-2xl p-8 sm:p-10 text-center shadow-card space-y-6">
          <div className="w-16 h-16 bg-blush-subtle/60 rounded-full flex items-center justify-center mx-auto text-blush">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-navy">Your Wishlist is Empty</h1>
            <p className="text-sm text-charcoal font-normal leading-relaxed">
              You haven't saved any creations to your wishlist yet. Click the heart icon on any product to save it here!
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded-md transition-colors shadow-navy"
          >
            <span>Discover Creations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 pb-8 border-b border-charcoal/10">
          <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Saved Favorites ({products.length})</span>
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-navy font-bold tracking-tight">
            My Atelier Wishlist
          </h1>
          <p className="text-sm text-charcoal font-normal max-w-md mx-auto leading-relaxed">
            Your saved lounge and nightwear creations. Review, quick-view, or add your saved items directly to your shopping bag.
          </p>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard
                product={product}
                onQuickView={(p) => setSelectedProduct(p)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
