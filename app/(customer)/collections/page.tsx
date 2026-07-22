"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { getCollection, where, orderBy } from "@/lib/firebase/firestore";
import { Product, Category } from "@/types";
import { SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X, Search, Loader2 } from "lucide-react";
import { Suspense } from "react";

function CollectionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search parameters
  const categoryParam = searchParams.get("c") || "";
  const collectionParam = searchParams.get("coll") || "";

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filters State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Sync category state with search query param
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Fetch categories & products from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cats = await getCollection<Category>("categories", [
          where("isActive", "==", true),
          orderBy("displayOrder", "asc"),
        ]);
        setCategories(cats);

        // Fetch all active products
        const allProducts = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching collections products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and Sort Logic
  const getFilteredProducts = () => {
    let filtered = [...products];

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (p) => p.categoryId === selectedCategory || p.categoryName.toLowerCase().replace(/\s+/g, "-") === selectedCategory
      );
    }

    // 2. Price Filter
    if (selectedPriceRange !== "all") {
      const [minStr, maxStr] = selectedPriceRange.split("-");
      const min = parseFloat(minStr);
      const max = maxStr ? parseFloat(maxStr) : Infinity;
      filtered = filtered.filter((p) => {
        const price = p.discountPrice ?? p.price;
        return price >= min && price <= max;
      });
    }

    // 3. Availability Filter
    if (selectedAvailability === "in-stock") {
      filtered = filtered.filter((p) => p.stock > 0);
    } else if (selectedAvailability === "out-of-stock") {
      filtered = filtered.filter((p) => p.stock <= 0);
    }

    // 4. Size Filter
    if (selectedSize !== "all") {
      filtered = filtered.filter((p) => p.sizes.includes(selectedSize));
    }

    // 5. Sorting
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    } else if (sortBy === "featured") {
      // Show featured products first, then sort by createdAt
      filtered.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
    } else {
      // newest
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // All unique sizes present in products for filtering
  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes)));

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedPriceRange("all");
    setSelectedAvailability("all");
    setSelectedSize("all");
    setSortBy("newest");
    router.push("/collections");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="space-y-4 text-center pb-8 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          YUMI Creations
        </span>
        <h1 className="font-heading text-display-lg font-semibold text-charcoal">
          {selectedCategory && selectedCategory !== "all"
            ? categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Shop Products"
            : "Browse All Products"}
        </h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto font-light leading-relaxed">
          Carefully selected comfort wear designed to bring ease, style, and confidence to your daily life. Made with love and family values.
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-ivory-light border border-charcoal/5 rounded-lg shadow-soft">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-charcoal/10 rounded-md text-xs font-semibold uppercase tracking-wider text-charcoal hover:bg-charcoal/5 transition-all duration-300 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-blush" />
              <span>Filters</span>
            </button>
            <p className="text-sm text-charcoal-muted font-light hidden sm:block">
              Showing <span className="font-semibold text-charcoal">{filteredProducts.length}</span> products
            </p>
          </div>
          
          <div className="flex items-center gap-3">

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-blush" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-0 py-1 pl-1 pr-8 text-sm font-semibold text-charcoal outline-none cursor-pointer focus:ring-0"
                >
                  <option value="newest">Sort by: Newest</option>
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-charcoal/5 border border-charcoal/5 rounded-lg aspect-[3/4] flex flex-col justify-end p-5 space-y-3">
                  <div className="h-4 bg-charcoal/10 rounded w-1/4" />
                  <div className="h-6 bg-charcoal/10 rounded w-3/4" />
                  <div className="h-4 bg-charcoal/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
              <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-xl font-medium text-charcoal">No Products Found</h3>
                <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
                  We couldn&rsquo;t find any products matching your filters. Try clearing some selections.
                </p>
              </div>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-sm font-semibold tracking-wider rounded uppercase transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

      {/* Slide-Over Filters Panel */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 bg-charcoal/30 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="relative max-w-sm w-full bg-ivory shadow-elevated p-6 overflow-y-auto z-10 border-l border-charcoal/5 flex flex-col h-full animate-slide-in">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal/10">
              <h2 className="font-body text-base font-semibold text-charcoal flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blush" />
                <span>Filters</span>
              </h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1 hover:bg-charcoal/5 rounded-full"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-3 pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Category
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    router.push("/collections");
                  }}
                  className={`text-sm text-left py-1 flex items-center justify-between hover:text-blush transition-colors ${
                    selectedCategory === "all" || !selectedCategory ? "text-blush font-semibold" : "text-charcoal-muted"
                  }`}
                >
                  <span>All Categories</span>
                  {(selectedCategory === "all" || !selectedCategory) && <Check className="w-3.5 h-3.5" />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      router.push(`/collections?c=${cat.id}`);
                    }}
                    className={`text-sm text-left py-1 flex items-center justify-between hover:text-blush transition-colors ${
                      selectedCategory === cat.id || selectedCategory === cat.slug
                        ? "text-blush font-semibold"
                        : "text-charcoal-muted"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {(selectedCategory === cat.id || selectedCategory === cat.slug) && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="space-y-3 pt-6 border-t border-charcoal/5 mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Price Range
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "All Prices", value: "all" },
                  { label: "Under ₹1,000", value: "0-1000" },
                  { label: "₹1,000 - ₹2,000", value: "1000-2000" },
                  { label: "₹2,000 - ₹3,000", value: "2000-3000" },
                  { label: "Over ₹3,000", value: "3000" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setSelectedPriceRange(range.value);
                    }}
                    className={`text-sm text-left py-1 flex items-center justify-between hover:text-blush transition-colors ${
                      selectedPriceRange === range.value ? "text-blush font-semibold" : "text-charcoal-muted"
                    }`}
                  >
                    <span>{range.label}</span>
                    {selectedPriceRange === range.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 pt-6 border-t border-charcoal/5 mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Availability
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "All Statuses", value: "all" },
                  { label: "In Stock", value: "in-stock" },
                  { label: "Out of Stock", value: "out-of-stock" },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => {
                      setSelectedAvailability(status.value);
                    }}
                    className={`text-sm text-left py-1 flex items-center justify-between hover:text-blush transition-colors ${
                      selectedAvailability === status.value ? "text-blush font-semibold" : "text-charcoal-muted"
                    }`}
                  >
                    <span>{status.label}</span>
                    {selectedAvailability === status.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            {allSizes.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-charcoal/5 mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                  Sizes
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSize("all");
                    }}
                    className={`px-3 py-1.5 border text-xs font-medium rounded transition-all duration-300 ${
                      selectedSize === "all" ? "bg-navy border-navy text-ivory" : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/30"
                    }`}
                  >
                    All
                  </button>
                  {allSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                      }}
                      className={`px-3 py-1.5 border text-xs font-medium rounded transition-all duration-300 ${
                        selectedSize === size ? "bg-navy border-navy text-ivory" : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleClearFilters}
              className="mt-8 w-full py-2.5 bg-transparent border border-blush text-blush rounded text-xs font-semibold uppercase tracking-wider hover:bg-blush/5 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 bg-ivory min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}
