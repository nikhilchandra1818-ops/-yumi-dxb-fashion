"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { Testimonial } from "@/types";
import { toast } from "react-hot-toast";
import { Star, Edit2, Trash2, Eye, EyeOff, Plus, Loader2, Inbox, Quote } from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const list = await getCollection<Testimonial>("testimonials", []);
      list.sort((a, b) => a.displayOrder - b.displayOrder);
      setTestimonials(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenForm = (t: Testimonial | null = null) => {
    setEditingTestimonial(t);
    if (t) {
      setCustomerName(t.customerName);
      setLocation(t.location || "");
      setRating(t.rating);
      setComment(t.comment);
      setDisplayOrder(String(t.displayOrder));
      setIsPublished(t.isPublished);
    } else {
      setCustomerName("");
      setLocation("");
      setRating(5);
      setComment("");
      setDisplayOrder(String(testimonials.length + 1));
      setIsPublished(true);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !comment || !displayOrder) {
      toast.error("Please fill in customer name, comment, and display order.");
      return;
    }

    setLoading(true);
    const id = editingTestimonial?.id || `testimonial_${Date.now()}`;

    try {
      const testimonialData: Omit<Testimonial, "id" | "createdAt" | "updatedAt"> = {
        customerName,
        location: location.trim() || undefined,
        rating,
        comment,
        displayOrder: parseInt(displayOrder) || 1,
        isPublished,
      };

      await setDocument("testimonials", id, {
        id,
        ...testimonialData,
        createdAt: editingTestimonial?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success(editingTestimonial ? "Testimonial updated!" : "Testimonial created!");
      setIsFormOpen(false);
      await fetchTestimonials();
    } catch (err) {
      toast.error("Failed to save testimonial.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete testimonial from "${name}"?`)) return;

    setLoading(true);
    try {
      await deleteDocument("testimonials", id);
      toast.success("Testimonial deleted.");
      await fetchTestimonials();
    } catch (err) {
      toast.error("Failed to delete testimonial.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (t: Testimonial) => {
    try {
      await setDocument("testimonials", t.id, { isPublished: !t.isPublished }, true);
      toast.success(t.isPublished ? "Testimonial hidden." : "Testimonial published live!");
      await fetchTestimonials();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            CMS Configurations
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Testimonials CMS
          </h1>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
        >
          + Add Testimonial
        </button>
      </div>

      {/* Grid: List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : testimonials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4 text-left relative flex flex-col justify-between"
            >
              <Quote className="w-8 h-8 text-blush-subtle/50 absolute top-4 right-4" />
              <div className="space-y-3">
                <div className="flex gap-0.5 text-blush">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-charcoal-muted leading-relaxed font-light italic line-clamp-4">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              <div className="border-t border-charcoal/5 pt-4 mt-4 flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-base font-semibold text-charcoal">{t.customerName}</h4>
                  {t.location && <span className="text-[10px] text-charcoal-subtle">{t.location}</span>}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <button
                    onClick={() => handlePublishToggle(t)}
                    className={`p-1 rounded hover:bg-charcoal/5 ${t.isPublished ? "text-navy" : "text-charcoal-subtle"}`}
                    title={t.isPublished ? "Hide from homepage" : "Show on homepage"}
                  >
                    {t.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenForm(t)}
                    className="p-1 border border-charcoal/10 rounded-full text-navy hover:text-navy-light inline-flex items-center justify-center bg-transparent"
                    title="Edit Testimonial"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.customerName)}
                    className="p-1 border border-charcoal/10 rounded-full text-red-600 hover:text-red-700 inline-flex items-center justify-center bg-transparent"
                    title="Delete Testimonial"
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
            <h3 className="font-heading text-xl font-medium text-charcoal">No Testimonials Configured</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              Add stories and reviews from your happy customers to display in the testimonials slider on the homepage.
            </p>
          </div>
          <button
            onClick={() => handleOpenForm(null)}
            className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy inline-block"
          >
            Create First Testimonial
          </button>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal Content */}
          <div className="bg-ivory w-full max-w-md rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Customer Name *</label>
                <input
                  type="text" required placeholder="Jane Smith"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Customer Location</label>
                  <input
                    type="text" placeholder="Dubai, UAE / Mangaluru"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={location} onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                {/* Display Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Display Order *</label>
                  <input
                    type="number" required placeholder="1"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block">Star Rating</label>
                <div className="flex gap-1.5 text-charcoal-subtle">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const ratingVal = idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRating(ratingVal)}
                        className={`p-0.5 transition-colors ${
                          ratingVal <= rating ? "text-blush" : "text-charcoal-subtle hover:text-blush/60"
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
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted font-body">Customer Comment *</label>
                <textarea
                  rows={4} required placeholder="Absolutely loved the kaftan! Super comfortable fabric..."
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={comment} onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="testimonial-publish" type="checkbox"
                  className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                  checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                />
                <label htmlFor="testimonial-publish" className="text-xs text-charcoal-muted font-light">Publish Live on Homepage</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/5 mt-4">
                <button
                  type="button" onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-charcoal/15 text-charcoal hover:bg-charcoal/5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-ivory hover:bg-navy-light rounded text-xs font-semibold uppercase tracking-wider shadow-navy"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
