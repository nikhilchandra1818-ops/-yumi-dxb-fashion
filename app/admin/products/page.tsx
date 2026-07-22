"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCollection, deleteDocument, setDocument } from "@/lib/firebase/firestore";
import { Product, Category } from "@/types";
import { formatCurrency, formatDate, slugify } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Copy,
  Archive,
  Star,
  Eye,
  EyeOff,
  Inbox,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodList, catList] = await Promise.all([
        getCollection<Product>("products"),
        getCollection<Category>("categories"),
      ]);
      setProducts(prodList);
      setCategories(catList);
    } catch (err) {
      console.error("Error loading admin products:", err);
      toast.error("Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDuplicate = async (product: Product) => {
    if (!confirm(`Are you sure you want to duplicate "${product.name}"?`)) return;

    setLoading(true);
    const newId = `product_${Date.now()}`;
    const newName = `${product.name} (Copy)`;
    const newSlug = `${product.slug}-copy-${Math.floor(Math.random() * 1000)}`;

    try {
      const duplicate: Omit<Product, "id"> = {
        ...product,
        name: newName,
        slug: newSlug,
        sku: `${product.sku}-COPY`,
        isFeatured: false,
        isActive: false, // Start as inactive copy
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDocument("products", newId, duplicate);
      toast.success("Product duplicated successfully.");
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to duplicate product.");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async (product: Product) => {
    setLoading(true);
    try {
      await setDocument("products", product.id, { isArchived: !product.isArchived }, true);
      toast.success(product.isArchived ? "Product restored." : "Product archived.");
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to archive/restore product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      await deleteDocument("products", id);
      toast.success("Product deleted successfully.");
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (product: Product) => {
    try {
      await setDocument("products", product.id, { isFeatured: !product.isFeatured }, true);
      toast.success(product.isFeatured ? "Removed from Featured." : "Marked as Featured!");
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to update featured status.");
    }
  };

  const handleVisibilityToggle = async (product: Product) => {
    try {
      await setDocument("products", product.id, { isActive: !product.isActive }, true);
      toast.success(product.isActive ? "Product hidden." : "Product visible!");
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to update visibility.");
    }
  };

  // ─── Filter Logic ─────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    const nameMatch =
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = selectedCategory === "all" || p.categoryId === selectedCategory;
    
    let statusMatch = true;
    if (selectedStatus === "active") statusMatch = !!p.isActive && !p.isArchived;
    else if (selectedStatus === "inactive") statusMatch = !p.isActive && !p.isArchived;
    else if (selectedStatus === "archived") statusMatch = !!p.isArchived;
    else if (selectedStatus === "featured") statusMatch = !!p.isFeatured;

    return nameMatch && catMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Catalog
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Creations Management
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
        >
          + Add Creation
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft items-center">
        {/* Search */}
        <div className="relative rounded-md shadow-sm col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-subtle">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-transparent border border-charcoal/10 rounded-md p-2 text-sm text-charcoal focus:outline-none focus:border-blush"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-transparent border border-charcoal/10 rounded-md p-2 text-sm text-charcoal focus:outline-none focus:border-blush"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="featured">Featured Only</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>

      {/* Products Table/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-sm">
                {filteredProducts.map((prod) => {
                  const img = prod.images?.find((i) => i.isPrimary)?.url || "/images/placeholder.jpg";
                  return (
                    <tr key={prod.id} className="hover:bg-charcoal/[0.02] transition-colors">
                      {/* Product Name & Image */}
                      <td className="p-4 pl-6 flex items-center gap-4">
                        <div className="relative w-10 h-13 bg-charcoal/5 border border-charcoal/5 rounded overflow-hidden flex-shrink-0">
                          <Image src={img} alt={prod.name} fill className="object-cover" />
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal block line-clamp-1">{prod.name}</span>
                          <span className="text-[10px] text-charcoal-subtle font-light block">{prod.fabric}</span>
                        </div>
                      </td>
                      {/* SKU */}
                      <td className="p-4 font-mono text-xs">{prod.sku}</td>
                      {/* Category */}
                      <td className="p-4 text-xs font-semibold text-blush">{prod.categoryName}</td>
                      {/* Price */}
                      <td className="p-4 font-semibold text-charcoal">
                        {formatCurrency(prod.discountPrice ?? prod.price)}
                      </td>
                      {/* Stock */}
                      <td className="p-4">
                        {prod.stock <= 0 ? (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Out of Stock</span>
                        ) : prod.stock <= 5 ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Limited Stock</span>
                        ) : (
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">In Stock</span>
                        )}
                      </td>
                      {/* Status Checkboxes / badges */}
                      <td className="p-4 space-x-2">
                        {/* Featured Button */}
                        <button
                          onClick={() => handleFeatureToggle(prod)}
                          className={`p-1 rounded hover:bg-charcoal/5 ${prod.isFeatured ? "text-blush" : "text-charcoal-subtle"}`}
                          title={prod.isFeatured ? "Remove Featured" : "Mark Featured"}
                        >
                          <Star className="w-4.5 h-4.5 fill-current" />
                        </button>
                        {/* Visibility Button */}
                        <button
                          onClick={() => handleVisibilityToggle(prod)}
                          className={`p-1 rounded hover:bg-charcoal/5 ${prod.isActive ? "text-navy" : "text-charcoal-subtle"}`}
                          title={prod.isActive ? "Hide Product" : "Publish Product"}
                        >
                          {prod.isActive ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </button>
                        {prod.isArchived && (
                          <span className="bg-charcoal/10 text-charcoal-muted text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Archived
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="p-4 pr-6 text-right space-x-1.5">
                        <Link
                          href={`/admin/products/edit/${prod.id}`}
                          className="p-2 border border-charcoal/10 hover:border-navy text-navy rounded-full inline-flex items-center justify-center bg-transparent"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(prod)}
                          className="p-2 border border-charcoal/10 hover:border-charcoal text-charcoal rounded-full inline-flex items-center justify-center bg-transparent"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveToggle(prod)}
                          className="p-2 border border-charcoal/10 hover:border-yellow-600 text-yellow-600 rounded-full inline-flex items-center justify-center bg-transparent"
                          title={prod.isArchived ? "Restore" : "Archive"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-2 border border-charcoal/10 hover:border-red-600 text-red-600 rounded-full inline-flex items-center justify-center bg-transparent"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Creations Found</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              We couldn&rsquo;t find any products in your catalog. Get started by adding your first luxury apparel!
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy inline-block"
          >
            Add First Creation
          </Link>
        </div>
      )}
    </div>
  );
}
