"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument } from "@/lib/firebase/firestore";
import { Policy, PolicySlug } from "@/types";
import { toast } from "react-hot-toast";
import { FileText, Save, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { renderPolicyContent } from "@/lib/utils/formatPolicy";

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<PolicySlug>("privacy-policy");

  // Editor content
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const list = await getCollection<Policy>("policies", []);
      setPolicies(list);

      // Set initial editor state
      const current = list.find((p) => p.slug === selectedSlug);
      if (current) {
        setTitle(current.title);
        setContent(current.content);
      } else {
        setDefaultEditorState(selectedSlug);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load policies.");
    } finally {
      setLoading(false);
    }
  };

  const setDefaultEditorState = (slug: PolicySlug) => {
    const titles: Record<PolicySlug, string> = {
      "privacy-policy": "Privacy Policy",
      "terms-conditions": "Terms & Conditions",
      "shipping-policy": "Shipping Policy",
      "return-refund-policy": "Return & Refund Policy",
    };
    setTitle(titles[slug]);
    setContent("");
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Update editor state when selected slug changes
  const handleSlugChange = (slug: PolicySlug) => {
    setSelectedSlug(slug);
    const current = policies.find((p) => p.slug === slug);
    if (current) {
      setTitle(current.title);
      setContent(current.content);
    } else {
      setDefaultEditorState(slug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      const id = selectedSlug;
      await setDocument("policies", id, {
        id,
        slug: selectedSlug,
        title,
        content,
        updatedAt: Timestamp.now(),
      });

      toast.success(`${title} saved successfully!`);
      // Reload lists
      const list = await getCollection<Policy>("policies", []);
      setPolicies(list);
    } catch (err) {
      toast.error("Failed to save policy.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Legal Config
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Policies Rich Text Editor
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left">
        {/* Sidebar selectors */}
        <aside className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block">Select Policy</span>
          {[
            { label: "Privacy Policy", value: "privacy-policy" },
            { label: "Terms & Conditions", value: "terms-conditions" },
            { label: "Shipping Policy", value: "shipping-policy" },
            { label: "Return & Refund Policy", value: "return-refund-policy" },
          ].map((item) => {
            const isActive = selectedSlug === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleSlugChange(item.value as PolicySlug)}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-navy text-ivory shadow-soft font-bold"
                    : "bg-ivory-light border border-charcoal/5 text-charcoal hover:bg-charcoal/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Editor Main Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-blush" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Policy Document Title</label>
                <input
                  type="text" required placeholder="Privacy Policy"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-3 text-sm focus:outline-none focus:border-blush text-charcoal font-semibold"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Document Text Content (Markdown Supported)</label>
                  <span className="text-[10px] text-charcoal-subtle italic">Double space line breaks for paragraph separation.</span>
                </div>
                <textarea
                  rows={15} required placeholder="Write policy terms here..."
                  className="w-full bg-transparent border border-charcoal/10 rounded p-4 text-sm font-light leading-relaxed focus:outline-none focus:border-blush text-charcoal"
                  value={content} onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-charcoal/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-navy"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Policy Document</span>
                </button>
              </div>
            </form>
          )}

          {/* Current Live Policy Document Preview */}
          <div className="mt-8 bg-ivory border border-charcoal/10 rounded-2xl p-6 md:p-8 space-y-4 shadow-soft">
            <div className="flex items-center justify-between border-b border-charcoal/10 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-blush">Live Storefront Preview</span>
              <span className="text-xs text-charcoal-subtle italic">Saved Document Details</span>
            </div>
            <h3 className="font-heading text-2xl font-bold text-navy">{title || "Policy Title"}</h3>
            <div className="bg-ivory-light border border-charcoal/10 rounded-xl p-6 shadow-sm">
              {renderPolicyContent(content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
