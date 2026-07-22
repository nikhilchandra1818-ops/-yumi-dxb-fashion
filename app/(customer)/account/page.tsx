"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { getCollection, where, setDocument, deleteDocument, db } from "@/lib/firebase/firestore";
import { Order, Address, Product, WishlistItem } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser, changePassword } from "@/lib/firebase/auth";
import { toast } from "react-hot-toast";
import {
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  LogOut,
  User as UserIcon,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Eye,
  Loader2,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Timestamp, doc } from "firebase/firestore";

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const router = useRouter();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "wishlist" | "settings">("orders");

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Address Modal/Form State
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);

  // Profile Edit State
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Edit State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Load User Data
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/account");
      return;
    }

    const loadUserData = async () => {
      setLoadingData(true);
      try {
        // 1. Fetch Orders
        const ords = await getCollection<Order>("orders", [
          where("userId", "==", user.uid),
        ]);
        ords.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(ords);

        // 2. Fetch Addresses
        const addrs = await getCollection<Address>("addresses", [
          where("userId", "==", user.uid),
        ]);
        setAddresses(addrs);

        // 3. Fetch Wishlisted Products (query details from products collection)
        if (wishlistItems.length > 0) {
          const productIds = wishlistItems.map((item) => item.productId);
          // Split queries into chunks if > 10 because Firestore 'in' matches max 10
          const productsList: Product[] = [];
          for (let i = 0; i < productIds.length; i += 10) {
            const chunk = productIds.slice(i, i + 10);
            const chunkProds = await getCollection<Product>("products", [
              where("__name__", "in", chunk),
            ]);
            productsList.push(...chunkProds);
          }
          setWishlistProducts(productsList);
        } else {
          setWishlistProducts([]);
        }
      } catch (err) {
        console.error("Error loading account data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user, wishlistItems, router]);

  // Sync profile details state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear auth cookies
      document.cookie = "yumi_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "yumi_is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success("Successfully logged out.");
      router.push("/");
    } catch (err) {
      toast.error("Logout failed.");
    }
  };

  // ─── Profile Management ─────────────────────────────────────────────────────

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName) {
      toast.error("Name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      await setDocument("users", user.uid, {
        displayName,
        phone,
      }, true);
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPass(true);
    try {
      await changePassword(user, currentPassword, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to change password. Please check your current password.";
      if (err.code === "auth/wrong-password") msg = "Incorrect current password.";
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  // ─── Address Management ─────────────────────────────────────────────────────

  const handleOpenAddressModal = (addr: Address | null = null) => {
    setEditingAddress(addr);
    if (addr) {
      setAddrName(addr.fullName);
      setAddrPhone(addr.phone);
      setAddrLine1(addr.addressLine1);
      setAddrLine2(addr.addressLine2 || "");
      setAddrCity(addr.city);
      setAddrState(addr.state);
      setAddrPincode(addr.pincode);
      setAddrDefault(addr.isDefault);
    } else {
      setAddrName("");
      setAddrPhone("");
      setAddrLine1("");
      setAddrLine2("");
      setAddrCity("");
      setAddrState("");
      setAddrPincode("");
      setAddrDefault(addresses.length === 0);
    }
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!addrName || !addrPhone || !addrLine1 || !addrCity || !addrState || !addrPincode) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(addrPincode)) {
      toast.error("Invalid pincode.");
      return;
    }

    setLoadingData(true);
    const id = editingAddress?.id || `address_${Date.now()}`;

    try {
      // If default is selected, unset default on other addresses
      if (addrDefault) {
        await Promise.all(
          addresses.map(async (a) => {
            if (a.id !== id && a.isDefault) {
              await setDocument("addresses", a.id, { isDefault: false }, true);
            }
          })
        );
      }

      await setDocument("addresses", id, {
        id,
        userId: user.uid,
        fullName: addrName,
        phone: addrPhone,
        addressLine1: addrLine1,
        addressLine2: addrLine2 || null,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        country: "India",
        isDefault: addrDefault,
        createdAt: editingAddress?.createdAt || Timestamp.now(),
      });

      toast.success(editingAddress ? "Address updated!" : "Address saved!");
      setIsAddressFormOpen(false);
      
      // Reload addresses
      const updatedAddrs = await getCollection<Address>("addresses", [
        where("userId", "==", user.uid),
      ]);
      setAddresses(updatedAddrs);
    } catch (err) {
      toast.error("Failed to save address.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this address?")) return;

    setLoadingData(true);
    try {
      await deleteDocument("addresses", id);
      toast.success("Address deleted.");
      
      const updatedAddrs = await getCollection<Address>("addresses", [
        where("userId", "==", user.uid),
      ]);
      setAddresses(updatedAddrs);
    } catch (err) {
      toast.error("Failed to delete address.");
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Wishlist Move To Cart ──────────────────────────────────────────────────

  const handleMoveWishlistToCart = async (product: Product) => {
    try {
      const primaryImg = product.images.find((img) => img.isPrimary)?.url || "/images/placeholder.jpg";
      const size = product.sizes[0] || "Standard";
      const color = product.colors[0] || "Default";

      await addToCart(
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl: primaryImg,
          size,
          color,
          price: product.price,
          discountPrice: product.discountPrice,
          maxStock: product.stock,
        },
        1
      );

      await removeFromWishlist(product.id);
      toast.success("Moved item to cart!");
    } catch (err) {
      toast.error("Failed to move item.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-charcoal/5 mb-8">
        <div className="flex items-center gap-4 text-left">
          <div className="w-16 h-16 bg-blush-subtle/50 text-blush rounded-full flex items-center justify-center font-heading text-3xl font-semibold uppercase">
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-charcoal">
              Welcome, {profile?.displayName || "Customer"}
            </h1>
            <p className="text-xs text-charcoal-muted font-body mt-1">
              Member since {profile?.createdAt ? formatDate(profile.createdAt) : "2024"}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-charcoal/20 text-charcoal hover:bg-blush hover:text-ivory hover:border-blush text-xs font-semibold uppercase tracking-widest rounded-md transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Grid Layout: Sidebar Navigation + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 lg:overflow-visible no-scrollbar">
          {[
            { label: "Order History", value: "orders", icon: ShoppingBag },
            { label: "Saved Addresses", value: "addresses", icon: MapPin },
            { label: "My Wishlist", value: "wishlist", icon: Heart },
            { label: "Account Settings", value: "settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-navy text-ivory shadow-soft font-bold"
                    : "bg-ivory-light border border-charcoal/5 text-charcoal hover:bg-charcoal/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blush" : "text-charcoal-muted"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-20 min-h-[30vh]">
              <Loader2 className="w-8 h-8 animate-spin text-blush" />
            </div>
          ) : (
            <>
              {/* TAB 1: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-heading text-2xl font-semibold text-charcoal border-b border-charcoal/5 pb-3">
                    Order History
                  </h2>

                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-charcoal/20 transition-all"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-blush">
                              Order: {order.orderNumber}
                            </span>
                            <p className="text-sm font-semibold text-charcoal">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                            <p className="text-xs text-charcoal-muted font-light">
                              Items: {order.items.reduce((acc, i) => acc + i.quantity, 0)} | Total:{" "}
                              <strong className="text-charcoal font-semibold">{formatCurrency(order.total)}</strong>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${
                              ORDER_STATUS_COLORS[order.status] || "bg-charcoal/5"
                            }`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                            
                            <button
                              onClick={() => setViewingOrder(order)}
                              className="p-2 border border-charcoal/10 hover:border-navy text-navy rounded-full transition-colors bg-transparent"
                              title="Track Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Orders state */
                    <div className="text-center py-16 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-4">
                      <div className="w-12 h-12 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-charcoal-muted font-light">You haven&rsquo;t placed any orders yet.</p>
                      <Link href="/collections" className="inline-block px-4 py-2 bg-navy text-ivory text-xs uppercase tracking-wider rounded">
                        Shop Now
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAVED ADDRESSES */}
              {activeTab === "addresses" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-charcoal/5 pb-3">
                    <h2 className="font-heading text-2xl font-semibold text-charcoal">
                      Saved Addresses
                    </h2>
                    <button
                      onClick={() => handleOpenAddressModal(null)}
                      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blush hover:text-blush-dark transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New</span>
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-ivory-light border border-charcoal/5 rounded-xl p-6 shadow-soft space-y-3 relative flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-charcoal text-sm">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="bg-blush-subtle text-blush text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-charcoal-muted mt-2 leading-relaxed font-light">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""} <br />
                              {addr.city}, {addr.state} - {addr.pincode} <br />
                              Phone: {addr.phone}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 pt-4 border-t border-charcoal/5 text-xs font-semibold uppercase tracking-wider">
                            <button
                              onClick={() => handleOpenAddressModal(addr)}
                              className="text-navy hover:text-navy-light transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-charcoal-muted hover:text-blush transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-4">
                      <div className="w-12 h-12 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-charcoal-muted font-light">You haven&rsquo;t saved any addresses yet.</p>
                      <button
                        onClick={() => handleOpenAddressModal(null)}
                        className="px-4 py-2 bg-navy text-ivory text-xs uppercase tracking-wider rounded"
                      >
                        Add Address
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: WISHLIST */}
              {activeTab === "wishlist" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-heading text-2xl font-semibold text-charcoal border-b border-charcoal/5 pb-3">
                    My Wishlist
                  </h2>

                  {wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {wishlistProducts.map((prod) => {
                        const img = prod.images.find((i) => i.isPrimary)?.url || "/images/placeholder.jpg";
                        return (
                          <div
                            key={prod.id}
                            className="bg-ivory-light border border-charcoal/5 rounded-xl p-4 shadow-soft flex items-center gap-4 hover:border-charcoal/20 transition-all justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-20 bg-charcoal/5 border border-charcoal/5 rounded overflow-hidden flex-shrink-0">
                                <Image src={img} alt={prod.name} fill className="object-cover" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-heading text-base font-semibold text-charcoal line-clamp-1">
                                  <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                                </h3>
                                <p className="text-[10px] text-blush uppercase tracking-wider font-semibold">{prod.categoryName}</p>
                                <p className="text-xs font-bold text-charcoal">{formatCurrency(prod.discountPrice ?? prod.price)}</p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleMoveWishlistToCart(prod)}
                                className="p-2 bg-navy hover:bg-navy-light text-ivory rounded-full shadow-soft transition-colors"
                                title="Move to Cart"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeFromWishlist(prod.id)}
                                className="p-2 border border-charcoal/10 hover:bg-charcoal/5 text-charcoal-muted rounded-full transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-4">
                      <div className="w-12 h-12 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
                        <Heart className="w-6 h-6" />
                      </div>
                      <p className="text-sm text-charcoal-muted font-light">Your wishlist is empty.</p>
                      <Link href="/collections" className="inline-block px-4 py-2 bg-navy text-ivory text-xs uppercase tracking-wider rounded">
                        Add Items
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-12 animate-fade-in">
                  
                  {/* Profile Edit */}
                  <div className="space-y-6">
                    <h2 className="font-heading text-2xl font-semibold text-charcoal border-b border-charcoal/5 pb-3">
                      Profile Settings
                    </h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Email Address (Not editable)</label>
                        <input
                          type="email"
                          disabled
                          className="w-full bg-charcoal/5 border border-charcoal/10 rounded-md p-3 text-sm text-charcoal-muted cursor-not-allowed"
                          value={user?.email || ""}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Display Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Display Name"
                          className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={savingProfile}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={savingProfile}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded transition-all shadow-navy"
                      >
                        {savingProfile ? "Saving..." : "Save Profile"}
                      </button>
                    </form>
                  </div>

                  {/* Change Password */}
                  <div className="space-y-6 pt-6 border-t border-charcoal/5">
                    <h2 className="font-heading text-2xl font-semibold text-charcoal border-b border-charcoal/5 pb-3">
                      Change Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Current Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={changingPass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={changingPass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          disabled={changingPass}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={changingPass}
                        className="bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-wider px-6 py-2.5 rounded transition-all shadow-navy"
                      >
                        {changingPass ? "Changing..." : "Change Password"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADDRESS FORM MODAL */}
      {isAddressFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setIsAddressFormOpen(false)} className="fixed inset-0 bg-charcoal opacity-40" />
          
          {/* Modal content */}
          <div className="bg-ivory w-full max-w-md rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
              {editingAddress ? "Edit Address" : "Add Address"}
            </h3>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Full Name *</label>
                <input
                  type="text" required placeholder="Recipient name"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addrName} onChange={(e) => setAddrName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Phone Number *</label>
                <input
                  type="tel" required placeholder="10-digit mobile number"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Address Line 1 *</label>
                <input
                  type="text" required placeholder="House No, Building, Street"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Address Line 2</label>
                <input
                  type="text" placeholder="Apartment, Landmark, Area"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">City *</label>
                  <input
                    type="text" required placeholder="City"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">State *</label>
                  <input
                    type="text" required placeholder="State"
                    className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={addrState} onChange={(e) => setAddrState(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">Pincode *</label>
                <input
                  type="text" required placeholder="6-digit Pin"
                  className="w-full bg-transparent border border-charcoal/10 rounded p-2 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="addr-default" type="checkbox"
                  className="w-4 h-4 border-charcoal/15 text-blush focus:ring-blush rounded bg-transparent"
                  checked={addrDefault} onChange={(e) => setAddrDefault(e.target.checked)}
                />
                <label htmlFor="addr-default" className="text-xs text-charcoal-muted font-light">Set as default address</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal/5">
                <button
                  type="button" onClick={() => setIsAddressFormOpen(false)}
                  className="px-4 py-2 border border-charcoal/15 text-charcoal hover:bg-charcoal/5 rounded text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-ivory hover:bg-navy-light rounded text-xs font-semibold uppercase tracking-wider shadow-navy"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS TRACKING MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setViewingOrder(null)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal */}
          <div className="bg-ivory w-full max-w-2xl rounded-xl p-6 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-charcoal/5 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blush">Order Tracking</span>
                <h3 className="font-heading text-xl font-semibold text-charcoal mt-1">
                  ID: {viewingOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1 hover:bg-charcoal/5 rounded-full text-charcoal hover:text-blush transition-colors"
                aria-label="Close tracking"
              >
                <Trash2 className="w-5 h-5 hidden" /> {/* Dummy to keep layout */}
                <span className="font-bold text-xs uppercase tracking-wider border border-charcoal/20 px-3 py-1 rounded hover:bg-charcoal/5 cursor-pointer">Close</span>
              </button>
            </div>

            {/* Tracking Status Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Delivery Timeline</h4>
              
              <div className="grid grid-cols-5 text-center relative pt-4">
                {/* Horizontal line backdrop */}
                <div className="absolute top-[38px] left-[10%] right-[10%] h-0.5 bg-charcoal/10 z-0" />
                
                {[
                  { status: "pending", label: "Placed" },
                  { status: "confirmed", label: "Confirmed" },
                  { status: "packed", label: "Packed" },
                  { status: "shipped", label: "Shipped" },
                  { status: "delivered", label: "Delivered" },
                ].map((stepObj, idx) => {
                  const statuses = ["pending", "confirmed", "packed", "shipped", "delivered"];
                  const currentIdx = statuses.indexOf(viewingOrder.status);
                  const stepIdx = statuses.indexOf(stepObj.status);
                  const isCompleted = stepIdx <= currentIdx;
                  const isCurrent = stepIdx === currentIdx;

                  return (
                    <div key={stepObj.status} className="flex flex-col items-center space-y-2 relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? "bg-blush border-blush text-ivory"
                          : "bg-ivory border-charcoal/15 text-charcoal-subtle"
                      } ${isCurrent ? "ring-4 ring-blush/20" : ""}`}>
                        {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isCurrent ? "text-blush font-bold" : isCompleted ? "text-charcoal" : "text-charcoal-subtle"
                      }`}>
                        {stepObj.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Direct Atelier WhatsApp Tracking Trigger */}
              <div className="flex items-center justify-between p-3.5 bg-blush-subtle/30 border border-blush/20 rounded-xl text-xs">
                <span className="text-charcoal-muted">Need live updates from the Mangaluru Atelier?</span>
                <a
                  href={`https://wa.me/919876543210?text=Hi%20YUMI%20Atelier,%20I%20would%20like%20a%20live%20status%20update%20for%20my%20order%20${viewingOrder.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blush hover:bg-blush-dark text-ivory font-bold uppercase tracking-wider text-[10px] rounded transition-colors"
                >
                  WhatsApp Atelier
                </a>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 pt-4 border-t border-charcoal/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Purchased Creations</h4>
              <div className="space-y-4">
                {viewingOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs">
                    <div className="relative w-12 h-16 bg-charcoal/5 border border-charcoal/5 rounded overflow-hidden flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal text-sm">{item.productName}</p>
                      <p className="text-charcoal-muted uppercase text-[10px]">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-charcoal text-sm">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery details summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-charcoal/5 text-xs text-charcoal-muted leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[10px]">Shipping Address</h4>
                <p>{viewingOrder.shippingAddress.fullName}</p>
                <p>{viewingOrder.shippingAddress.addressLine1}, {viewingOrder.shippingAddress.addressLine2 ? viewingOrder.shippingAddress.addressLine2 + ", " : ""}{viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} - {viewingOrder.shippingAddress.pincode}</p>
                <p>Phone: {viewingOrder.shippingAddress.phone}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[10px]">Payment Summary</h4>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-charcoal uppercase">{viewingOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className="font-semibold text-charcoal uppercase">{viewingOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between border-t border-charcoal/5 pt-2 text-sm font-semibold text-charcoal">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(viewingOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
