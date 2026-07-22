import { MetadataRoute } from "next";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product } from "@/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://yumi-e33cd.web.app";

  // Static routes
  const routes = [
    "",
    "/about",
    "/collections",
    "/contact",
    "/faq",
    "/policies/privacy-policy",
    "/policies/terms-conditions",
    "/policies/shipping-policy",
    "/policies/return-refund-policy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.7,
  }));

  try {
    // Fetch products dynamically to append to sitemap
    const products = await getCollection<Product>("products", [
      where("isActive", "==", true),
      where("isArchived", "==", false),
    ]);

    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt?.seconds * 1000 || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes];
  } catch (err) {
    console.error("Error generating sitemap dynamically", err);
    return routes;
  }
}
