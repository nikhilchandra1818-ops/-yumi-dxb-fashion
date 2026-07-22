"use client";

import React, { useState, useEffect } from "react";
import { Product, Category, ProductImage } from "@/types";
import { getCollection, createDocument } from "@/lib/firebase/firestore";
import { uploadFile, deleteFile, generateStoragePath } from "@/lib/firebase/storage";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, Upload, Trash2, CheckCircle, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import Image from "next/image";

interface ProductFormProps {
  initialProduct?: Product | null;
  onSubmit: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  loading: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSubmit, loading }) => {
  const router = useRouter();

  // Form Fields State
  const [name, setName] = useState(initialProduct?.name || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || "");
  const [fabric, setFabric] = useState(initialProduct?.fabric || "");
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : "");
  const [discountPrice, setDiscountPrice] = useState(initialProduct?.discountPrice ? String(initialProduct.discountPrice) : "");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || "");
  const getInitialStockStatus = (val?: number): "in_stock" | "limited_stock" | "out_of_stock" => {
    if (val === undefined || val === null) return "in_stock";
    if (val === 0) return "out_of_stock";
    if (val > 0 && val <= 5) return "limited_stock";
    return "in_stock";
  };

  const [stockStatus, setStockStatus] = useState<"in_stock" | "limited_stock" | "out_of_stock">(
    getInitialStockStatus(initialProduct?.stock)
  );
  const [stock, setStock] = useState(
    initialProduct?.stock !== undefined ? String(initialProduct.stock) : "50"
  );
  const [careInstructions, setCareInstructions] = useState(initialProduct?.careInstructions || "");
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isNewArrival, setIsNewArrival] = useState(initialProduct?.isNewArrival || false);
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  
  // SEO Metadata
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seoDescription || "");

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Images state
  const [images, setImages] = useState<ProductImage[]>(initialProduct?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sizes checkbox selections
  const availableSizesList = ["S", "M", "L", "XL", "XXL", "Standard"];
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialProduct?.sizes || ["Standard"]);

  // Colors tag selections
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState<string[]>(initialProduct?.colors || ["Default"]);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const list = await getCollection<Category>("categories", []);
        setCategories(list);
        if (list.length > 0 && !categoryId) {
          setCategoryId(list[0].id);
        }
      } catch (err) {
        console.error("Error loading categories in form:", err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, [categoryId]);

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const storagePath = generateStoragePath("products", file.name);
      const downloadUrl = await uploadFile(storagePath, file, (progress) => {
        setUploadProgress(progress);
      });

      const newImg: ProductImage = {
        url: downloadUrl,
        storagePath,
        order: images.length + 1,
        isPrimary: images.length === 0, // first image is primary by default
      };

      setImages([...images, newImg]);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete Image
  const handleDeleteImage = async (index: number) => {
    const imgToDelete = images[index];
    const newImages = images.filter((_, idx) => idx !== index);
    
    // Adjust orders
    newImages.forEach((img, idx) => {
      img.order = idx + 1;
    });

    // If deleted primary, set first as primary
    if (imgToDelete.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setImages(newImages);

    try {
      await deleteFile(imgToDelete.storagePath);
      toast.success("Image deleted.");
    } catch (err) {
      console.error("Storage delete failed", err);
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    setImages(newImages);
    toast.success("Primary image updated.");
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleAddColor = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && colorInput.trim()) {
      e.preventDefault();
      if (!colors.includes(colorInput.trim())) {
        setColors([...colors, colorInput.trim()]);
      }
      setColorInput("");
    }
  };

  const handleRemoveColor = (col: string) => {
    setColors(colors.filter((c) => c !== col));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || !price || !categoryId || images.length === 0) {
      toast.error("Please fill in name, SKU, price, category, and upload at least one image.");
      return;
    }

    const priceVal = parseFloat(price);
    const discountVal = discountPrice ? parseFloat(discountPrice) : undefined;
    const stockVal = parseInt(stock) || 0;

    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Price must be a valid positive number.");
      return;
    }

    if (discountVal && (isNaN(discountVal) || discountVal > priceVal || discountVal < 0)) {
      toast.error("Discount price must be less than original price.");
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);

    const submissionData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
      name,
      slug: initialProduct?.slug || slugify(name),
      sku: sku.toUpperCase().trim(),
      description,
      shortDescription,
      fabric,
      price: priceVal,
      discountPrice: discountVal,
      categoryId,
      categoryName: catObj?.name || "",
      images,
      sizes: selectedSizes,
      colors,
      stock: stockVal,
      careInstructions,
      isFeatured,
      isNewArrival,
      isActive,
      isArchived: initialProduct?.isArchived || false,
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || shortDescription,
    };

    await onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in text-left">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 border border-charcoal/10 rounded-full hover:bg-charcoal/5 text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <h2 className="font-heading text-2xl font-bold text-charcoal">
          {initialProduct ? `Edit "${initialProduct.name}"` : "Create New apparel"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Core Form Content */}
        <div className="lg:col-span-2 space-y-6 bg-ivory-light border border-charcoal/5 rounded-2xl p-6 md:p-8 shadow-soft">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">apparel Name *</label>
              <input
                type="text" required placeholder="apparel Name"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* SKU */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">SKU Code *</label>
              <input
                type="text" required placeholder="YUMI-AB-01"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal uppercase"
                value={sku} onChange={(e) => setSku(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted font-body">Category *</label>
              <select
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm text-charcoal focus:outline-none focus:border-blush"
                disabled={loadingCats}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fabric */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Fabric Type</label>
              <input
                type="text" placeholder="Premium Linen / Rayon Crepe"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                value={fabric} onChange={(e) => setFabric(e.target.value)}
              />
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Short Description</label>
            <input
              type="text" placeholder="Brief summary shown in product previews..."
              className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
              value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Detailed Description</label>
            <textarea
              rows={5} placeholder="Full garment descriptions, textures, and details..."
              className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Price (₹) *</label>
              <input
                type="number" required placeholder="1999"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Discount Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Discount Price (₹)</label>
              <input
                type="number" placeholder="1499"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)}
              />
            </div>

            {/* Stock Availability Status Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Stock Availability *
              </label>
              <select
                className="w-full bg-ivory border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal font-semibold"
                value={stockStatus}
                onChange={(e) => {
                  const status = e.target.value as "in_stock" | "limited_stock" | "out_of_stock";
                  setStockStatus(status);
                  if (status === "in_stock") setStock("50");
                  else if (status === "limited_stock") setStock("3");
                  else setStock("0");
                }}
              >
                <option value="in_stock">In Stock (Available)</option>
                <option value="limited_stock">Limited Stock (Few Left)</option>
                <option value="out_of_stock">Out of Stock (Disabled)</option>
              </select>
            </div>
          </div>

          {/* Care Instructions */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Care Instructions</label>
            <textarea
              rows={3} placeholder="Dry clean only / Machine wash cold with similar colors..."
              className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
              value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)}
            />
          </div>

          {/* Sizes Selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block">Available Sizes</span>
            <div className="flex flex-wrap gap-4">
              {availableSizesList.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size} type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-4 py-2 border text-xs font-semibold rounded transition-all duration-300 ${
                      isSelected
                        ? "bg-navy border-navy text-ivory shadow-soft"
                        : "bg-transparent border-charcoal/10 text-charcoal hover:border-charcoal/30"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block">Available Colors (Enter to add)</label>
            <div className="flex flex-wrap gap-2 border border-charcoal/10 rounded-md p-3 min-h-[44px]">
              {colors.map((color) => (
                <span
                  key={color}
                  className="bg-blush-subtle text-blush text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1.5"
                >
                  <span>{color}</span>
                  <button type="button" onClick={() => handleRemoveColor(color)} className="hover:text-red-700">
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text" placeholder="Add color..."
                className="bg-transparent border-0 outline-none text-xs focus:ring-0 flex-1 p-0.5"
                value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={handleAddColor}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Media Upload, SEO, Visibility */}
        <div className="space-y-6">
          
          {/* Images Section */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2">Media Upload *</h3>
            
            {/* Grid of uploaded images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images
                  .sort((a, b) => a.order - b.order)
                  .map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] bg-charcoal/5 rounded border overflow-hidden group">
                      <Image src={img.url} alt="product" fill className="object-cover" />
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-navy text-ivory text-[8px] font-bold px-1 py-0.5 rounded tracking-wide">
                          PRIMARY
                        </span>
                      )}
                      
                      {/* Hover action bar */}
                      <div className="absolute inset-0 bg-charcoal/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {!img.isPrimary && (
                          <button
                            type="button" onClick={() => handleSetPrimaryImage(idx)}
                            className="p-1.5 bg-ivory rounded-full text-navy hover:text-navy-light text-xs font-bold"
                            title="Set Primary"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button" onClick={() => handleDeleteImage(idx)}
                          className="p-1.5 bg-ivory rounded-full text-red-600 hover:text-red-700 text-xs font-bold"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="relative border-2 border-dashed border-charcoal/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 hover:border-blush transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-charcoal-subtle" />
              <div>
                <p className="text-xs font-semibold text-charcoal">Click to upload garment image</p>
                <p className="text-[10px] text-charcoal-muted mt-0.5">Supports PNG, JPG, JPEG (Max 5MB)</p>
              </div>
              <input
                type="file" accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>

            {uploadingImage && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold text-blush">
                  <span>Uploading image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-charcoal/15 h-1.5 rounded overflow-hidden">
                  <div className="bg-blush h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Visibility and Promotion settings */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2">Visibility & Badging</h3>
            
            <div className="flex items-center justify-between py-1.5">
              <label htmlFor="checkbox-active" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Publish Visibility</label>
              <input
                id="checkbox-active" type="checkbox"
                className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <label htmlFor="checkbox-featured" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Featured Product</label>
              <input
                id="checkbox-featured" type="checkbox"
                className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between py-1.5">
              <label htmlFor="checkbox-new" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Mark New Arrival</label>
              <input
                id="checkbox-new" type="checkbox"
                className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)}
              />
            </div>
          </div>

          {/* SEO Metadata Settings */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2 font-body">SEO Configuration</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Meta Title</label>
              <input
                type="text" placeholder="Title tag for search engines..."
                className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-xs focus:outline-none focus:border-blush text-charcoal"
                value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Meta Description</label>
              <textarea
                rows={3} placeholder="Brief details seen on Google search results..."
                className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-xs focus:outline-none focus:border-blush text-charcoal"
                value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-ivory hover:bg-navy-light py-3 px-6 rounded-md font-semibold tracking-widest uppercase transition-colors text-center text-xs shadow-navy flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{initialProduct ? "Save Changes" : "Create Product"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
