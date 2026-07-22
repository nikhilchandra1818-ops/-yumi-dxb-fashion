import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center items-center p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-blush-subtle/40 rounded-full flex items-center justify-center text-blush">
        <HelpCircle className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-blush">Error 404</span>
        <h1 className="font-heading text-display-sm font-semibold text-charcoal">Creation Not Found</h1>
        <p className="text-sm text-charcoal-muted max-w-xs mx-auto font-light leading-relaxed">
          The creation or page you are looking for does not exist in our catalog or has been archived.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
