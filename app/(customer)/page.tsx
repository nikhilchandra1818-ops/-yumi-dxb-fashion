"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/lib/context/SettingsContext";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuickViewModal } from "@/components/customer/QuickViewModal";
import { getCollection, where, orderBy, getDocument } from "@/lib/firebase/firestore";
import { Product, Category, Testimonial, HomepageCMS } from "@/types";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const staggerChildren = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const lineReveal = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1 },
};

const TRANSITION_LUXURY = { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const };

/* ─── Editorial Animated Heading ─── */
function AnimatedHeading({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { settings } = useSettings();
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cmsData = await getDocument<HomepageCMS>("homepage", "cms");
        if (cmsData) setCms(cmsData);

        const cats = await getCollection<Category>("categories", [
          where("isActive", "==", true),
          orderBy("displayOrder", "asc"),
        ]);
        setCategories(cats);

        const products = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isFeatured", "==", true),
          where("isArchived", "==", false),
        ]);
        setFeaturedProducts(products);

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
    <div className="min-h-screen" style={{ background: "#F8F4EE" }}>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 01 — CINEMATIC HERO
          Full-bleed image with parallax, editorial headline,
          and ultra-minimal CTA treatment
      ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden"
        style={{ background: "#1E2B52" }}
      >
        {/* Parallax background image */}
        {heroContent.imageUrl && (
          <motion.div
            className="absolute inset-0 z-0"
            style={{ y: heroImageY }}
          >
            <Image
              src={heroContent.imageUrl}
              alt="YUMI DXB Fashion"
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
              onLoad={() => setHeroImageLoaded(true)}
            />
            {/* Multi-layer editorial overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, rgba(30,43,82,0.82) 0%, rgba(30,43,82,0.45) 45%, rgba(30,43,82,0.15) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(30,43,82,0.60) 0%, transparent 60%)",
              }}
            />
          </motion.div>
        )}

        {/* Decorative top hairline */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px z-20"
          style={{ background: "rgba(248,244,238,0.15)", transformOrigin: "left" }}
          variants={lineReveal}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Hero content — editorial left-aligned composition */}
        <motion.div
          className="relative z-10 min-h-screen flex flex-col justify-end pb-20 md:pb-28"
          style={{ opacity: heroOpacity }}
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
            {/* Top label — Juan Mora style "----subtitle" */}
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="show"
              className="space-y-8 max-w-3xl"
            >
              <motion.div variants={fadeIn} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-4">
                <div
                  className="h-px w-10 flex-shrink-0"
                  style={{ background: "#D89B9B" }}
                />
                <span
                  className="editorial-label"
                  style={{ color: "#D89B9B" }}
                >
                  est. 2024 · mangaluru, india
                </span>
              </motion.div>

              {/* Massive editorial headline — Cormorant Garamond */}
              <motion.h1
                variants={fadeUp}
                className="font-heading leading-[0.9] tracking-tight"
                style={{
                  fontSize: "clamp(3.5rem, 9vw, 8rem)",
                  color: "#F8F4EE",
                  fontWeight: 300,
                }}
              >
                Where Comfort
                <br />
                <em style={{ color: "#D89B9B", fontStyle: "italic" }}>
                  Meets Elegance
                </em>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={fadeUp}
                className="text-base leading-relaxed font-light max-w-lg"
                style={{ color: "rgba(248,244,238,0.75)" }}
              >
                {heroContent.subheading}
              </motion.p>

              {/* CTA row — editorial treatment */}
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap items-center gap-6 pt-2"
              >
                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-3"
                  style={{ color: "#F8F4EE" }}
                >
                  <span
                    className="px-7 py-3.5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-400 active:scale-95"
                    style={{
                      background: "#D89B9B",
                      color: "#F8F4EE",
                      borderRadius: "2px",
                    }}
                  >
                    {heroContent.primaryCta}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300"
                    style={{ color: "#D89B9B" }}
                  />
                </Link>

                <Link
                  href="/about"
                  className="link-reveal text-xs font-semibold tracking-[0.18em] uppercase transition-colors duration-300"
                  style={{ color: "rgba(248,244,238,0.70)" }}
                >
                  {heroContent.secondaryCta}
                </Link>
              </motion.div>
            </motion.div>

            {/* Bottom scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-16 flex items-center gap-3"
            >
              <div
                className="h-px flex-1 max-w-12"
                style={{ background: "rgba(248,244,238,0.25)" }}
              />
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "rgba(248,244,238,0.35)" }}
              >
                scroll
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 02 — BRAND STORY (Editorial Split Layout)
          Juan Mora's "label left / content right" composition
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-28 md:py-40"
        style={{ background: "#F8F4EE" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Hairline top */}
          <motion.div
            className="hairline mb-16"
            variants={lineReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "left" }}
          />

          {/* Two-column editorial split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            {/* Left: editorial label column */}
            <AnimatedHeading className="lg:col-span-3" delay={0}>
              <div className="lg:sticky lg:top-32 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6" style={{ background: "#D89B9B" }} />
                  <span className="editorial-label">our story</span>
                </div>
                <Heart
                  className="w-6 h-6"
                  style={{ color: "#D89B9B" }}
                  fill="currentColor"
                />
              </div>
            </AnimatedHeading>

            {/* Right: main story content */}
            <div className="lg:col-span-9 space-y-10">
              <AnimatedHeading delay={0.1}>
                <h2
                  className="font-heading font-light leading-[1.1]"
                  style={{
                    fontSize: "clamp(2.2rem, 5vw, 4rem)",
                    color: "#1E2B52",
                  }}
                >
                  {storyPreview.heading}
                </h2>
              </AnimatedHeading>

              <AnimatedHeading delay={0.2}>
                <p
                  className="font-heading text-xl md:text-2xl font-light italic leading-relaxed"
                  style={{ color: "#4A4A4A" }}
                >
                  &ldquo;Would we proudly choose this for our own family?&rdquo;
                </p>
              </AnimatedHeading>

              <AnimatedHeading delay={0.3}>
                <p
                  className="text-base leading-[1.9] font-light max-w-2xl"
                  style={{ color: "#4A4A4A" }}
                >
                  {storyPreview.body}
                </p>
              </AnimatedHeading>

              <AnimatedHeading delay={0.4}>
                <Link
                  href="/about"
                  className="link-reveal inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase transition-colors duration-300"
                  style={{ color: "#1E2B52" }}
                >
                  <span>{storyPreview.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </AnimatedHeading>
            </div>
          </div>

          {/* Hairline bottom */}
          <motion.div
            className="hairline mt-16"
            variants={lineReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "right" }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 03 — FEATURED CATEGORIES
          Editorial full-bleed category cards with cinematic hover
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36" style={{ background: "#F3EEE7" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <AnimatedHeading>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6" style={{ background: "#D89B9B" }} />
                  <span className="editorial-label">collections</span>
                </div>
                <h2
                  className="font-heading font-light leading-tight"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    color: "#1E2B52",
                  }}
                >
                  Featured Categories
                </h2>
              </div>
            </AnimatedHeading>

            <AnimatedHeading delay={0.1}>
              <Link
                href="/collections"
                className="link-reveal inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase flex-shrink-0"
                style={{ color: "#1E2B52" }}
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </AnimatedHeading>
          </div>

          {/* Category cards */}
          {categories.length === 1 ? (
            /* Single category — editorial split layout */
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 overflow-hidden"
              style={{
                borderRadius: "4px",
                border: "1px solid #E6DED5",
              }}
            >
              <div
                className="p-10 md:p-16 flex flex-col justify-center space-y-8"
                style={{ background: "#FFFFFF" }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6" style={{ background: "#D89B9B" }} />
                    <span className="editorial-label">debut collection</span>
                  </div>
                </div>
                <h3
                  className="font-heading font-light leading-tight"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1E2B52" }}
                >
                  {categories[0].name}
                </h3>
                <p
                  className="text-sm leading-[1.9] font-light max-w-sm"
                  style={{ color: "#4A4A4A" }}
                >
                  {categories[0].description ||
                    "Indulge in our carefully selected premium comfort wear. Designed to bring ease, style, and absolute confidence to your daily life."}
                </p>
                <Link
                  href={`/collections?c=${categories[0].slug}`}
                  className="link-reveal self-start inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase"
                  style={{ color: "#1E2B52" }}
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <Link
                href={`/collections?c=${categories[0].slug}`}
                className="relative min-h-[420px] overflow-hidden group"
              >
                <Image
                  src={categories[0].imageUrl || "/images/iris-garden-robe.jpg"}
                  alt={categories[0].name}
                  fill
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </Link>
            </motion.div>
          ) : categories.length > 1 ? (
            /* Multiple categories — editorial asymmetric grid */
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {categories.map((category, idx) => (
                <motion.div key={category.id} variants={fadeUp}>
                  <Link
                    href={`/collections?c=${category.slug}`}
                    className="group block relative overflow-hidden"
                    style={{
                      aspectRatio: idx === 0 ? "3/4" : "4/5",
                      borderRadius: "2px",
                      border: "1px solid #E6DED5",
                    }}
                  >
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(135deg, #EFE7DE, #FAF0F0)" }}
                      />
                    )}
                    {/* Editorial bottom overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(30,43,82,0.72) 0%, rgba(30,43,82,0.1) 50%, transparent 100%)",
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="h-px w-4 transition-all duration-300 group-hover:w-8"
                          style={{ background: "#D89B9B" }}
                        />
                        <span
                          className="editorial-label"
                          style={{ color: "#D89B9B" }}
                        >
                          collection
                        </span>
                      </div>
                      <h3
                        className="font-heading font-light text-xl tracking-wide"
                        style={{ color: "#F8F4EE" }}
                      >
                        {category.name}
                      </h3>
                      <p
                        className="text-xs tracking-[0.12em] uppercase mt-2 flex items-center gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400"
                        style={{ color: "rgba(248,244,238,0.7)" }}
                      >
                        <span>Explore</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Fallback */
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 overflow-hidden"
              style={{ borderRadius: "4px", border: "1px solid #E6DED5" }}
            >
              <div
                className="p-10 md:p-16 flex flex-col justify-center space-y-8"
                style={{ background: "#FFFFFF" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-px w-6" style={{ background: "#D89B9B" }} />
                  <span className="editorial-label">featured collection</span>
                </div>
                <h3
                  className="font-heading font-light leading-tight"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1E2B52" }}
                >
                  Premium Floral Nightwear
                </h3>
                <p
                  className="text-sm leading-[1.9] font-light"
                  style={{ color: "#4A4A4A" }}
                >
                  Indulge in our carefully selected premium comfort wear. Designed to bring ease,
                  style, and absolute confidence to your daily life.
                </p>
                <Link
                  href="/collections?c=premium-floral-nightwear"
                  className="link-reveal self-start inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase"
                  style={{ color: "#1E2B52" }}
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <Link
                href="/collections?c=premium-floral-nightwear"
                className="relative min-h-[420px] overflow-hidden group"
              >
                <Image
                  src="/images/iris-garden-robe.jpg"
                  alt="Premium Floral Nightwear"
                  fill
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 04 — BRAND VALUES (Juan Mora "Philosophy" style)
          Editorial label-left, content-right three-column layout
          with hairline dividers between each value
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-40" style={{ background: "#EFE7DE" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          {/* Section label */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6" style={{ background: "#D89B9B" }} />
              <span className="editorial-label">why yumi</span>
            </div>
            <h2
              className="font-heading font-light leading-tight"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                color: "#1E2B52",
                maxWidth: "32ch",
              }}
            >
              Crafted with care,
              <br />
              <em style={{ color: "#D89B9B" }}>chosen with love</em>
            </h2>
          </motion.div>

          {/* Values — editorial "lines" with label/content split like Juan Mora's bio sections */}
          <div className="space-y-0">
            {brandValues.map((value, idx) => {
              const Icon =
                value.icon === "Sparkles"
                  ? Sparkles
                  : value.icon === "Award"
                  ? Award
                  : ShieldCheck;

              return (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {/* Top hairline */}
                  <div
                    className="hairline"
                    style={{
                      background:
                        "linear-gradient(to right, #E6DED5, rgba(230,222,213,0.3))",
                    }}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 py-10 lg:py-14 group">
                    {/* Left: Number + Icon */}
                    <div className="lg:col-span-2 flex items-start gap-4">
                      <span
                        className="font-heading text-5xl font-light leading-none select-none"
                        style={{ color: "#DCC8B5" }}
                      >
                        0{idx + 1}
                      </span>
                    </div>

                    {/* Middle: Title */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "#D89B9B" }}
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3
                        className="font-heading font-light text-2xl md:text-3xl"
                        style={{ color: "#1E2B52" }}
                      >
                        {value.title}
                      </h3>
                    </div>

                    {/* Right: Body text */}
                    <div className="lg:col-span-6">
                      <p
                        className="text-sm leading-[1.9] font-light"
                        style={{ color: "#4A4A4A" }}
                      >
                        {value.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {/* Final hairline */}
            <div className="hairline" style={{ background: "rgba(230,222,213,0.6)" }} />
          </div>

          {/* Bottom CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <p
              className="font-heading text-lg font-light italic"
              style={{ color: "#4A4A4A" }}
            >
              &ldquo;Every woman deserves to feel beautiful, confident, and comfortable.&rdquo;
            </p>
            <Link
              href="/collections"
              className="group inline-flex items-center gap-3 flex-shrink-0"
            >
              <span
                className="px-7 py-3.5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300 active:scale-95"
                style={{
                  background: "#1E2B52",
                  color: "#F8F4EE",
                  borderRadius: "2px",
                }}
              >
                Shop Now
              </span>
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300"
                style={{ color: "#1E2B52" }}
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
