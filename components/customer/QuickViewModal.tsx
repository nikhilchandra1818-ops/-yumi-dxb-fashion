"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/lib/context/CartContext";
import { formatCurrency, getDiscountPercent } from "@/lib/utils";
import Image from "next/image";
import { X, ShoppingBag, Loader2, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  // Initialize defaults
  const handleOpen = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
    if (product.colors.length > 0 && !selectedColor) {
      setSelectedColor(product.colors[0]);
    }
  };

  handleOpen();

  const primaryImg = product.images.find((img) => img.isPrimary)?.url || "/images/placeholder.jpg";
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      toast.error("Out of stock.");
      return;
    }

    setAdding(true);
    try {
      await addToCart(
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: primaryImg,
          size: selectedSize || "Standard",
          color: selectedColor || "Default",
          price: product.price,
          discountPrice: product.discountPrice,
          maxStock: product.stock,
        },
        quantity
      );
      toast.success(`${product.name} added to cart.`);
      onClose();
    } catch (err) {
      toast.error("Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-charcoal"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-ivory w-full max-w-3xl rounded-xl shadow-elevated overflow-hidden border border-charcoal/5 z-10 flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-ivory/80 hover:bg-charcoal/5 rounded-full z-20 text-charcoal hover:text-blush transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Images */}
          <div className="w-full md:w-1/2 aspect-3/4 md:aspect-auto md:h-[500px] relative bg-charcoal/5">
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>

          {/* Right: Info & Actions */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-none">
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-blush font-semibold">
                  {product.categoryName}
                </span>
                <h2 className="font-heading text-2xl font-semibold text-charcoal mt-1">
                  {product.name}
                </h2>
                {product.fabric && (
                  <p className="text-xs text-charcoal-muted mt-1 italic">
                    Fabric: {product.fabric}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-xl font-bold text-charcoal">
                      {formatCurrency(product.discountPrice!)}
                    </span>
                    <span className="text-sm text-charcoal-subtle line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs text-blush font-semibold bg-blush-subtle px-2 py-0.5 rounded">
                      {getDiscountPercent(product.price, product.discountPrice!)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-charcoal">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              <div className="border-t border-charcoal/5 pt-4">
                <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-4">
                  {product.shortDescription || product.description}
                </p>
              </div>

              {/* Sizes Selection */}
              {product.sizes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                    Size: {selectedSize}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 border text-xs font-medium rounded transition-all duration-300 ${
                          selectedSize === size
                            ? "bg-navy border-navy text-ivory"
                            : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors Selection */}
              {product.colors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                    Color: {selectedColor}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 border text-xs font-medium rounded transition-all duration-300 ${
                          selectedColor === color
                            ? "bg-navy border-navy text-ivory"
                            : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/40"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-charcoal/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                  Quantity
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 flex items-center justify-center border border-charcoal/10 rounded hover:bg-charcoal/5 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {product.stock > 0 ? (
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full bg-navy text-ivory hover:bg-navy-light py-3 px-4 rounded-md font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      ADD TO CART
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full bg-charcoal/5 text-charcoal-muted py-3 text-center text-sm font-semibold uppercase tracking-wider rounded-md">
                  Out of Stock
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
