"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/context/SettingsContext";
import { Logo } from "../shared/Logo";
import { createDocument, getCollection, where } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { Phone, Mail, MapPin, Send, Loader2 } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

import { NewsletterSubscriber } from "@/types";
import { Timestamp } from "firebase/firestore";

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Check if duplicate subscriber exists in Firestore
      const existing = await getCollection<NewsletterSubscriber>("newsletterSubscribers", [
        where("email", "==", email.toLowerCase().trim()),
      ]);

      if (existing.length > 0) {
        toast.success("You are already subscribed to our newsletter!");
        setEmail("");
      } else {
        // Save subscriber to Firestore
        await createDocument("newsletterSubscribers", {
          email: email.toLowerCase().trim(),
          isActive: true,
          subscribedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success("Thank you for subscribing to our newsletter!");
        setEmail("");
      }
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const collectionsLinks = [
    { label: "Premium Floral Nightwear", href: "/collections?c=premium-floral-nightwear" },
    { label: "Elegant Abayas", href: "/collections?c=abayas" },
    { label: "Graceful Kaftans", href: "/collections?c=kaftans" },
    { label: "Stylish Co-ord Sets", href: "/collections?c=co-ords" },
  ];

  const serviceLinks = [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Privacy Policy", href: "/policies/privacy-policy" },
    { label: "Terms & Conditions", href: "/policies/terms-conditions" },
    { label: "Shipping Policy", href: "/policies/shipping-policy" },
    { label: "Return & Refund Policy", href: "/policies/return-refund-policy" },
  ];

  return (
    <footer className="bg-charcoal text-ivory pt-16 pb-8 mt-auto border-t border-charcoal-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Column 1: Brand Info */}
        <div className="space-y-6">
          <Logo size="md" variant="light" className="!-ml-4" />
          <p className="font-heading text-lg italic text-ivory-dark/80">
            &ldquo;{settings.tagline}&rdquo;
          </p>
          <p className="text-sm text-ivory-dark/60 leading-relaxed max-w-sm">
            Two sisters transformed their passion for fashion into a brand that believes every woman deserves to feel comfortable, elegant, and confident.
          </p>
        </div>

        {/* Column 2: Products Links */}
        <div>
          <h4 className="font-heading text-lg font-semibold tracking-wider text-ivory mb-6 uppercase">
            Shop Products
          </h4>
          <ul className="space-y-3">
            {collectionsLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-ivory-dark/70 hover:text-blush transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Customer Service & Policies */}
        <div>
          <h4 className="font-heading text-lg font-semibold tracking-wider text-ivory mb-6 uppercase">
            Customer Care
          </h4>
          <ul className="space-y-3">
            {serviceLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-ivory-dark/70 hover:text-blush transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Newsletter & Contact */}
        <div className="space-y-6">
          <h4 className="font-heading text-lg font-semibold tracking-wider text-ivory uppercase">
            Stay Connected
          </h4>
          <p className="text-sm text-ivory-dark/60">
            Subscribe to our newsletter for exclusive collections and event updates.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-charcoal-light/80 border border-ivory/15 px-4 py-2.5 text-sm text-ivory rounded-md focus:outline-none focus:border-blush focus:ring-1 focus:ring-blush/30 placeholder-ivory-dark/40 transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
            <button
              type="submit"
              className="bg-blush hover:bg-blush-dark text-ivory px-4 rounded-md transition-all duration-300 flex items-center justify-center disabled:opacity-50 active:scale-95 shadow-soft"
              disabled={submitting}
              aria-label="Subscribe"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          <div className="space-y-3 pt-2 border-t border-ivory/10">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-3 text-sm text-ivory-dark/70 hover:text-blush transition-colors"
              >
                <Phone className="w-4 h-4 text-blush" />
                <span>{settings.phone}</span>
              </a>
            )}
            {settings.businessEmail && (
              <a
                href={`mailto:${settings.businessEmail}`}
                className="flex items-center gap-3 text-sm text-ivory-dark/70 hover:text-blush transition-colors"
              >
                <Mail className="w-4 h-4 text-blush" />
                <span>{settings.businessEmail}</span>
              </a>
            )}
            {settings.address && (
              <div className="flex items-start gap-3 text-sm text-ivory-dark/70">
                <MapPin className="w-4 h-4 text-blush mt-0.5 flex-shrink-0" />
                <span>{settings.address}</span>
              </div>
            )}
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-ivory-dark/70 hover:text-blush transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-blush" />
                <span>@{settings.instagram}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-ivory/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ivory-dark/40">
        <p>
          &copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.
        </p>
        <p className="flex gap-4">
          <span>Mangaluru, India</span>
          <span>•</span>
          <span>Pan India Delivery</span>
          <span>•</span>
          <span>Est. 2024</span>
        </p>
      </div>
    </footer>
  );
};
