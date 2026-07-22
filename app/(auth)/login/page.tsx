"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/firebase/auth";
import { getDocument } from "@/lib/firebase/firestore";
import { AdminProfile } from "@/types";
import { toast } from "react-hot-toast";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(email, password);

      // Check if user is an Admin
      const adminDoc = await getDocument<AdminProfile>("admins", user.uid);
      const isAdmin = !!(adminDoc && adminDoc.isActive);

      // Set cookie for middleware check (Max age: 7 days)
      const isProd = process.env.NODE_ENV === "production";
      document.cookie = `yumi_session=${user.uid}; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;
      document.cookie = `yumi_is_admin=${isAdmin ? "true" : "false"}; path=/; max-age=604800; SameSite=Lax${isProd ? "; Secure" : ""}`;

      toast.success("Successfully logged in!");
      
      // Redirect logic
      if (redirectUrl) {
        if (redirectUrl.startsWith("/admin") && !isAdmin) {
          toast.error("Access Denied: Non-admin account.");
          router.push("/account");
        } else {
          router.push(redirectUrl);
        }
      } else if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/account");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMsg = "Failed to log in. Please check your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMsg = "Incorrect email or password. If you don't have an account yet, please click 'create a new account'.";
      } else if (error.code === "auth/network-request-failed" || error.message?.includes("offline")) {
        errorMsg = "Network Connection Error: Unable to reach authentication server. Please check your internet connection and try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMsg = "Too many failed login attempts. Please try again in a few minutes.";
      } else if (error.code === "auth/configuration-not-found") {
        errorMsg = "Authentication provider not found. Please enable the Email/Password sign-in method in your Firebase Console.";
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-xs text-charcoal-muted font-body">
          Or{" "}
          <Link
            href="/register"
            className="font-medium text-blush hover:text-blush-dark transition-colors"
          >
            create a new account
          </Link>
        </p>
      </div>

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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-charcoal"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blush hover:text-blush-dark transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-subtle">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-10 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal placeholder-charcoal-subtle"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-subtle hover:text-charcoal"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold tracking-widest uppercase text-ivory bg-navy hover:bg-navy-light focus:outline-none transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blush" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
