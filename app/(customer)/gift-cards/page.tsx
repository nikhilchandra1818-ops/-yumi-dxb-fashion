"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Gift, Mail, Heart, ShoppingBag, Sparkles, Check, ArrowRight } from "lucide-react";

export default function GiftCardsPage() {
  const { addToCart } = useCart();

  const [selectedAmount, setSelectedAmount] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);

  const amount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 500) {
      toast.error("Minimum gift card value is ₹500.");
      return;
    }
    if (!recipientName || !recipientEmail || !senderName) {
      toast.error("Please fill in sender, recipient name, and email.");
      return;
    }

    setAdding(true);
    try {
      await addToCart(
        {
          productId: `giftcard_${Date.now()}`,
          productName: `Digital Luxury Gift Voucher (${formatCurrency(amount)})`,
          productSlug: "gift-card",
          imageUrl: "/images/hero_main.jpg",
          size: "Digital Voucher",
          color: "Luxury Envelope",
          price: amount,
          maxStock: 99,
        },
        1
      );
      toast.success("Digital Luxury Gift Card added to cart!");
    } catch (err) {
      toast.error("Failed to add gift card.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
            <Gift className="w-3.5 h-3.5" />
            <span>Digital Atelier Gifting</span>
          </span>
          <h1 className="font-heading text-display-lg text-charcoal font-semibold">
            Digital Luxury Gift Voucher
          </h1>
          <p className="text-sm text-charcoal-muted max-w-lg mx-auto font-light leading-relaxed">
            Give the gift of pure comfort. Customize a digital luxury gift voucher with a live preview of our signature wax-sealed atelier postal envelope.
          </p>
        </div>

        {/* Main Grid: Form + Live Envelope Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Form */}
          <form onSubmit={handleAddToCart} className="bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft space-y-6">
            <h2 className="font-heading text-2xl text-charcoal font-medium">
              1. Choose Gift Amount
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {[1000, 2500, 5000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                    selectedAmount === amt && !customAmount
                      ? "bg-navy text-ivory border-navy shadow-navy"
                      : "bg-ivory text-charcoal border-charcoal/10 hover:border-blush"
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-muted mb-2">
                Or Custom Amount (₹)
              </label>
              <input
                type="number"
                min="500"
                step="100"
                placeholder="e.g. 3500"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-ivory border border-charcoal/10 rounded-xl p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
              />
            </div>

            <hr className="border-charcoal/5" />

            <h2 className="font-heading text-2xl text-charcoal font-medium">
              2. Personalize Envelope Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-muted mb-2">
                  Sender Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-ivory border border-charcoal/10 rounded-xl p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-muted mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-ivory border border-charcoal/10 rounded-xl p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-muted mb-2">
                Recipient Email *
              </label>
              <input
                type="email"
                required
                placeholder="recipient@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full bg-ivory border border-charcoal/10 rounded-xl p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal-muted mb-2">
                Personal Handwritten Message
              </label>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Wishing you warmth, elegance, and sweet relaxation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-ivory border border-charcoal/10 rounded-xl p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full py-4 bg-blush hover:bg-blush-dark text-ivory font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-soft flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Gift Voucher ({formatCurrency(amount)})</span>
            </button>
          </form>

          {/* Live Envelope Preview */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-blush font-semibold block text-center lg:text-left">
              Live Envelope Preview
            </span>

            <motion.div
              layout
              className="bg-[#FAF6F0] border-2 border-[#D4A373]/30 rounded-2xl p-8 sm:p-10 shadow-elevated relative overflow-hidden min-h-[380px] flex flex-col justify-between"
            >
              {/* Wax Seal */}
              <div className="absolute top-6 right-6 w-14 h-14 bg-blush rounded-full shadow-soft flex items-center justify-center text-ivory border-2 border-ivory/50">
                <span className="font-heading font-bold text-xs tracking-tighter">YUMI</span>
              </div>

              {/* Envelope Header */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-blush font-bold block">
                  Mangaluru Atelier Voucher
                </span>
                <h3 className="font-heading text-4xl font-semibold text-navy">
                  {formatCurrency(amount)}
                </h3>
              </div>

              {/* Handwritten Message Area */}
              <div className="my-6 p-4 bg-ivory/80 rounded-xl border border-charcoal/5 space-y-2 italic font-heading text-lg text-charcoal">
                <p className="text-sm font-sans not-italic text-charcoal-subtle font-light">
                  To: <span className="font-semibold text-charcoal">{recipientName || "Recipient Name"}</span>
                </p>
                <p className="leading-relaxed font-light">
                  &ldquo;{message || "Wishing you warmth, elegance, and sweet relaxation..."}&rdquo;
                </p>
                <p className="text-xs font-sans not-italic text-charcoal-subtle font-light text-right pt-2 border-t border-charcoal/5">
                  With love, <span className="font-semibold text-charcoal">{senderName || "Sender Name"}</span>
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-charcoal-subtle uppercase tracking-widest pt-4 border-t border-charcoal/10">
                <span>YUMI DXB Fashion</span>
                <span>Pan-India Delivery</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
