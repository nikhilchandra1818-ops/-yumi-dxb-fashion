"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { uploadFile, deleteFile, generateStoragePath } from "@/lib/firebase/storage";
import { Collection } from "@/types";
import { slugify } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  Sliders,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Plus,
  Loader2,
  Inbox,
  Star,
} from "lucide-react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const list = await getCollection<Collection>("collections", []);
      list.sort((a, b) => a.displayOrder - b.displayOrder);
      setCollections(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleOpenForm = (coll: Collection | null = null) => {
    setEditingCollection(coll);
    if (coll) {
      setName(coll.name);
      setDescription(coll.description || "");
      setBannerUrl(coll.bannerUrl || "");
      setStoragePath(coll.storagePath || "");
      setDisplayOrder(String(coll.displayOrder));
      setIsFeatured(coll.isFeatured);
      setIsActive(coll.isActive);
    } else {
      setName("");
      setDescription("");
      setBannerUrl("");
      setStoragePath("");
      setDisplayOrder(String(collections.length + 1));
      setIsFeatured(false);
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
      const path = generateStoragePath("collections", file.name);
      const url = await uploadFile(path, file, (progress) => {
        setUploadProgress(progress);
      });
      setBannerUrl(url);
      setStoragePath(path);
      toast.success("Collection banner uploaded!");
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
      setBannerUrl("");
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
    const id = editingCollection?.id || `collection_${Date.now()}`;

    try {
      const collectionData: Omit<Collection, "id" | "createdAt" | "updatedAt"> = {
        name,
        slug: editingCollection?.slug || slugify(name),
        description: description || undefined,
        bannerUrl: bannerUrl || undefined,
        storagePath: storagePath || undefined,
        displayOrder: parseInt(displayOrder) || 1,
        isFeatured,
        isActive,
      };

      await setDocument("collections", id, {
        id,
        ...collectionData,
        createdAt: editingCollection?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast.success(editingCollection ? "Collection updated!" : "Collection created!");
      setIsFormOpen(false);
      await fetchCollections();
    } catch (err) {
      toast.error("Failed to save collection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (coll: Collection) => {
    if (!confirm(`Are you sure you want to delete collection "${coll.name}"?`)) return;

    setLoading(true);
    try {
      if (coll.storagePath) {
        await deleteFile(coll.storagePath);
      }
      await deleteDocument("collections", coll.id);
      toast.success("Collection deleted.");
      await fetchCollections();
    } catch (err) {
      toast.error("Failed to delete collection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (coll: Collection) => {
    try {
      await setDocument("collections", coll.id, { isActive: !coll.isActive }, true);
      toast.success(coll.isActive ? "Collection hidden." : "Collection visible!");
      await fetchCollections();
    } catch (err) {
      toast.error("Failed to toggle visibility.");
    }
  };

  const handleFeatureToggle = async (coll: Collection) => {
    try {
      await setDocument("collections", coll.id, { isFeatured: !coll.isFeatured }, true);
      toast.success(coll.isFeatured ? "Removed from Featured." : "Marked Featured!");
      await fetchCollections();
    } catch (err) {
      toast.error("Failed to toggle featured status.");
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
            Collection Management
          </h1>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
        >
          + Add Collection
        </button>
      </div>

      {/* Grid: Form modal overlay + Collection list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((coll) => (
            <div
              key={coll.id}
              className="bg-ivory-light border border-charcoal/5 rounded-2xl overflow-hidden shadow-soft flex flex-col justify-between"
            >
              {/* Collection Banner Image */}
              <div className="relative aspect-video bg-charcoal/5">
                {coll.bannerUrl ? (
                  <Image src={coll.bannerUrl} alt={coll.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-ivory-dark to-blush-subtle/20 flex items-center justify-center">
                    <Sliders className="w-8 h-8 text-charcoal-subtle" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-navy text-ivory text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                    Order: {coll.displayOrder}
                  </span>
                </div>
              </div>

              {/* Info details */}
              <div className="p-6 space-y-4 text-left flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-heading text-xl font-semibold text-charcoal">{coll.name}</h3>
                  <p className="font-mono text-[10px] text-charcoal-subtle">/{coll.slug}</p>
                  <p className="text-xs text-charcoal-muted leading-relaxed font-light mt-2 line-clamp-2">
                    {coll.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-charcoal/5 pt-4 text-xs font-semibold uppercase tracking-wider">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeatureToggle(coll)}
                      className={`p-1.5 rounded hover:bg-charcoal/5 ${coll.isFeatured ? "text-blush" : "text-charcoal-subtle"}`}
                      title={coll.isFeatured ? "Remove Featured" : "Mark Featured"}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleVisibilityToggle(coll)}
                      className={`p-1.5 rounded hover:bg-charcoal/5 ${coll.isActive ? "text-navy" : "text-charcoal-subtle"}`}
                      title={coll.isActive ? "Hide collection" : "Show collection"}
                    >
                      {coll.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenForm(coll)}
                      className="p-1.5 border border-charcoal/10 rounded-full text-navy hover:text-navy-light inline-flex items-center justify-center bg-transparent"
                      title="Edit details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(coll)}
                    className="p-1.5 border border-charcoal/10 rounded-full text-red-600 hover:text-red-700 inline-flex items-center justify-center bg-transparent"
                    title="Delete Collection"
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
            <Sliders className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Collections Configured</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              Create themed collections (e.g. Desert Mirage) to display on the client landing page dynamically!
            </p>
          </div>
          <button
            onClick={() => handleOpenForm(null)}
            className="px-6 py-2.5 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy inline-block"
          >
            Create First Collection
          </button>
        </div>
      )}

      {/* COLLECTION FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal Content */}
          <div className="bg-ivory w-full max-w-md rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
              {editingCollection ? "Edit Collection" : "Add Collection"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-left">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted font-body">Collection Name *</label>
                <input
                  type="text" required placeholder="Desert Mirage"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Description</label>
                <textarea
                  rows={3} placeholder="Premium collections celebrating elegance..."
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Display Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Display Order *</label>
                  <input
                    type="number" required placeholder="1"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>
                {/* Checkboxes */}
                <div className="flex flex-col gap-1.5 justify-end pb-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="coll-active" type="checkbox"
                      className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                      checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label htmlFor="coll-active" className="text-xs text-charcoal-muted font-light">Active Status</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="coll-featured" type="checkbox"
                      className="w-4 h-4 border-charcoal/15 text-navy focus:ring-navy rounded bg-transparent"
                      checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <label htmlFor="coll-featured" className="text-xs text-charcoal-muted font-light">Featured Status</label>
                  </div>
                </div>
              </div>

              {/* Image Upload Banner */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block font-body">Collection Banner Banner</span>
                {bannerUrl ? (
                  <div className="relative aspect-video rounded border overflow-hidden bg-charcoal/5 group">
                    <Image src={bannerUrl} alt="banner preview" fill className="object-cover" />
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
                    <span className="text-[10px] font-semibold text-charcoal">Upload banner image</span>
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
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
