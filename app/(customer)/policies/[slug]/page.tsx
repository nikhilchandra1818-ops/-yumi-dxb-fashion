"use client";

import React, { useState, useEffect, use } from "react";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Policy, PolicySlug } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { renderPolicyContent } from "@/lib/utils/formatPolicy";

export default function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  const policyTitles: Record<string, string> = {
    "privacy-policy": "Privacy Policy",
    "terms-conditions": "Terms & Conditions",
    "shipping-policy": "Shipping Policy",
    "return-refund-policy": "Return & Refund Policy",
  };

  const defaultPolicies: Record<string, string> = {
    "privacy-policy": "We value your privacy. Your personal information (name, address, email, phone) is collected solely to process your orders, provide customer support, and communicate updates. We do not sell or share your data with third parties except as necessary to fulfill delivery (courier partners) or process secure payments.",
    "terms-conditions": "Welcome to YUMI DXB Fashion. By browsing and purchasing from this website, you agree to comply with our terms. Products are subject to availability. Prices listed are in INR (inclusive of taxes where applicable). All content (logos, copy, designs, images) is the property of YUMI DXB and may not be reproduced without written permission.",
    "shipping-policy": "We ship Pan-India. Standard shipping rates apply and are configured at checkout. Orders are dispatched from Mangaluru within 2-3 business days. Delivery typically takes 5-7 business days depending on location. Tracking information will be emailed/messaged to you once your order is shipped.",
    "return-refund-policy": "We accept returns and exchanges on unused, tagged, and unwashed items in their original packaging within 7 days of delivery. Returns must be requested via your Account dashboard. Once received and inspected, refunds will be credited to the original payment method within 5-7 business days. Shipping charges are non-refundable.",
  };

  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const data = await getCollection<Policy>("policies", [
          where("slug", "==", slug as PolicySlug),
        ]);

        if (data.length > 0) {
          setPolicy(data[0]);
        } else {
          // Fallback if not configured in database yet
          const fallbackTitle = policyTitles[slug] || "Store Policy";
          const fallbackContent = defaultPolicies[slug] || "Store policy content will be configured here.";
          setPolicy({
            id: slug,
            slug: slug as PolicySlug,
            title: fallbackTitle,
            content: fallbackContent,
            updatedAt: null as any,
          });
        }
      } catch (err) {
        console.error("Error loading store policy:", err);
        toast.error("Failed to load policy.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPolicy();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-charcoal">Policy Not Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Policy Header */}
        <div className="text-center space-y-3 pb-8 border-b border-charcoal/10">
          <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3.5 py-1.5 rounded-full inline-block">
            LEGAL & COMPLIANCE
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-navy font-bold tracking-tight">
            {policy.title}
          </h1>
          {policy.updatedAt && (
            <p className="text-xs text-charcoal-subtle font-medium">
              Last updated: {new Date((policy.updatedAt as any).seconds * 1000).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Clean Styled Policy Container */}
        <div className="bg-ivory-light border border-charcoal/10 rounded-2xl p-8 sm:p-12 shadow-card">
          {renderPolicyContent(policy.content)}
        </div>
      </div>
    </div>
  );
}
