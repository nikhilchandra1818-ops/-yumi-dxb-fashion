"use client";

import React, { useState, useEffect } from "react";
import { getCollection, where, orderBy } from "@/lib/firebase/firestore";
import { FAQ, FaqCategory } from "@/types";
import { ChevronDown, Plus, Minus, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const data = await getCollection<FAQ>("faqs", [
          where("isPublished", "==", true),
          orderBy("displayOrder", "asc"),
        ]);
        setFaqs(data);
      } catch (err) {
        console.error("Error loading FAQs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const defaultFaqs: FAQ[] = [
    {
      id: "d1",
      question: "What is your delivery policy?",
      answer: "We offer Pan-India delivery via secure, tracked courier partners. Shipping is calculated at checkout. Typically orders are shipped within 2-3 business days and delivered within 5-7 business days depending on your location.",
      category: "shipping",
      displayOrder: 1,
      isPublished: true,
      createdAt: null as any,
      updatedAt: null as any,
    },
    {
      id: "d2",
      question: "Do you support returns and exchanges?",
      answer: "Yes! We support returns and exchanges within 7 days of delivery. The item must be unused, in its original packaging, and with all tags intact. To initiate a return, please contact us or request it from your Account dashboard.",
      category: "returns",
      displayOrder: 2,
      isPublished: true,
      createdAt: null as any,
      updatedAt: null as any,
    },
    {
      id: "d3",
      question: "How do I choose the correct size?",
      answer: "We include detailed size charts on every product detail page. For Abayas, Kaftans, and loungewear, fits are designed to be comfortable and flowing. If you have custom sizing queries, please contact us via WhatsApp or our Contact form.",
      category: "products",
      displayOrder: 3,
      isPublished: true,
      createdAt: null as any,
      updatedAt: null as any,
    },
    {
      id: "d4",
      question: "What payment options are available?",
      answer: "We accept all major credit and debit cards, UPI payments, and NetBanking. Payments are processed securely via our configured payment gateways. Cash on Delivery (COD) may be available depending on the configured settings.",
      category: "payments",
      displayOrder: 4,
      isPublished: true,
      createdAt: null as any,
      updatedAt: null as any,
    },
  ];

  const faqsToDisplay = faqs.length > 0 ? faqs : defaultFaqs;

  const categories = [
    { label: "All Questions", value: "all" },
    { label: "Orders", value: "orders" },
    { label: "Payments", value: "payments" },
    { label: "Shipping", value: "shipping" },
    { label: "Returns", value: "returns" },
    { label: "Products", value: "products" },
    { label: "Account", value: "account" },
    { label: "General", value: "general" },
  ];

  const filteredFaqs =
    activeCategory === "all"
      ? faqsToDisplay
      : faqsToDisplay.filter((f) => f.category === activeCategory);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Page Header */}
      <div className="space-y-4 text-center pb-8 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Customer Service
        </span>
        <h1 className="font-heading text-display-lg font-semibold text-charcoal">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto font-light leading-relaxed">
          Find fast answers to common questions about orders, shipping, returns, payment methods, and fabric care.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-charcoal/5 pb-6">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value);
              setOpenIndex(null);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all duration-300 ${
              activeCategory === cat.value
                ? "bg-navy text-ivory shadow-soft"
                : "bg-ivory-light border border-charcoal/5 text-charcoal hover:bg-charcoal/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openIndex === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft transition-all duration-300"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-heading text-lg font-medium text-charcoal pr-4">
                    {faq.question}
                  </span>
                  <span className={`p-1 rounded-full bg-charcoal/5 text-charcoal-muted transition-transform duration-300 ${
                    isOpen ? "rotate-180 text-blush bg-blush-subtle" : ""
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-charcoal/5 p-6 bg-ivory/30" : "max-h-0 overflow-hidden"
                  }`}
                >
                  <p className="text-sm text-charcoal-muted leading-relaxed font-light">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-charcoal-muted text-sm font-light">
            No FAQs found under this category. Please check back later.
          </div>
        )}
      </div>

      {/* Contact callout */}
      <div className="bg-blush-subtle/30 border border-blush/10 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
        <HelpCircle className="w-8 h-8 text-blush mx-auto" />
        <h3 className="font-heading text-xl font-medium text-charcoal">Still have questions?</h3>
        <p className="text-xs text-charcoal-muted font-light leading-relaxed max-w-xs mx-auto">
          If you couldn&rsquo;t find an answer here, feel free to contact us directly. We are always happy to help.
        </p>
        <div className="pt-2">
          <a
            href="/contact"
            className="inline-block px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy transition-all"
          >
            Contact Customer Support
          </a>
        </div>
      </div>
    </div>
  );
}
