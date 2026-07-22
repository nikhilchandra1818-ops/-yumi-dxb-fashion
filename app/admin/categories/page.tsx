"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { uploadFile, deleteFile, generateStoragePath } from "@/lib/firebase/storage";
import { Category } from "@/types";
import { slugify } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  FolderOpen,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Plus,
  Loader2,
  Inbox,
} from "lucide-react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const list = await getCollection<Category>("categories", []);
      list.sort((a, b) => a.displayOrder - b.displayOrder);
      setCategories(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenForm = (cat: Category | null = null) => {
    setEditingCategory(cat);
    if (cat) {
      setName(cat.name);
      setDescription(cat.description || "");
      setImageUrl(cat.imageUrl || "");
      setStoragePath(cat.storagePath || "");
      setDisplayOrder(String(cat.displayOrder));
      setIsActive(cat.isActive);
    } else {
      setName("");
      setDescription("");
      setImageUrl("");
      setStoragePath("");
      setDisplayOrder(String(categories.length + 1));
      setIsActive(true);
    }
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const path = generateStoragePath("categories", file.name);
      const url = await uploadFile(path, file, (progress) => {
        setUploadProgress(progress);
      });
      setImageUrl(url);
      setStoragePath(path);
      toast.success("Category banner uploaded!");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!storagePath) return;
    try {
      await deleteFile(storagePath);
      setImageUrl("");
      setStoragePath("");
      toast.success("Banner deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !displayOrder) {
      toast.error("Name and Display Order are required.");
      return;
    }

    setLoading(true);
    const id = editingCategory?.id || `category_${Date.now()}`;

    try {
      const categoryData: Omit<Category, "id" | "createdAt" | "updatedAt"> = {
        name,
        slug: editingCategory?.slug || slugify(name),
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        storagePath: storagePath || undefined,
        displayOrder: parseInt(displayOrder) || 1,
        isActive,
      };

      await setDocument("categories", id, {
        id,
        ...categoryData,
        createdAt: editingCategory?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success(editingCategory ? "Category updated!" : "Category created!");
      setIsFormOpen(false);
      await fetchCategories();
    } catch (err) {
      toast.error("Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    setLoading(true);
    try {
      if (cat.storagePath) {
        await deleteFile(cat.storagePath);
      }
      await deleteDocument("categories", cat.id);
      toast.success("Category deleted.");
      await fetchCategories();
    } catch (err) {
      toast.error("Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (cat: Category) => {
    try {
      await setDocument("categories", cat.id, { isActive: !cat.isActive }, true);
      toast.success(cat.isActive ? "Category hidden." : "Category visible!");
      await fetchCategories();
    } catch (err) {
      toast.error("Failed to toggle visibility.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Catalog Config
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Category Management
          </h1>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
        >
          + Add Category
        </button>
      </div>

      {/* Grid: Form modal overlay + Category list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-ivory-light border border-charcoal/5 rounded-2xl overflow-hidden shadow-soft flex flex-col justify-between"
            >
              {/* Category Image Header */}
              <div className="relative aspect-video bg-charcoal/5">
                {cat.imageUrl ? (
                  <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover object-top" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-ivory-dark to-blush-subtle/20 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-charcoal-subtle" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-navy text-ivory text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                    Order: {cat.displayOrder}
                  </span>
                </div>
              </div>

              {/* Category Info */}
              <div className="p-6 space-y-4 text-left flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-heading text-xl font-semibold text-charcoal">{cat.name}</h3>
                  <p className="font-mono text-[10px] text-charcoal-subtle">/{cat.slug}</p>
                  <p className="text-xs text-charcoal-muted leading-relaxed font-light mt-2 line-clamp-2">
                    {cat.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-charcoal/5 pt-4 text-xs font-semibold uppercase tracking-wider">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVisibilityToggle(cat)}
                      className={`p-1.5 rounded hover:bg-charcoal/5 ${cat.isActive ? "text-navy" : "text-charcoal-subtle"}`}
                      title={cat.isActive ? "Hide category" : "Show category"}
                    >
                      {cat.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenForm(cat)}
                      className="p-1.5 border border-charcoal/10 rounded-full text-navy hover:text-navy-light inline-flex items-center justify-center bg-transparent"
                      title="Edit details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 border border-charcoal/10 rounded-full text-red-600 hover:text-red-700 inline-flex items-center justify-center bg-transparent"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Categories Configured</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              Define your catalog hierarchy. Add category details to organize your clothing sets dynamically!
            </p>
          </div>
          <button
            onClick={() => handleOpenForm(null)}
            className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy inline-block"
          >
            Create First Category
          </button>
        </div>
      )}

      {/* CATEGORY FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal Content */}
          <div className="bg-ivory w-full max-w-md rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Category Name *</label>
                <input
                  type="text" required placeholder="Abayas"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Description</label>
                <textarea
                  rows={3} placeholder="Elegant and flowing dress wear..."
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Display Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted font-body">Display Order *</label>
                  <input
                    type="number" required placeholder="1"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
                {/* Visibility */}
                <div className="flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="cat-active" type="checkbox"
                      className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                      checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label htmlFor="cat-active" className="text-xs text-charcoal-muted font-light">Active Status</label>
                  </div>
                </div>
              </div>

              {/* Image Upload Banner */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block">Category Banner Image</span>
                {imageUrl ? (
                  <div className="relative aspect-video rounded border overflow-hidden bg-charcoal/5 group">
                    <Image src={imageUrl} alt="banner preview" fill className="object-cover" />
                    <button
                      type="button" onClick={handleImageDelete}
                      className="absolute top-2 right-2 p-1.5 bg-ivory rounded-full text-red-600 hover:text-red-700 shadow-soft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-charcoal/20 rounded p-6 flex flex-col items-center justify-center text-center space-y-1 hover:border-blush transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-charcoal-subtle" />
                    <span className="text-[10px] font-semibold text-charcoal">Upload banner</span>
                    <input
                      type="file" accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload} disabled={uploading}
                    />
                  </div>
                )}

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-blush">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-charcoal/15 h-1.5 rounded overflow-hidden">
                      <div className="bg-blush h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/5 mt-4">
                <button
                  type="button" onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-charcoal/15 text-charcoal hover:bg-charcoal/5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-ivory hover:bg-navy-light rounded text-xs font-semibold uppercase tracking-wider shadow-navy"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
