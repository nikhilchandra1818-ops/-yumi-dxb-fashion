"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { formatCurrency, getDiscountPercent } from "@/lib/utils";
import { Product } from "@/types";
import { Heart, ShoppingBag, Eye, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const primaryImg = product.images.find((img) => img.isPrimary)?.url || "/images/placeholder.jpg";
  const hoverImg = product.images.find((img) => !img.isPrimary && img.order === 1)?.url || primaryImg;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to add items to your wishlist.");
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        toast.success("Removed from wishlist.");
      } else {
        await addToWishlist(product.id);
        toast.success("Added to wishlist.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (product.stock <= 0) {
      toast.error("This product is currently out of stock.");
      return;
    }

    setAddingToCart(true);
    try {
      const defaultSize = product.sizes[0] || "Standard";
      const defaultColor = product.colors[0] || "Default";

      await addToCart(
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: primaryImg,
          size: defaultSize,
          color: defaultColor,
          price: product.price,
          discountPrice: product.discountPrice,
          maxStock: product.stock,
        },
        1
      );
      toast.success(`${product.name} added to cart.`);
    } catch (err) {
      toast.error("Could not add item. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? getDiscountPercent(product.price, product.discountPrice!) : 0;

  return (
    <div className="group relative flex flex-col bg-ivory-light border border-charcoal/10 hover:border-blush/40 rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-500 ease-out hover:-translate-y-1.5">
      {/* Product Image Section */}
      <Link href={`/products/${product.slug}`} className="relative aspect-3/4 w-full overflow-hidden bg-charcoal/5">
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-4 left-4 z-10 bg-blush text-ivory text-[11px] font-bold px-3 py-1 rounded-full shadow-soft tracking-widest uppercase border border-white/20">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-4 right-4 z-10 p-2.5 rounded-full border transition-all duration-300 shadow-soft active:scale-75 ${
            isWishlisted
              ? "bg-blush border-blush text-ivory scale-110"
              : "bg-ivory/90 border-charcoal/10 text-charcoal hover:bg-blush hover:text-ivory hover:border-blush"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className="w-4 h-4 fill-current stroke-[2.5]" />
        </button>

        {/* Primary Image */}
        <Image
          src={primaryImg}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          priority={product.isFeatured}
        />

        {/* Hover Image */}
        {hoverImg !== primaryImg && (
          <Image
            src={hoverImg}
            alt={`${product.name} alternate`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
          />
        )}

        {/* Quick View Button Hover overlay */}
        <div className="absolute inset-0 bg-charcoal/5 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:flex hidden items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickView(product);
            }}
            className="p-3 bg-ivory/90 hover:bg-blush text-charcoal hover:text-ivory rounded-full shadow-soft transition-all duration-300 translate-y-4 group-hover:translate-y-0"
            title="Quick View"
          >
            <Eye className="w-5 h-5" />
          </button>
          
          {product.stock > 0 ? (
            <button
              onClick={handleQuickAdd}
              disabled={addingToCart}
              className="p-3 bg-ivory/90 hover:bg-navy text-charcoal hover:text-ivory rounded-full shadow-soft transition-all duration-300 translate-y-4 group-hover:translate-y-0 delay-75 disabled:opacity-50"
              title="Quick Add to Cart"
            >
              {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
            </button>
          ) : (
            <span className="px-4 py-2 bg-charcoal/80 text-ivory text-xs font-semibold uppercase tracking-wider rounded-md">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-blush font-semibold">
            {product.categoryName}
          </span>
          <h3 className="font-heading text-lg font-medium text-charcoal mt-1 line-clamp-1 hover:text-blush transition-colors">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="text-xs text-charcoal-muted mt-1 italic font-light truncate">
            Fabric: {product.fabric}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-charcoal/5">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-base font-semibold text-charcoal">
                  {formatCurrency(product.discountPrice!)}
                </span>
                <span className="text-sm text-charcoal-subtle line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span className="text-base font-semibold text-charcoal">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          
          <Link
            href={`/products/${product.slug}`}
            className="text-xs uppercase tracking-wider font-semibold text-navy hover:text-blush transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};
