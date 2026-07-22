"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js runtime error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center items-center p-6 text-center space-y-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-red-600">Error 500</span>
        <h1 className="font-heading text-display-sm font-semibold text-charcoal">Something Went Wrong</h1>
        <p className="text-sm text-charcoal-muted max-w-xs mx-auto font-light leading-relaxed">
          An unexpected error occurred during processing. Our systems have logged this event.
        </p>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-transparent border border-charcoal/20 text-charcoal hover:bg-charcoal/5 text-xs font-semibold uppercase tracking-widest rounded transition-all"
        >
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
