"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/lib/context/SettingsContext";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { getCollection, where, orderBy, getDocument } from "@/lib/firebase/firestore";
import { Product, Category, Testimonial, HomepageCMS } from "@/types";
import { motion } from "framer-motion";
import {
  Heart,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Star,
  Quote,
} from "lucide-react";

export default function HomePage() {
  const { settings } = useSettings();
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 1. Fetch CMS content & categories & products & testimonials
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CMS Configuration
        const cmsData = await getDocument<HomepageCMS>("homepage", "cms");
        if (cmsData) {
          setCms(cmsData);
        }

        // Fetch categories ordered by displayOrder
        const cats = await getCollection<Category>("categories", [
          where("isActive", "==", true),
          orderBy("displayOrder", "asc"),
        ]);
        setCategories(cats);

        // Fetch featured products
        const products = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isFeatured", "==", true),
          where("isArchived", "==", false),
        ]);
        setFeaturedProducts(products);

        // Fetch testimonials
        const reviews = await getCollection<Testimonial>("testimonials", [
          where("isPublished", "==", true),
          orderBy("displayOrder", "asc"),
        ]);
        setTestimonials(reviews);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      }
    };

    fetchData();
  }, []);

  // Default values if CMS is not configured yet
  const heroContent = cms?.hero || {
    headline: "Where Comfort Meets Elegance.",
    subheading:
      "Every piece is handpicked with love. Carefully curated premium Kaftans, Abayas, Co-ords, and Floral Nightwear designed to make you feel beautiful, confident, and absolutely comfortable.",
    primaryCta: "Explore Products",
    secondaryCta: "Our Story",
    imageUrl: "/images/hero_main.jpg",
  };

  const storyPreview = cms?.storyPreview || {
    heading: "The Soul of YUMI DXB",
    body: "Founded by two sisters and homemakers, YUMI DXB Fashion was born out of a simple belief: that every woman deserves to feel comfortable, elegant, and confident. We don't just sell clothing; we curate comfort. Before any design is released, we ask ourselves a single question: 'Would we proudly choose this for our own family?' If the answer is no, it never joins our collection.",
    ctaLabel: "Read Our Story",
  };

  const brandValues = cms?.brandValues || [
    {
      icon: "Sparkles",
      title: "Handpicked Elegance",
      body: "Every fabric, stitch, and design is hand-selected and personally tested for premium comfort.",
    },
    {
      icon: "Award",
      title: "Family Integrity",
      body: "If it's not good enough for our own sisters and family, it's not good enough for yours. That is our promise.",
    },
    {
      icon: "ShieldCheck",
      title: "Pan-India Quality",
      body: "Delivered straight from Mangaluru to your doorstep anywhere in India with secure, tracked courier services.",
    },
  ];

  return (
    <div className="min-h-screen bg-ivory">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-charcoal/5">
        {/* Background Image Overlay */}
        {heroContent.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={heroContent.imageUrl}
              alt="YUMI DXB Fashion Hero"
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-90"
            />
            {/* Soft balanced luxury overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-ivory/85 via-ivory/55 to-transparent/10" />
          </div>
        ) : (
          /* Premium luxury backdrop gradient when image is not yet uploaded */
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-ivory-light via-ivory-dark to-blush-subtle/30 opacity-70">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blush-subtle/40 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-navy-light/10 rounded-full blur-3xl" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-start max-w-2xl text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3.5 py-1.5 rounded-full inline-block">
              ESTABLISHED 2024
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-navy tracking-tight leading-none">
              YUMI DXB <span className="font-light italic text-blush">Fashion</span>
            </h1>
            <p className="font-heading text-2xl sm:text-3xl font-medium text-charcoal mt-3">
              {heroContent.headline}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base text-charcoal leading-relaxed font-normal max-w-lg"
          >
            {heroContent.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 pt-2 w-full sm:w-auto"
          >
            <Link
              href="/collections"
              className="px-8 py-3.5 bg-navy text-ivory hover:bg-navy-light rounded-md text-sm font-semibold tracking-widest uppercase transition-all duration-300 shadow-navy flex items-center justify-center gap-2 group w-full sm:w-auto"
            >
              <span>{heroContent.primaryCta}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-3.5 bg-transparent border border-charcoal/20 text-charcoal hover:bg-charcoal/5 rounded-md text-sm font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center w-full sm:w-auto"
            >
              {heroContent.secondaryCta}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Story Preview Section ─── */}
      <section className="py-24 bg-ivory-light border-b border-charcoal/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center justify-center p-3 bg-blush-subtle/50 rounded-full text-blush mb-2">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="font-heading text-display-md text-charcoal font-semibold">
            {storyPreview.heading}
          </h2>
          <p className="font-heading text-xl md:text-2xl font-light italic text-charcoal-light max-w-2xl mx-auto leading-relaxed">
            &ldquo;Would we proudly choose this for our own family?&rdquo;
          </p>
          <p className="text-base text-charcoal-muted leading-relaxed font-light max-w-3xl mx-auto">
            {storyPreview.body}
          </p>
          <div className="pt-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-navy hover:text-blush transition-colors pb-1 border-b-2 border-navy hover:border-blush"
            >
              <span>{storyPreview.ctaLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Collections Section ─── */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-blush font-semibold">
                Our Showcase
              </span>
              <h2 className="font-heading text-display-md text-charcoal font-semibold">
                Featured Categories
              </h2>
            </div>
            <Link
              href="/collections"
              className="text-sm font-semibold tracking-wider uppercase text-navy hover:text-blush transition-colors flex items-center gap-1.5"
            >
              <span>Browse All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {categories.length === 1 ? (
            <div className="relative overflow-hidden rounded-2xl border border-charcoal/5 shadow-soft bg-ivory-light grid grid-cols-1 md:grid-cols-2 min-h-[50vh]">
              {/* Left Side: Editorial Description */}
              <div className="p-8 md:p-16 flex flex-col justify-center space-y-6">
                <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3 py-1.5 rounded-full self-start">
                  Debut Collection
                </span>
                <h3 className="font-heading text-3xl md:text-5xl font-semibold text-navy leading-tight">
                  {categories[0].name}
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed font-light">
                  {categories[0].description || "Indulge in our carefully selected premium comfort wear. Designed to bring ease, style, and absolute confidence to your daily life. Crafted with organic materials, beautiful floral motifs, and family integrity."}
                </p>
                <div>
                  <Link
                    href={`/collections?c=${categories[0].slug}`}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-navy text-ivory hover:bg-navy-light rounded-md text-xs font-semibold tracking-widest uppercase transition-colors shadow-navy"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              </div>
              
              {/* Right Side: Image */}
              <Link href={`/collections?c=${categories[0].slug}`} className="relative h-64 md:h-full overflow-hidden group">
                <Image
                  src={categories[0].imageUrl || "/images/iris-garden-robe.jpg"}
                  alt={categories[0].name}
                  fill
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-charcoal/5 group-hover:bg-charcoal/10 transition-colors" />
              </Link>
            </div>
          ) : categories.length > 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/collections?c=${category.slug}`}
                  className="group relative aspect-[4/5] bg-charcoal/5 rounded-lg overflow-hidden border border-charcoal/5 shadow-soft hover:shadow-card transition-all duration-500 hover:-translate-y-1"
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-ivory-dark to-blush-subtle/20 flex flex-col items-center justify-center p-6 text-center" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end text-ivory">
                    <h3 className="font-heading text-xl font-medium tracking-wide">
                      {category.name}
                    </h3>
                    <p className="text-xs text-ivory-dark/80 mt-1 flex items-center gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span>Explore Collection</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Fallback default categories when database is not set */
            <div className="relative overflow-hidden rounded-2xl border border-charcoal/5 shadow-soft bg-ivory-light grid grid-cols-1 md:grid-cols-2 min-h-[50vh]">
              {/* Left Side: Editorial Description */}
              <div className="p-8 md:p-16 flex flex-col justify-center space-y-6">
                <span className="text-xs uppercase tracking-widest text-blush font-bold bg-blush-subtle px-3 py-1.5 rounded-full self-start">
                  Featured Collection
                </span>
                <h3 className="font-heading text-3xl md:text-5xl font-semibold text-navy leading-tight">
                  Premium Floral Nightwear
                </h3>
                <p className="text-sm text-charcoal-muted leading-relaxed font-light">
                  Indulge in our carefully selected premium comfort wear. Designed to bring ease, style, and absolute confidence to your daily life. Crafted with organic materials, beautiful floral motifs, and family integrity.
                </p>
                <div>
                  <Link
                    href="/collections?c=premium-floral-nightwear"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-navy text-ivory hover:bg-navy-light rounded-md text-xs font-semibold tracking-widest uppercase transition-colors shadow-navy"
                  >
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              {/* Right Side: Image */}
              <Link href="/collections?c=premium-floral-nightwear" className="relative h-64 md:h-full overflow-hidden group">
                <Image
                  src="/images/iris-garden-robe.jpg"
                  alt="Premium Floral Nightwear"
                  fill
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-charcoal/5 group-hover:bg-charcoal/10 transition-colors" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Brand Values Section ─── */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {brandValues.map((value, idx) => {
            const Icon =
              value.icon === "Sparkles"
                ? Sparkles
                : value.icon === "Award"
                ? Award
                : ShieldCheck;

            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-6 space-y-4 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft"
              >
                <div className="p-4 bg-blush-subtle/50 rounded-full text-blush">
                  <Icon className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="font-heading text-xl font-medium text-charcoal">{value.title}</h3>
                <p className="text-sm text-charcoal-muted leading-relaxed font-light">
                  {value.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>


      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
