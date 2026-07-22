"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getDocument, setDocument } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import { Product } from "@/types";
import { Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docData = await getDocument<Product>("products", id);
        if (docData) {
          setProduct(docData);
        } else {
          toast.error("Product not found.");
          router.push("/admin/products");
        }
      } catch (err) {
        console.error("Error loading product edit:", err);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, router]);

  const handleSubmit = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    setSubmitting(true);
    try {
      await setDocument("products", id, {
        ...data,
        updatedAt: Timestamp.now(),
      }, true);
      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes to database.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl min-h-[30vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blush" />
      </div>
    );
  }

  return <ProductForm initialProduct={product} onSubmit={handleSubmit} loading={submitting} />;
}
