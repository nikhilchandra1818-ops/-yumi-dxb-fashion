"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { Logo } from "../shared/Logo";
import { CartDrawer } from "./CartDrawer";
import {
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { cartTotalItems } = useCart();
  const { wishlistItems } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle scroll detection for shrinking nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on page change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/collections" },
    { label: "Style Assistant", href: "/drape-assistant" },
    { label: "Gift Vouchers", href: "/gift-cards" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
  ];

  // Voice Search Handler
  const [isListening, setIsListening] = useState(false);
  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-ivory/95 backdrop-blur-md py-2 shadow-soft border-b border-charcoal/10"
            : "bg-ivory/95 backdrop-blur-md py-3 border-b border-charcoal/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Hamburger menu for mobile */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-charcoal hover:text-blush transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Left/Center: Logo */}
          <div className="flex-shrink-0">
            <Logo size={isScrolled ? "sm" : "md"} variant="colored" />
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`font-body text-sm font-medium tracking-wider uppercase transition-colors luxury-link ${
                  pathname === link.href
                    ? "text-blush"
                    : "text-charcoal hover:text-blush"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="font-body text-sm font-semibold tracking-wider uppercase text-navy hover:text-navy-light transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-charcoal hover:text-blush transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Icon */}
            <Link
              href={user ? (isAdmin ? "/admin/dashboard" : "/account") : "/login"}
              className="p-2 text-charcoal hover:text-blush transition-colors"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="p-2 text-charcoal hover:text-blush transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blush rounded-full ring-2 ring-ivory animate-pulse" />
              )}
            </Link>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-charcoal hover:text-blush transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartTotalItems > 0 && (
                <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-navy text-ivory text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Slide-Down Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-ivory border-b border-charcoal/5 px-4 py-4 shadow-soft"
            >
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <form
                  action="/search"
                  className="flex-1 flex items-center border-b border-charcoal/20 pb-1"
                >
                  <Search className="w-5 h-5 text-charcoal-muted mr-2" />
                  <input
                    type="text"
                    name="q"
                    placeholder={isListening ? "Listening to your voice..." : "Search for kaftans, abayas, co-ords..."}
                    className="w-full bg-transparent border-0 outline-none text-charcoal placeholder-charcoal-subtle font-body text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`p-1.5 rounded-full transition-all ${
                      isListening ? "bg-red-500 text-white animate-pulse" : "text-charcoal-muted hover:text-blush"
                    }`}
                    title="Speak to Search"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </form>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-sm font-medium text-charcoal-muted hover:text-charcoal transition-colors px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Nav Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-45 bg-charcoal md:hidden"
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ translateX: "-100%" }}
              animate={{ translateX: 0 }}
              exit={{ translateX: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-45 w-full max-w-xs bg-ivory shadow-elevated p-6 flex flex-col justify-between border-r border-charcoal/5 md:hidden"
            >
              <div className="space-y-8 pt-16">
                <div className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`font-body text-base font-medium tracking-wide uppercase py-2 border-b border-charcoal/5 ${
                        pathname === link.href ? "text-blush" : "text-charcoal"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-body text-base font-semibold tracking-wide uppercase py-2 border-b border-charcoal/5 text-navy"
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-charcoal/5">
                {user ? (
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-charcoal font-medium text-sm"
                  >
                    <UserIcon className="w-5 h-5 text-charcoal-muted" />
                    <span>My Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-charcoal font-medium text-sm"
                  >
                    <UserIcon className="w-5 h-5 text-charcoal-muted" />
                    <span>Login / Register</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
