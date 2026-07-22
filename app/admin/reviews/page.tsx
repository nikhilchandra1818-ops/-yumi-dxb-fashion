"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { Review, Product } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Star, CheckCircle, EyeOff, Trash2, Search, Loader2, Inbox } from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReviewsData = async () => {
    setLoading(true);
    try {
      const [revList, prodList] = await Promise.all([
        getCollection<Review>("reviews", []),
        getCollection<Product>("products", []),
      ]);
      // Sort newest first
      revList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReviews(revList);
      setProducts(prodList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const handleApprove = async (review: Review) => {
    try {
      await setDocument("reviews", review.id, { isApproved: true, isHidden: false }, true);
      toast.success("Review approved and published live!");
      await fetchReviewsData();
    } catch (err) {
      toast.error("Failed to approve review.");
    }
  };

  const handleHide = async (review: Review) => {
    try {
      await setDocument("reviews", review.id, { isApproved: false, isHidden: true }, true);
      toast.success("Review hidden from catalog.");
      await fetchReviewsData();
    } catch (err) {
      toast.error("Failed to hide review.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      await deleteDocument("reviews", id);
      toast.success("Review deleted successfully.");
      await fetchReviewsData();
    } catch (err) {
      toast.error("Failed to delete review.");
    }
  };

  const getProductName = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    return prod ? prod.name : "Unknown apparel";
  };

  const filteredReviews = reviews.filter(
    (rev) =>
      rev.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductName(rev.productId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Quality Assurance
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Review Moderation
          </h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft flex items-center">
        <div className="relative rounded-md shadow-sm w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-subtle">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name, comment, product..."
            className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blush">
                    {getProductName(rev.productId)}
                  </span>
                  <span className="text-[10px] text-charcoal-subtle">{formatDate(rev.createdAt)}</span>
                </div>
                <div className="flex gap-0.5 text-blush">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed font-light italic line-clamp-4">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="border-t border-charcoal/5 pt-4 mt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-base font-semibold text-charcoal">{rev.userName}</h4>
                  <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                    rev.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {rev.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  {!rev.isApproved ? (
                    <button
                      onClick={() => handleApprove(rev)}
                      className="p-1.5 border border-charcoal/10 rounded-full text-green-600 hover:text-green-700 bg-transparent flex items-center justify-center"
                      title="Approve & Publish Live"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHide(rev)}
                      className="p-1.5 border border-charcoal/10 rounded-full text-yellow-600 hover:text-yellow-700 bg-transparent flex items-center justify-center"
                      title="Hide from catalog"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 border border-charcoal/10 rounded-full text-red-600 hover:text-red-700 inline-flex items-center justify-center bg-transparent"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <Star className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Reviews to Moderate</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              When purchasers submit reviews, they will appear here for admin moderation before being displayed live.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
