"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCollection, where, getDocument, createDocument } from "@/lib/firebase/firestore";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useSettings } from "@/lib/context/SettingsContext";
import { ProductCard } from "@/components/customer/ProductCard";
import { formatCurrency, getDiscountPercent } from "@/lib/utils";
import { Product, Review, Order } from "@/types";
import { toast } from "react-hot-toast";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Star,
  Loader2,
} from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { settings } = useSettings();

  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Review Form & Verification State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [verifiedOrderId, setVerifiedOrderId] = useState<string | null>(null);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  const [checkingPurchaser, setCheckingPurchaser] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // Query product by slug
        const results = await getCollection<Product>("products", [
          where("slug", "==", slug),
          where("isActive", "==", true),
        ]);

        if (results.length === 0) {
          toast.error("Product not found.");
          router.push("/collections");
          return;
        }

        const prod = results[0];
        setProduct(prod);

        // Set defaults
        if (prod.sizes.length > 0) setSelectedSize(prod.sizes[0]);
        if (prod.colors.length > 0) setSelectedColor(prod.colors[0]);

        // Fetch related products (same category, active, not itself)
        const related = await getCollection<Product>("products", [
          where("categoryId", "==", prod.categoryId),
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);
        setRelatedProducts(related.filter((p) => p.id !== prod.id).slice(0, 4));

        // Fetch approved reviews for this product
        const prodReviews = await getCollection<Review>("reviews", [
          where("productId", "==", prod.id),
          where("isApproved", "==", true),
        ]);
        setReviews(prodReviews);
      } catch (error) {
        console.error("Error fetching product detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
    }
  }, [slug, router]);

  // Check if current user is a verified purchaser who has received this item (delivered)
  useEffect(() => {
    const verifyPurchaserStatus = async () => {
      if (!user || !product) {
        setCanReview(false);
        setVerifiedOrderId(null);
        setHasAlreadyReviewed(false);
        setCheckingPurchaser(false);
        return;
      }

      setCheckingPurchaser(true);
      try {
        // 1. Fetch user's delivered orders
        const deliveredOrders = await getCollection<Order>("orders", [
          where("userId", "==", user.uid),
          where("status", "==", "delivered"),
        ]);

        const matchingOrder = deliveredOrders.find((ord) =>
          ord.items.some((item) => item.productId === product.id)
        );

        if (matchingOrder) {
          setCanReview(true);
          setVerifiedOrderId(matchingOrder.id);
        } else {
          setCanReview(false);
          setVerifiedOrderId(null);
        }

        // 2. Check if user already submitted a review for this product
        const existingReviews = await getCollection<Review>("reviews", [
          where("productId", "==", product.id),
          where("userId", "==", user.uid),
        ]);

        if (existingReviews.length > 0) {
          setHasAlreadyReviewed(true);
        } else {
          setHasAlreadyReviewed(false);
        }
      } catch (err) {
        console.error("Error verifying purchaser status:", err);
      } finally {
        setCheckingPurchaser(false);
      }
    };

    if (product) {
      verifyPurchaserStatus();
    }
  }, [user, product]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    );
  }

  const primaryImgUrl = product.images[activeImageIndex]?.url || "/images/placeholder.jpg";
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const isWishlisted = isInWishlist(product.id);

  // Zoom implementation on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  // Add to cart helper
  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      toast.error("This item is currently out of stock.");
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: product.images.find((img) => img.isPrimary)?.url || primaryImgUrl,
          size: selectedSize || "Standard",
          color: selectedColor || "Default",
          price: product.price,
          discountPrice: product.discountPrice,
          maxStock: product.stock,
        },
        quantity
      );
      toast.success("Added to cart!");
    } catch (err) {
      toast.error("Could not add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Buy now helper
  const handleBuyNow = async () => {
    if (product.stock <= 0) {
      toast.error("This item is out of stock.");
      return;
    }

    setBuyingNow(true);
    try {
      await addToCart(
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: product.images.find((img) => img.isPrimary)?.url || primaryImgUrl,
          size: selectedSize || "Standard",
          color: selectedColor || "Default",
          price: product.price,
          discountPrice: product.discountPrice,
          maxStock: product.stock,
        },
        quantity
      );
      router.push("/checkout");
    } catch (err) {
      toast.error("Failed to proceed to checkout.");
    } finally {
      setBuyingNow(false);
    }
  };

  // Wishlist handler
  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error("Please login to manage your wishlist.");
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
      toast.error("Something went wrong.");
    }
  };

  // Review submission (Verified Buyers Only)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to submit a review.");
      return;
    }

    if (!canReview || !verifiedOrderId) {
      toast.error("Only verified buyers who have received this creation can write a review.");
      return;
    }

    if (hasAlreadyReviewed) {
      toast.error("You have already submitted a review for this product.");
      return;
    }

    setSubmittingReview(true);
    try {
      await createDocument("reviews", {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Customer",
        orderId: verifiedOrderId,
        rating: reviewRating,
        comment: reviewComment,
        isApproved: false, // Sent to admin moderation
        isHidden: false,
      });

      toast.success("Review submitted! It will appear live after admin moderation.");
      setReviewComment("");
      setHasAlreadyReviewed(true);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative aspect-[3/4] w-full overflow-hidden bg-charcoal/5 rounded-lg border border-charcoal/5 cursor-zoom-in"
          >
            <Image
              src={primaryImgUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-100 ease-out"
              style={zoomStyle}
              priority
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.images
                .sort((a, b) => a.order - b.order)
                .map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 aspect-[3/4] rounded border flex-shrink-0 bg-charcoal/5 overflow-hidden transition-all ${
                      activeImageIndex === idx
                        ? "border-blush ring-1 ring-blush"
                        : "border-charcoal/10 hover:border-charcoal/40"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} thumbnail ${idx}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right Column: Info & Options */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-blush font-semibold">
              {product.categoryName}
            </span>
            <h1 className="font-heading text-display-sm sm:text-display-md text-charcoal font-semibold mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-charcoal-muted mt-1 uppercase tracking-widest">
              SKU: {product.sku}
            </p>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-4 py-2">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-charcoal">
                  {formatCurrency(product.discountPrice!)}
                </span>
                <span className="text-base text-charcoal-subtle line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs text-blush font-bold bg-blush-subtle px-2.5 py-1 rounded-full">
                  {getDiscountPercent(product.price, product.discountPrice!)}% OFF
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-charcoal">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Brief specs */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-charcoal/5 text-sm">
            <div>
              <span className="text-charcoal-muted font-light">Fabric: </span>
              <span className="font-semibold text-charcoal">{product.fabric}</span>
            </div>
            <div>
              <span className="text-charcoal-muted font-light">Status: </span>
              {product.stock <= 0 ? (
                <span className="font-bold text-red-600">Out of Stock</span>
              ) : product.stock < 5 ? (
                <span className="font-bold text-yellow-600">Low Stock ({product.stock} left)</span>
              ) : (
                <span className="font-bold text-green-600">In Stock</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
              Description
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          {/* Size Select */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Size: {selectedSize}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border text-xs font-medium rounded transition-all duration-300 ${
                      selectedSize === size
                        ? "bg-navy border-navy text-ivory shadow-soft"
                        : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/40"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Select */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Color: {selectedColor}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border text-xs font-medium rounded transition-all duration-300 ${
                      selectedColor === color
                        ? "bg-navy border-navy text-ivory shadow-soft"
                        : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/40"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Wishlist */}
          <div className="flex items-center justify-between pt-4 border-t border-charcoal/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
              Quantity
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || product.stock <= 0}
                className="w-9 h-9 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock || product.stock <= 0}
                className="w-9 h-9 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock <= 0}
                className="flex-1 bg-transparent border border-navy text-navy hover:bg-navy/5 py-3.5 px-4 rounded-md font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
              >
                {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={handleWishlistToggle}
                className={`p-3.5 border rounded-md transition-all duration-300 ${
                  isWishlisted
                    ? "bg-blush border-blush text-ivory"
                    : "bg-transparent border-charcoal/10 text-charcoal hover:bg-blush hover:text-ivory hover:border-blush"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className="w-4 h-4 fill-current stroke-[2.5]" />
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={buyingNow || product.stock <= 0}
              className="w-full bg-navy text-ivory hover:bg-navy-light py-3.5 px-4 rounded-md font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm shadow-navy"
            >
              {buyingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy It Now"}
            </button>
          </div>

          {/* Policies & Info widgets */}
          <div className="space-y-3 pt-6 border-t border-charcoal/5 text-xs text-charcoal-muted">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-blush" />
              <span>
                Estimated Delivery: <strong className="text-charcoal">{settings.estimatedDeliveryDays}</strong> (Pan India)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-blush" />
              <span>
                Easy returns and exchanges within <strong className="text-charcoal">{settings.returnWindowDays} days</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Care section */}
      {product.careInstructions && (
        <section className="bg-ivory-light border border-charcoal/5 rounded-xl p-8 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blush" />
            <span>Garment Care Instructions</span>
          </h2>
          <p className="text-sm text-charcoal-muted font-light leading-relaxed">
            {product.careInstructions}
          </p>
        </section>
      )}

      {/* ─── Related Products ─── */}
      {relatedProducts.length > 0 && (
        <section className="space-y-8 pt-8 border-t border-charcoal/5">
          <div className="text-center md:text-left space-y-1">
            <span className="text-xs uppercase tracking-widest text-blush font-semibold">
              Complete Your Look
            </span>
            <h2 className="font-heading text-display-sm font-semibold text-charcoal">
              Related Creations
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setProduct} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Customer Reviews Section ─── */}
      <section className="space-y-8 pt-8 border-t border-charcoal/5">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          Customer Reviews ({reviews.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Review Stats & Write Box */}
          <div className="space-y-6">
            <div className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft space-y-4">
              <h3 className="font-body text-base font-semibold text-charcoal">
                Overall Rating
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-charcoal">
                  {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : "5.0"}
                </span>
                <div className="flex flex-col">
                  <div className="flex text-blush gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-charcoal-muted mt-1">Based on {reviews.length} reviews</span>
                </div>
              </div>
            </div>

            {/* Write a review (Verified login & purchase required) */}
            {checkingPurchaser ? (
              <div className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blush mx-auto" />
                <span className="text-xs text-charcoal-muted mt-2 block">Verifying purchase history...</span>
              </div>
            ) : !user ? (
              <div className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft text-center space-y-3">
                <div className="w-10 h-10 bg-blush-subtle rounded-full flex items-center justify-center mx-auto text-blush">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-semibold text-charcoal">Verified Purchasers Only</h4>
                <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                  Only customers who have purchased and received this creation can submit a review.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-4 py-2 border border-navy text-navy hover:bg-navy/5 text-xs font-semibold uppercase tracking-wider rounded transition-all mt-1"
                >
                  Sign In to Review
                </Link>
              </div>
            ) : !canReview ? (
              <div className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft text-center space-y-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-800">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-semibold text-charcoal">Verified Purchase Required</h4>
                <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                  You can submit a review once you have purchased this item and your order status is marked as <strong className="text-charcoal font-semibold">Delivered</strong>.
                </p>
              </div>
            ) : hasAlreadyReviewed ? (
              <div className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft text-center space-y-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-semibold text-charcoal">Review Submitted</h4>
                <p className="text-xs text-charcoal-muted font-light leading-relaxed">
                  Thank you! You have already submitted a verified buyer review for this product. It is currently under moderation or published live.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h3 className="font-body text-base font-semibold text-charcoal">Write a review</h3>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Buyer
                  </span>
                </div>
                
                {/* Rating */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-charcoal-muted uppercase">Rating</span>
                  <div className="flex gap-1.5 text-charcoal-subtle">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const ratingVal = idx + 1;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReviewRating(ratingVal)}
                          className={`p-0.5 transition-colors ${
                            ratingVal <= reviewRating ? "text-blush" : "text-charcoal-subtle hover:text-blush/60"
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  <label htmlFor="comment" className="text-xs font-semibold text-charcoal-muted uppercase">
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    required
                    className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                    placeholder="Tell us what you liked about this creation..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={submittingReview}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment}
                  className="w-full py-2 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                </button>
              </form>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-medium text-charcoal">{review.userName}</span>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        Verified Buyer
                      </span>
                    </div>
                    <span className="text-[10px] text-charcoal-subtle">
                      {review.createdAt ? new Date((review.createdAt as any).seconds * 1000).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                  <div className="flex gap-0.5 text-blush">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-charcoal-muted leading-relaxed font-light italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft text-charcoal-muted text-sm font-light">
                There are no reviews for this product yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
