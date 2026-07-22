"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { FAQ, FaqCategory } from "@/types";
import { toast } from "react-hot-toast";
import {
  HelpCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Inbox,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<FaqCategory>("general");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const list = await getCollection<FAQ>("faqs", []);
      // Sort category then displayOrder
      list.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.displayOrder - b.displayOrder;
      });
      setFaqs(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenForm = (faq: FAQ | null = null) => {
    setEditingFaq(faq);
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setCategory(faq.category);
      setDisplayOrder(String(faq.displayOrder));
      setIsPublished(faq.isPublished);
    } else {
      setQuestion("");
      setAnswer("");
      setCategory("general");
      setDisplayOrder(String(faqs.length + 1));
      setIsPublished(true);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question || !answer || !displayOrder) {
      toast.error("Please fill in question, answer, and display order.");
      return;
    }

    setLoading(true);
    const id = editingFaq?.id || `faq_${Date.now()}`;

    try {
      const faqData: Omit<FAQ, "id" | "createdAt" | "updatedAt"> = {
        question,
        answer,
        category,
        displayOrder: parseInt(displayOrder) || 1,
        isPublished,
      };

      await setDocument("faqs", id, {
        id,
        ...faqData,
        createdAt: editingFaq?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success(editingFaq ? "FAQ updated!" : "FAQ created!");
      setIsFormOpen(false);
      await fetchFaqs();
    } catch (err) {
      toast.error("Failed to save FAQ.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, q: string) => {
    if (!confirm(`Are you sure you want to delete FAQ "${q.slice(0, 30)}..."?`)) return;

    setLoading(true);
    try {
      await deleteDocument("faqs", id);
      toast.success("FAQ deleted.");
      await fetchFaqs();
    } catch (err) {
      toast.error("Failed to delete FAQ.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (faq: FAQ) => {
    try {
      await setDocument("faqs", faq.id, { isPublished: !faq.isPublished }, true);
      toast.success(faq.isPublished ? "FAQ unpublished." : "FAQ published live!");
      await fetchFaqs();
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
            FAQ Management
          </h1>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
        >
          + Add FAQ
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : faqs.length > 0 ? (
        <div className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  <th className="p-4 pl-6">Question</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Display Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-sm">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-charcoal/[0.02] transition-colors">
                    <td className="p-4 pl-6 max-w-md space-y-1">
                      <div className="font-semibold text-charcoal">{faq.question}</div>
                      <div className="text-xs text-charcoal-muted line-clamp-2 font-light leading-relaxed">{faq.answer}</div>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wider text-blush">{faq.category}</td>
                    <td className="p-4 font-semibold text-charcoal">{faq.displayOrder}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handlePublishToggle(faq)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          faq.isPublished
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {faq.isPublished ? "Live" : "Draft"}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenForm(faq)}
                        className="p-2 border border-charcoal/10 hover:border-navy text-navy rounded-full inline-flex items-center justify-center bg-transparent"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id, faq.question)}
                        className="p-2 border border-charcoal/10 hover:border-red-600 text-red-600 rounded-full inline-flex items-center justify-center bg-transparent"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No FAQs Configured</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              Add answers to common queries to help your customers check sizing, shipping times, and policies.
            </p>
          </div>
          <button
            onClick={() => handleOpenForm(null)}
            className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy inline-block"
          >
            Create First FAQ
          </button>
        </div>
      )}

      {/* FAQ FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal Content */}
          <div className="bg-ivory w-full max-w-md rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
              {editingFaq ? "Edit FAQ" : "Add FAQ"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {/* Question */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Question *</label>
                <input
                  type="text" required placeholder="What is your return policy?"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={question} onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              {/* Answer */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Answer *</label>
                <textarea
                  rows={4} required placeholder="We support returns and exchanges within 7 days..."
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={answer} onChange={(e) => setAnswer(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Category *</label>
                  <select
                    value={category} onChange={(e) => setCategory(e.target.value as FaqCategory)}
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-xs text-charcoal focus:outline-none"
                  >
                    <option value="general">General</option>
                    <option value="orders">Orders</option>
                    <option value="payments">Payments</option>
                    <option value="shipping">Shipping</option>
                    <option value="returns">Returns</option>
                    <option value="products">Products</option>
                    <option value="account">Account</option>
                  </select>
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

              {/* Publish Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="faq-published" type="checkbox"
                  className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                  checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                />
                <label htmlFor="faq-published" className="text-xs text-charcoal-muted font-light">Publish Live</label>
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
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
