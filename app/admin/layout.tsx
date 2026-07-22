"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  FileText,
  Sliders,
  LogOut,
  Mail,
  UserCheck,
  Star,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { logoutUser } from "@/lib/firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: Strict check to prevent non-admins from viewing admin panel
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login as an Admin.");
        router.push("/login?redirect=" + pathname);
      } else if (!isAdmin) {
        toast.error("Access Denied: Non-admin account.");
        router.push("/");
      }
    }
  }, [user, isAdmin, loading, router, pathname]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      document.cookie = "yumi_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "yumi_is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success("Logged out successfully.");
      router.push("/");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: FolderOpen },
    { label: "Orders", href: "/admin/orders", icon: FileText },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Messages Inbox", href: "/admin/messages", icon: Mail },
    { label: "Newsletter List", href: "/admin/newsletter", icon: UserCheck },
    { label: "FAQs Manager", href: "/admin/faqs", icon: HelpCircle },
    { label: "Policies Rich Text", href: "/admin/policies", icon: FileText },
    { label: "Review Mod", href: "/admin/reviews", icon: Star },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    );
  }

  // Double verification check
  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-ivory-dark flex flex-col md:flex-row">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-charcoal text-ivory flex flex-col justify-between border-r border-charcoal-light flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-ivory/10">
            <Logo size="sm" variant="light" className="!-ml-2" />
            <span className="text-[9px] bg-blush text-ivory font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Console
            </span>
          </div>

          <nav className="mt-8 space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                    isActive
                      ? "bg-blush text-ivory font-bold shadow-soft"
                      : "text-ivory-dark/70 hover:text-ivory hover:bg-charcoal-light"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-ivory/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blush-subtle/20 text-blush rounded-full flex items-center justify-center font-bold text-sm uppercase">
              {user.displayName?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ivory truncate">{user.displayName || "Admin Console"}</p>
              <p className="text-[10px] text-ivory-dark/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-ivory/10 text-ivory-dark/70 hover:text-blush hover:border-blush rounded text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto bg-ivory text-charcoal">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
