"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product } from "@/types";
import { Search as SearchIcon, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchSearchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching search products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchProducts();
  }, []);

  // Filtering products based on query (handles case-insensitive matches on name, category, collection, fabric)
  const getSearchResults = () => {
    const q = queryParam.toLowerCase().trim();
    if (!q) return [];

    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const categoryMatch = p.categoryName.toLowerCase().includes(q);
      const collectionMatch = p.collectionName?.toLowerCase().includes(q) || false;
      const fabricMatch = p.fabric.toLowerCase().includes(q);
      
      return nameMatch || categoryMatch || collectionMatch || fabricMatch;
    });
  };

  const searchResults = getSearchResults();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Bar Header */}
      <div className="space-y-4 text-center pb-8 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Search Results
        </span>
        <h1 className="font-heading text-display-md font-semibold text-charcoal flex items-center justify-center gap-3">
          <span>Search for: &ldquo;{queryParam}&rdquo;</span>
        </h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto font-light">
          We found <span className="font-semibold text-charcoal">{searchResults.length}</span> items matching your search.
        </p>
      </div>

      {/* Results grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-charcoal/5 border border-charcoal/5 rounded-lg aspect-[3/4] flex flex-col justify-end p-5 space-y-3">
                <div className="h-4 bg-charcoal/10 rounded w-1/4" />
                <div className="h-6 bg-charcoal/10 rounded w-3/4" />
                <div className="h-4 bg-charcoal/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResults.map((product) => (
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
              <SearchIcon className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-xl font-medium text-charcoal">No Items Found</h3>
              <p className="text-sm text-charcoal-muted max-w-xs mx-auto font-light leading-relaxed">
                We couldn&rsquo;t find anything matching your search. Check for spelling errors or browse our categories.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <form action="/search" className="flex max-w-md w-full border border-charcoal/20 rounded overflow-hidden">
                <input
                  type="text"
                  name="q"
                  placeholder="Try 'Abaya' or 'Kaftan'..."
                  className="w-full bg-transparent px-4 py-2 text-sm focus:outline-none text-charcoal"
                />
                <button
                  type="submit"
                  className="bg-navy hover:bg-navy-light text-ivory px-5 text-sm uppercase tracking-wider font-semibold transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 bg-ivory min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
