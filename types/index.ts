// Shared TypeScript types for the entire YUMI DXB platform

import { Timestamp } from "firebase/firestore";

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string | null;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: Timestamp;
}

// ─── Admins ───────────────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "admin" | "content_manager" | "order_manager";

export interface AdminProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Timestamp;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  storagePath: string;
  order: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  collectionId?: string;
  collectionName?: string;
  fabric: string;
  price: number;
  discountPrice?: number;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
  stock: number;
  sku: string;
  careInstructions?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  isArchived: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  storagePath?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  storagePath?: string;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: Timestamp;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  shippingAddress: Omit<Address, "id" | "userId" | "isDefault" | "createdAt">;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentReference?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  maxStock: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: Timestamp;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  productId: string;
  addedAt: Timestamp;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  updatedAt: Timestamp;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  orderId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  customerName: string;
  location?: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export type FaqCategory =
  | "orders"
  | "payments"
  | "shipping"
  | "returns"
  | "products"
  | "account"
  | "general";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  displayOrder: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export type PolicySlug =
  | "privacy-policy"
  | "terms-conditions"
  | "shipping-policy"
  | "return-refund-policy";

export interface Policy {
  id: string;
  slug: PolicySlug;
  title: string;
  content: string; // Markdown / rich text
  updatedAt: Timestamp;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export interface SiteSettings {
  id: string;
  businessName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  phone?: string;
  businessEmail?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  linkedin?: string;
  address?: string;
  googleMapsLink?: string;
  businessHours?: string;
  currency: string;
  currencySymbol: string;
  gstNumber?: string;
  shippingFee: number;
  freeShippingAbove?: number;
  returnWindowDays: number;
  estimatedDeliveryDays: string;
  paymentGateway?: string;
  paymentConfig?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  analyticsId?: string;
  updatedAt: Timestamp;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp;
  isActive: boolean;
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "archived" | "spam";
  createdAt: Timestamp;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_order"
  | "new_message"
  | "low_stock"
  | "out_of_stock";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ─── Homepage CMS ─────────────────────────────────────────────────────────────

export interface HomepageCMS {
  id: string;
  hero: {
    headline: string;
    subheading: string;
    primaryCta: string;
    secondaryCta: string;
    imageUrl?: string;
    storagePath?: string;
  };
  storyPreview: {
    heading: string;
    body: string;
    ctaLabel: string;
  };
  featuredCollectionIds: string[];
  featuredProductIds: string[];
  brandValues: { icon: string; title: string; body: string }[];
  newsletterHeading: string;
  newsletterSubheading: string;
  updatedAt: Timestamp;
}

// ─── About CMS ────────────────────────────────────────────────────────────────

export interface AboutCMS {
  id: string;
  brandStory: string;
  mission: string;
  vision: string;
  coreValues: { title: string; body: string }[];
  founderStory: string;
  brandPromise: string;
  imageUrl?: string;
  storagePath?: string;
  updatedAt: Timestamp;
}

// ─── Inventory Log ────────────────────────────────────────────────────────────

export type InventoryChangeReason =
  | "order_placed"
  | "order_cancelled"
  | "manual_increase"
  | "manual_decrease"
  | "return";

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: InventoryChangeReason;
  referenceId?: string;
  performedBy?: string;
  createdAt: Timestamp;
}
