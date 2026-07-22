"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/context/CartContext";
import { useSettings } from "@/lib/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Truck } from "lucide-react";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartSubtotal, cartTotalItems } = useCart();
  const { settings } = useSettings();

  const shippingFee =
    cartSubtotal >= (settings.freeShippingAbove ?? 1500) ? 0 : (settings.shippingFee ?? 100);
  const total = cartSubtotal + shippingFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="space-y-2 text-center pb-6 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Your Selection
        </span>
        <h1 className="font-heading text-display-sm sm:text-display-md font-semibold text-charcoal">
          Shopping Cart ({cartTotalItems} Items)
        </h1>
      </div>

      {cartItems.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-medium text-charcoal">Your cart is empty</h2>
            <p className="text-sm text-charcoal-muted max-w-xs mx-auto font-light leading-relaxed">
              Looks like you haven&rsquo;t selected any comfort creations yet. Browse our premium Abayas, Kaftans, and loungewear.
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-block px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        /* Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => {
              const price = item.discountPrice ?? item.price;
              return (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft"
                >
                  {/* Image & Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-24 bg-charcoal/5 rounded overflow-hidden flex-shrink-0 border border-charcoal/5">
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading text-lg font-medium text-charcoal hover:text-blush transition-colors">
                        <Link href={`/products/${item.productSlug}`}>{item.productName}</Link>
                      </h3>
                      <p className="text-xs text-charcoal-muted uppercase tracking-wider">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="text-xs text-charcoal-subtle font-light">
                        Unit Price: {formatCurrency(price)}
                      </p>
                    </div>
                  </div>

                  {/* Controls & Subtotal */}
                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-8">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 transition-colors disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-8 h-8 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <span className="text-base font-semibold text-charcoal">
                        {formatCurrency(price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        className="text-charcoal-muted hover:text-blush transition-colors ml-4 p-1 inline-block align-middle"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Panel */}
          <div className="space-y-6 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft">
            <h2 className="font-heading text-2xl font-semibold text-charcoal border-b border-charcoal/5 pb-4">
              Order Summary
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-charcoal-muted">
                <span>Subtotal ({cartTotalItems} items)</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}</span>
              </div>
              {shippingFee > 0 && settings.freeShippingAbove && (
                <p className="text-[10px] text-blush flex items-center gap-1.5 pt-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Add {formatCurrency(settings.freeShippingAbove - cartSubtotal)} more for free delivery!</span>
                </p>
              )}
            </div>

            <div className="border-t border-charcoal/5 pt-4 flex justify-between font-heading text-lg font-semibold text-charcoal">
              <span>Total Price</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="pt-4 space-y-3">
              <Link
                href="/checkout"
                className="w-full bg-navy text-ivory hover:bg-navy-light py-3.5 rounded-md font-semibold tracking-widest uppercase transition-colors text-center flex items-center justify-center gap-2 text-xs shadow-navy"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/collections"
                className="w-full bg-transparent border border-charcoal/20 text-charcoal hover:bg-charcoal/5 py-3.5 rounded-md font-semibold tracking-widest uppercase transition-colors text-center block text-xs"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
