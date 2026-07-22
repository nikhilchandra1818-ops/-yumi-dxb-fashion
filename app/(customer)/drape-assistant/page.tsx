"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product } from "@/types";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RotateCcw, Check, Compass, Heart, Loader2 } from "lucide-react";

export default function DrapeAssistantPage() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    climate: "",
    fabric: "",
    silhouette: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    { product: Product; matchScore: number; matchReasons: string[] }[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch active products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const list = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);
        setProducts(list);
      } catch (err) {
        console.error("Error loading products for assistant:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSelect = (key: "climate" | "fabric" | "silhouette", value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    if (step < 3) {
      setStep(step + 1);
    } else {
      calculateMatches(updated);
      setStep(4);
    }
  };

  const calculateMatches = (finalAnswers: typeof answers) => {
    if (products.length === 0) return;

    const scored: { product: Product; matchScore: number; matchReasons: string[] }[] = [];

    for (const p of products) {
      let score = 50; // Base score
      const reasons: string[] = [];

      const fab = (p.fabric || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const desc = ((p.description || "") + " " + (p.shortDescription || "")).toLowerCase();
      const catName = (p.categoryName || "").toLowerCase();
      const fullText = `${name} ${desc} ${fab} ${catName}`;

      // 1. Universal Fabric & Touch Match (+30 pts)
      let fabricMatched = false;
      if (finalAnswers.fabric === "cotton" && (fab.includes("cotton") || fab.includes("linen") || fab.includes("modal"))) {
        score += 30;
        reasons.push(p.fabric ? `${p.fabric} Fabric` : "Soft Natural Touch");
        fabricMatched = true;
      } else if (finalAnswers.fabric === "modal" && (fab.includes("modal") || fab.includes("jersey"))) {
        score += 30;
        reasons.push("Breathable Stretch Touch");
        fabricMatched = true;
      } else if (finalAnswers.fabric === "rayon" && (fab.includes("rayon") || fab.includes("crepe") || fab.includes("viscose"))) {
        score += 30;
        reasons.push("Cooling Fluid Touch");
        fabricMatched = true;
      } else if (finalAnswers.fabric === "satin" && (fab.includes("satin") || fab.includes("silk"))) {
        score += 30;
        reasons.push("Luxury Satin Sheen");
        fabricMatched = true;
      } else if (finalAnswers.fabric === "any") {
        score += 25;
        reasons.push(p.fabric ? `${p.fabric} Fabric` : "Versatile Comfort");
        fabricMatched = true;
      }

      // 2. Universal Silhouette & Category Match (+25 pts)
      let silhouetteMatched = false;
      if (
        finalAnswers.silhouette === "relaxed" &&
        (fullText.includes("kaftan") || fullText.includes("abaya") || fullText.includes("maxi") || fullText.includes("robe") || fullText.includes("gown") || fullText.includes("loose") || fullText.includes("flowing") || fullText.includes("nightwear"))
      ) {
        score += 25;
        reasons.push(p.categoryName || "Flowing Relaxed Silhouette");
        silhouetteMatched = true;
      } else if (
        finalAnswers.silhouette === "structured" &&
        (fullText.includes("set") || fullText.includes("co-ord") || fullText.includes("coord") || fullText.includes("suit") || fullText.includes("robe") || fullText.includes("2-piece"))
      ) {
        score += 25;
        reasons.push(p.categoryName || "Tailored Co-ord Cut");
        silhouetteMatched = true;
      } else if (finalAnswers.silhouette === "versatile") {
        score += 20;
        reasons.push("Versatile Fit");
        silhouetteMatched = true;
      }

      // 3. Universal Climate / Wear Vibe Match (+15 pts)
      if (finalAnswers.climate === "ac" && (fab.includes("cotton") || fab.includes("modal") || fullText.includes("cozy") || fullText.includes("robe"))) {
        score += 15;
        reasons.push("Indoor AC Comfort");
      } else if (finalAnswers.climate === "breeze" && (fab.includes("rayon") || fab.includes("cotton") || fullText.includes("light") || fullText.includes("breeze"))) {
        score += 15;
        reasons.push("Daytime & Coastal Airflow");
      } else if (finalAnswers.climate === "warm" && (fab.includes("satin") || fab.includes("silk") || fullText.includes("evening") || fullText.includes("festive") || fullText.includes("chic"))) {
        score += 15;
        reasons.push("Evening & Festive Vibe");
      }

      // UNIVERSAL FILTER: Include items where score >= 75%
      if ((fabricMatched || silhouetteMatched) && score >= 75) {
        scored.push({
          product: p,
          matchScore: Math.min(score, 99),
          matchReasons: reasons,
        });
      }
    }

    scored.sort((a, b) => b.matchScore - a.matchScore);
    setRecommendations(scored);
  };

  const resetQuiz = () => {
    setAnswers({ climate: "", fabric: "", silhouette: "" });
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-ivory py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle/80 px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atelier Fitting Experience</span>
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl text-navy font-bold tracking-tight">
            Find My Drape & Fit
          </h1>
          <p className="text-base text-charcoal font-normal max-w-lg mx-auto leading-relaxed">
            Answer 3 quick questions about your comfort style, climate, and touch preferences. Our atelier algorithm will match you with your perfect lounge drape.
          </p>
        </div>

        {/* Step Indicator & Progress Bar */}
        {step <= 3 && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="w-full bg-charcoal/10 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-blush h-full rounded-full"
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-charcoal">
              <span className={step === 1 ? "text-navy font-bold border-b-2 border-blush pb-0.5" : step > 1 ? "text-blush" : "text-charcoal-subtle"}>
                01 Climate
              </span>
              <span className={step === 2 ? "text-navy font-bold border-b-2 border-blush pb-0.5" : step > 2 ? "text-blush" : "text-charcoal-subtle"}>
                02 Fabric Touch
              </span>
              <span className={step === 3 ? "text-navy font-bold border-b-2 border-blush pb-0.5" : "text-charcoal-subtle"}>
                03 Silhouette
              </span>
            </div>
          </div>
        )}

        {/* Quiz Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-ivory border border-charcoal/10 rounded-2xl p-8 sm:p-12 shadow-card space-y-8"
            >
              <h2 className="font-heading text-2xl sm:text-3xl text-navy font-semibold text-center">
                What is your primary lounge climate or vibe?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    id: "ac",
                    title: "Air-Conditioned Comfort",
                    desc: "Cozy indoors with soft, insulating fabric warmth.",
                    badge: "Cozy Warmth",
                  },
                  {
                    id: "breeze",
                    title: "Tropical Coastal Breeze",
                    desc: "Ultra-breathable, light as air for coastal humidity.",
                    badge: "Ultra Light",
                  },
                  {
                    id: "warm",
                    title: "Warm Summer Evenings",
                    desc: "Silky smooth drape with moisture-wicking cooling.",
                    badge: "Cooling Touch",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect("climate", item.id)}
                    className="p-6 bg-ivory-light border-2 border-charcoal/10 rounded-xl hover:border-blush hover:shadow-card transition-all text-left space-y-4 group relative overflow-hidden"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blush bg-blush-subtle px-2.5 py-1 rounded-full self-start inline-block">
                      {item.badge}
                    </span>
                    <h3 className="font-heading text-xl font-semibold text-charcoal group-hover:text-blush transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-charcoal font-normal leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-ivory border border-charcoal/10 rounded-2xl p-8 sm:p-12 shadow-card space-y-8"
            >
              <h2 className="font-heading text-2xl sm:text-3xl text-navy font-semibold text-center">
                Which fabric touch speaks to your skin?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    id: "cotton",
                    title: "Pure Soft Cotton",
                    desc: "Natural, breathable, familiar comfort.",
                  },
                  {
                    id: "modal",
                    title: "Breathable Modal",
                    desc: "Silky soft, lightweight stretch drape.",
                  },
                  {
                    id: "rayon",
                    title: "Premium Rayon",
                    desc: "Fluid, cooling, elegant drape feel.",
                  },
                  {
                    id: "satin",
                    title: "Satin Finish Sheen",
                    desc: "Smooth luxury sheen with rich flow.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect("fabric", item.id)}
                    className="p-6 bg-ivory-light border-2 border-charcoal/10 rounded-xl hover:border-blush hover:shadow-card transition-all text-left space-y-3 group"
                  >
                    <h3 className="font-heading text-xl font-semibold text-charcoal group-hover:text-blush transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-charcoal font-normal leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-ivory border border-charcoal/10 rounded-2xl p-8 sm:p-12 shadow-card space-y-8"
            >
              <h2 className="font-heading text-2xl sm:text-3xl text-navy font-semibold text-center">
                What silhouette makes you feel most confident?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    id: "kaftan",
                    title: "Graceful Flowing Kaftan",
                    desc: "Loose, elegant, unrestrained comfort drape.",
                  },
                  {
                    id: "robe",
                    title: "Classic Floral Robe",
                    desc: "Timeless wrap robe with short sleeves & collar trim.",
                  },
                  {
                    id: "set",
                    title: "Matching Co-ord / Lounge Gown",
                    desc: "Chic, structured silhouette for daytime & evening.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect("silhouette", item.id)}
                    className="p-6 bg-ivory-light border-2 border-charcoal/10 rounded-xl hover:border-blush hover:shadow-card transition-all text-left space-y-3 group"
                  >
                    <h3 className="font-heading text-xl font-semibold text-charcoal group-hover:text-blush transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-charcoal font-normal leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-navy text-ivory rounded-2xl shadow-navy">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-blush-subtle font-bold">
                    Atelier Analysis Complete
                  </span>
                  <h3 className="font-heading text-2xl font-semibold">
                    Your Curated Drape Matches
                  </h3>
                </div>
                <button
                  onClick={resetQuiz}
                  className="px-4 py-2 bg-ivory/10 hover:bg-ivory/20 rounded-md text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Assistant</span>
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blush" />
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.map(({ product, matchScore, matchReasons }) => (
                    <div key={product.id} className="space-y-3 relative flex flex-col">
                      <div className="absolute top-3 left-3 z-20 bg-blush text-ivory text-[10px] font-bold px-2.5 py-1 rounded-full shadow-soft flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{matchScore}% Drape Match</span>
                      </div>
                      <ProductCard
                        product={product}
                        onQuickView={(p) => setSelectedProduct(p)}
                      />
                      {/* Match Reasons Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="bg-blush-subtle/60 text-navy font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-blush/20"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-ivory border border-charcoal/10 rounded-2xl shadow-soft space-y-6">
                  <div className="w-12 h-12 bg-blush-subtle rounded-full flex items-center justify-center mx-auto text-blush">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-heading text-2xl font-semibold text-navy">No Direct Match Found</h4>
                    <p className="text-sm text-charcoal max-w-md mx-auto font-normal leading-relaxed">
                      No specific garment matches that exact combination yet. Explore our complete products catalog to discover all creations!
                    </p>
                  </div>
                  <Link
                    href="/collections"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded-md transition-colors shadow-navy"
                  >
                    <span>Browse All Products</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick View Modal */}
        {selectedProduct && (
          <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </div>
    </div>
  );
}
