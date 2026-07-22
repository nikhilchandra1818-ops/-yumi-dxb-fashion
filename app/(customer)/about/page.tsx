"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/context/SettingsContext";
import { getDocument } from "@/lib/firebase/firestore";
import { AboutCMS } from "@/types";
import Image from "next/image";
import { Heart, Sparkles, ShieldCheck, Award } from "lucide-react";

export default function AboutPage() {
  const { settings } = useSettings();
  const [cms, setCms] = useState<AboutCMS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutCMS = async () => {
      try {
        const data = await getDocument<AboutCMS>("about", "cms");
        if (data) setCms(data);
      } catch (err) {
        console.error("Error loading about page CMS:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutCMS();
  }, []);

  const content = cms || ({
    brandStory:
      "Two sisters transformed their passion for fashion into a brand that believes every woman deserves to feel comfortable, elegant, and confident. Since our inception in 2024, our mission has been to carefully select comfort wear that matches the standard we expect for our own loved ones. Every fabric is hand-inspected, every cut is checked for ease, and every style is chosen to celebrate modern womanhood.",
    mission:
      "To provide modern women with premium garments that offer an absolute balance of daily comfort, elegance, and quality, without compromise.",
    vision:
      "To establish YUMI DXB Fashion as the leading luxury comfort couture brand across India, recognized for its unyielding quality standards, warm sincerity, and beautiful modern designs.",
    founderStory:
      "As homemakers and mothers, we spent years searching for clothes that could gracefully transition from morning tasks to formal evening wear without sacrificing comfort. Finding a gap in premium quality loungewear, we resolved to combine Dubai's fashion-forward aesthetics with Indian comfort sensibilities. We founded YUMI DXB to bring you that same elegant comfort.",
    brandPromise:
      "Before any product is released into our store, we ask ourselves a single guiding question: 'Would we proudly choose this for our own family?' If the answer is no, the product is never released. That is our family promise to yours.",
    coreValues: [
      {
        title: "Comfort First",
        body: "We believe clothing should feel like a second skin. Fabric choice is our absolute priority.",
      },
      {
        title: "Family Values",
        body: "We treat our customers like family. Sincerity and trust guide every single decision we make.",
      },
      {
        title: "Luxury Details",
        body: "Premium finishes, clean stitching, and minimal aesthetics that bring quiet elegance to your closet.",
      },
    ],
  } as AboutCMS);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Page Header */}
      <div className="space-y-4 text-center pb-8 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Our Journey
        </span>
        <h1 className="font-heading text-display-lg font-semibold text-charcoal">
          The Story of YUMI
        </h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto font-light leading-relaxed">
          How two sisters turned their love for fashion and family integrity into a premium lifestyle brand.
        </p>
      </div>

      {/* Grid: Story Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left Side: Story text */}
        <div className="space-y-6">
          <div className="inline-flex p-3 bg-blush-subtle/50 rounded-full text-blush">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="font-heading text-3xl font-semibold text-charcoal">
            Two Sisters. One Vision.
          </h2>
          <p className="text-base text-charcoal-muted font-light leading-relaxed">
            {content.brandStory}
          </p>
          <div className="border-l-4 border-blush pl-4 py-2 italic font-heading text-xl text-charcoal-light">
            &ldquo;Every woman deserves to feel comfortable, elegant, and confident in her daily attire.&rdquo;
          </div>
        </div>

        {/* Right Side: Image Placeholder or uploaded about page banner */}
        <div className="relative aspect-video md:aspect-[4/3] bg-charcoal/5 rounded-lg overflow-hidden border border-charcoal/5 shadow-soft">
          <Image
            src={content.imageUrl || "/images/about_atelier.jpg"}
            alt="Yumi Founders Atelier"
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>

      {/* Grid: Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 md:p-12 shadow-soft">
        <div className="space-y-4">
          <h3 className="font-heading text-2xl font-semibold text-charcoal uppercase tracking-wide">
            Our Mission
          </h3>
          <p className="text-sm text-charcoal-muted font-light leading-relaxed">
            {content.mission}
          </p>
        </div>
        <div className="space-y-4 md:border-l md:border-charcoal/10 md:pl-12">
          <h3 className="font-heading text-2xl font-semibold text-charcoal uppercase tracking-wide">
            Our Vision
          </h3>
          <p className="text-sm text-charcoal-muted font-light leading-relaxed">
            {content.vision}
          </p>
        </div>
      </div>

      {/* Founders Story */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-heading text-2xl font-semibold text-charcoal">The Founders&rsquo; Story</h3>
          <p className="text-sm text-charcoal-muted font-light leading-relaxed">
            {content.founderStory}
          </p>
        </div>
        <div className="bg-blush-subtle/35 border border-blush/10 rounded-xl p-6 flex flex-col justify-center space-y-4 text-center">
          <Award className="w-8 h-8 text-blush mx-auto" />
          <h4 className="font-heading text-lg font-semibold text-charcoal">Our Promise</h4>
          <p className="text-xs text-charcoal-muted font-light leading-relaxed">
            {content.brandPromise}
          </p>
        </div>
      </div>

      {/* Core Values Grid */}
      <div className="space-y-8 pt-8 border-t border-charcoal/5">
        <h3 className="font-heading text-2xl font-semibold text-charcoal text-center">Our Core Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.coreValues.map((val, idx) => (
            <div key={idx} className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft space-y-3">
              <span className="text-xs uppercase tracking-widest text-blush font-bold">0{idx + 1}</span>
              <h4 className="font-heading text-lg font-medium text-charcoal">{val.title}</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed font-light">{val.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
