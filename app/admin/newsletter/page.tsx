"use client";

import React, { useState, useEffect } from "react";
import { getCollection, deleteDocument, setDocument } from "@/lib/firebase/firestore";
import { NewsletterSubscriber } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { UserCheck, Trash2, Search, Loader2, Inbox } from "lucide-react";

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const list = await getCollection<NewsletterSubscriber>("newsletterSubscribers", []);
      // Sort newest first
      list.sort((a, b) => (b.subscribedAt?.seconds || 0) - (a.subscribedAt?.seconds || 0));
      setSubscribers(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load newsletter subscriber list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove "${email}" from the newsletter list?`)) return;

    setLoading(true);
    try {
      await deleteDocument("newsletterSubscribers", id);
      toast.success("Subscriber removed successfully.");
      await fetchSubscribers();
    } catch (err) {
      toast.error("Failed to delete subscriber.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sub: NewsletterSubscriber) => {
    try {
      await setDocument("newsletterSubscribers", sub.id, { isActive: !sub.isActive }, true);
      toast.success(sub.isActive ? "Subscriber disabled." : "Subscriber activated!");
      await fetchSubscribers();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Marketing Console
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Newsletter Subscribers
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
            placeholder="Search subscriber email..."
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
      ) : filteredSubscribers.length > 0 ? (
        <div className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  <th className="p-4 pl-6">Subscriber Email</th>
                  <th className="p-4">Date Subscribed</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-sm">
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-charcoal/[0.02] transition-colors">
                    <td className="p-4 pl-6 font-semibold text-charcoal">{sub.email}</td>
                    <td className="p-4 text-xs font-medium text-charcoal-muted">{formatDate(sub.subscribedAt)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(sub)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          sub.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {sub.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDelete(sub.id, sub.email)}
                        className="p-2 border border-charcoal/10 hover:border-red-600 text-red-600 rounded-full inline-flex items-center justify-center bg-transparent"
                        title="Delete Subscriber"
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
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Subscribers Yet</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              When customers sign up for email updates, their details will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
