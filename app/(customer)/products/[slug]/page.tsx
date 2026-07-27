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
  ThumbsUp,
  ThumbsDown,
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

  // Review submission (Flipkart Style: Verified Buyers Auto-Publish Instant)
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
      const newReviewData = {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Customer",
        orderId: verifiedOrderId,
        rating: reviewRating,
        comment: reviewComment,
        isApproved: true, // Flipkart style: Instant auto-publish for verified purchasers
        isHidden: false,
      };

      const docRef = await createDocument("reviews", newReviewData);

      toast.success("Thank you! Your verified rating & review has been published.");
      setReviewComment("");
      setHasAlreadyReviewed(true);

      // Instantly update product reviews state live
      setReviews((prev) => [
        {
          id: docRef.id,
          ...newReviewData,
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any,
          updatedAt: { seconds: Math.floor(Date.now() / 1000) } as any,
        },
        ...prev,
      ]);
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

      {/* ─── Flipkart-Style Ratings & Reviews Section ─── */}
      <section id="reviews" className="space-y-8 pt-8 border-t border-charcoal/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
              Ratings &amp; Reviews
            </h2>
            <p className="text-xs text-charcoal-muted font-light mt-0.5">
              Verified authentic ratings and feedback from real buyers
            </p>
          </div>
        </div>

        {/* Flipkart Ratings Breakdown Summary Card */}
        <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 sm:p-8 shadow-soft grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Rating Badge & Totals */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-3 md:border-r border-charcoal/10 md:pr-8">
            <div className="flex items-center gap-3">
              <span className="bg-green-700 text-ivory text-3xl sm:text-4xl font-extrabold px-4 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                <span>{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0"}</span>
                <Star className="w-6 h-6 fill-current text-ivory" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-navy">Verified Rating</span>
                <span className="text-xs text-charcoal-muted">Overall Satisfaction</span>
              </div>
            </div>
            <p className="text-xs font-medium text-charcoal-muted">
              <strong className="text-navy">{reviews.length}</strong> {reviews.length === 1 ? "Rating & Review" : "Ratings & Reviews"}
            </p>
          </div>

          {/* Flipkart Star Progress Bars */}
          <div className="md:col-span-7 space-y-2 max-w-sm mx-auto md:max-w-none w-full">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = reviews.filter((r) => r.rating === starNum).length;
              const percent = reviews.length > 0 ? (count / reviews.length) * 100 : starNum === 5 ? 100 : 0;
              const barColor =
                starNum >= 4 ? "bg-green-600" : starNum === 3 ? "bg-yellow-500" : "bg-red-500";

              return (
                <div key={starNum} className="flex items-center gap-3 text-xs">
                  <span className="w-6 font-semibold text-charcoal flex items-center justify-end gap-0.5">
                    {starNum} <Star className="w-3 h-3 fill-current text-charcoal/60" />
                  </span>
                  <div className="flex-1 h-2 bg-charcoal/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium text-charcoal-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid: Flipkart Rate Product Form (Left) & Verified Reviews List (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Flipkart Rate Product Box */}
          <div className="lg:col-span-5 space-y-6">
            {checkingPurchaser ? (
              <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blush mx-auto" />
                <span className="text-xs text-charcoal-muted mt-2 block font-medium">Verifying purchase status...</span>
              </div>
            ) : !user ? (
              <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft text-center space-y-4">
                <div className="w-12 h-12 bg-blush-subtle rounded-full flex items-center justify-center mx-auto text-blush">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-lg font-semibold text-navy">Verified Purchasers Only</h4>
                  <p className="text-xs text-charcoal-muted font-light leading-relaxed max-w-xs mx-auto">
                    Only buyers who have received this creation can leave a review.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block w-full py-3 bg-navy text-ivory hover:bg-navy-light text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-navy"
                >
                  Sign In to Rate &amp; Review
                </Link>
              </div>
            ) : !canReview ? (
              <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft text-center space-y-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-800">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-lg font-semibold text-navy">Verified Purchase Required</h4>
                  <p className="text-xs text-charcoal-muted font-light leading-relaxed max-w-xs mx-auto">
                    You can rate and review this item once your order has been placed and marked as <strong className="text-navy font-semibold">Delivered</strong>.
                  </p>
                </div>
              </div>
            ) : hasAlreadyReviewed ? (
              <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft text-center space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-700">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-lg font-semibold text-navy">Verified Review Published</h4>
                  <p className="text-xs text-charcoal-muted font-light leading-relaxed max-w-xs mx-auto">
                    Thank you! Your verified purchaser rating &amp; review is live in our catalog.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between border-b border-charcoal/10 pb-3">
                  <h3 className="font-heading text-lg font-bold text-navy">Rate &amp; Review Product</h3>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-green-700" />
                    Verified Buyer
                  </span>
                </div>
                
                {/* Rating Selector */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Select Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 text-charcoal-subtle">
                      {[1, 2, 3, 4, 5].map((ratingVal) => (
                        <button
                          key={ratingVal}
                          type="button"
                          onClick={() => setReviewRating(ratingVal)}
                          className={`p-1 transition-transform hover:scale-110 ${
                            ratingVal <= reviewRating ? "text-yellow-500" : "text-charcoal/20"
                          }`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-navy ml-2">
                      {reviewRating === 5 ? "Excellent" : reviewRating === 4 ? "Very Good" : reviewRating === 3 ? "Good" : reviewRating === 2 ? "Fair" : "Poor"}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  <label htmlFor="comment" className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Write your review
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    required
                    className="w-full bg-ivory border border-charcoal/15 rounded-md p-3 text-sm focus:outline-none focus:border-navy text-charcoal placeholder-charcoal-subtle"
                    placeholder="What did you like or dislike about this product? Feel free to share sizing, comfort, and fabric feedback..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={submittingReview}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment}
                  className="w-full py-3 bg-navy text-ivory hover:bg-navy-light text-xs font-bold uppercase tracking-wider rounded-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-navy"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "SUBMIT REVIEW"}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Flipkart Review Cards List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-ivory-light border border-charcoal/10 rounded-2xl p-6 shadow-soft space-y-3"
                >
                  {/* Flipkart Card Top Header: Green Star Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-700 text-ivory text-xs font-extrabold px-2 py-0.5 rounded inline-flex items-center gap-0.5 shadow-sm">
                        <span>{review.rating}</span>
                        <Star className="w-3 h-3 fill-current text-ivory" />
                      </span>
                      <span className="font-semibold text-navy text-sm">
                        {review.comment.length > 30 ? review.comment.slice(0, 30) + "..." : review.comment}
                      </span>
                    </div>
                  </div>

                  {/* Review Text Body */}
                  <p className="text-sm text-charcoal font-normal leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Flipkart Card Footer: Author Name, Verified Badge, Date & Helpful Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-charcoal/10 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{review.userName}</span>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-green-700" />
                        Verified Buyer
                      </span>
                      <span className="text-charcoal-subtle text-[10px]">
                        {review.createdAt ? new Date((review.createdAt as any).seconds * 1000).toLocaleDateString() : "Just now"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-charcoal-muted">
                      <button className="flex items-center gap-1 hover:text-navy transition-colors text-[11px]">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>0</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-navy transition-colors text-[11px]">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>0</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-ivory-light border border-charcoal/10 rounded-2xl shadow-soft text-charcoal-muted space-y-2">
                <Star className="w-8 h-8 text-charcoal/20 mx-auto" />
                <p className="text-sm font-medium text-navy">No reviews for this product yet.</p>
                <p className="text-xs font-light">Be the first verified purchaser to leave a rating!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
