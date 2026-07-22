"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { setDocument } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import { Product } from "@/types";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    setSubmitting(true);
    const id = `product_${Date.now()}`;
    
    try {
      await setDocument("products", id, {
        id,
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create product document in database.");
    } finally {
      setSubmitting(false);
    }
  };

  return <ProductForm onSubmit={handleSubmit} loading={submitting} />;
}
