"use client";

import React, { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/firebase/auth";
import { toast } from "react-hot-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMsg = "Failed to send reset link. Please check your email.";
      if (error.code === "auth/user-not-found") {
        errorMsg = "No account found with this email.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Invalid email address.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-charcoal">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs text-charcoal-muted font-body">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>

      {sent ? (
        <div className="bg-blush-subtle/50 border border-blush/20 rounded-md p-4 space-y-4">
          <p className="text-sm text-charcoal leading-relaxed font-light text-center">
            A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
          </p>
          <Link
            href="/login"
            className="w-full flex justify-center py-2.5 px-4 border border-charcoal/20 rounded-md text-sm font-semibold tracking-widest uppercase text-charcoal hover:bg-charcoal/5 transition-colors text-center"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal"
            >
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-subtle">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal placeholder-charcoal-subtle"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold tracking-widest uppercase text-ivory bg-navy hover:bg-navy-light focus:outline-none transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-charcoal-muted hover:text-charcoal transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
