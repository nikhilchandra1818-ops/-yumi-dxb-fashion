"use client";

import React, { useRef, useEffect } from "react";
import { useCart } from "@/lib/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, cartSubtotal, cartTotalItems } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-charcoal"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ translateX: "100%" }}
            animate={{ translateX: 0 }}
            exit={{ translateX: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-ivory shadow-elevated flex flex-col border-l border-charcoal/5"
          >
            {/* Header */}
            <div className="p-6 border-b border-charcoal/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-charcoal" />
                <h2 className="font-heading text-xl font-semibold text-charcoal">
                  Your Cart ({cartTotalItems})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-charcoal/5 rounded-full transition-colors text-charcoal-muted hover:text-charcoal"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-charcoal-subtle" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-medium text-charcoal">
                      Your cart is empty
                    </h3>
                    <p className="text-sm text-charcoal-muted mt-1 max-w-xs">
                      Discover our premium collections and add your favorite items here.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-sm font-medium tracking-wider rounded-md transition-colors"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const price = item.discountPrice ?? item.price;
                  return (
                    <motion.div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-4 border-b border-charcoal/5 pb-6 last:border-0 last:pb-0"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-24 bg-charcoal/5 rounded overflow-hidden flex-shrink-0 border border-charcoal/5">
                        <Image
                          src={item.imageUrl || "/images/placeholder.jpg"}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-body text-sm font-medium text-charcoal truncate">
                          <Link href={`/products/${item.productSlug}`} onClick={onClose}>
                            {item.productName}
                          </Link>
                        </h4>
                        <p className="text-xs text-charcoal-muted mt-1 uppercase tracking-wider">
                          Size: {item.size} | Color: {item.color}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 mt-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center border border-charcoal/10 rounded-full hover:bg-charcoal/5 disabled:opacity-40 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-charcoal">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="w-7 h-7 flex items-center justify-center border border-charcoal/10 rounded-full hover:bg-charcoal/5 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Pricing and delete */}
                      <div className="flex flex-col items-end justify-between h-24 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-semibold text-charcoal">
                            {formatCurrency(price * item.quantity)}
                          </span>
                          {item.discountPrice && (
                            <p className="text-xs text-charcoal-muted line-through mt-0.5">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.size, item.color)}
                          className="text-charcoal-muted hover:text-blush transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-ivory-dark border-t border-charcoal/5 space-y-4">
                <div className="flex items-center justify-between text-charcoal font-body">
                  <span className="text-sm font-medium">Subtotal</span>
                  <span className="text-lg font-semibold">{formatCurrency(cartSubtotal)}</span>
                </div>
                <p className="text-xs text-charcoal-muted">
                  Taxes and shipping calculated at checkout.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="w-full py-3 bg-transparent border border-navy text-navy hover:bg-navy/5 text-sm font-medium tracking-wider rounded-md transition-colors text-center block"
                  >
                    VIEW CART
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="w-full py-3 bg-navy text-ivory hover:bg-navy-light text-sm font-medium tracking-wider rounded-md transition-colors text-center block"
                  >
                    PROCEED TO CHECKOUT
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
