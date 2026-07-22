"use client";

import React, { useState, useEffect } from "react";
import { getCollection } from "@/lib/firebase/firestore";
import { Order, Product, UserProfile, Category, ContactMessage, NewsletterSubscriber } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  FolderOpen,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordList, prodList, userList, catList, msgList, subList] = await Promise.all([
          getCollection<Order>("orders"),
          getCollection<Product>("products"),
          getCollection<UserProfile>("users"),
          getCollection<Category>("categories"),
          getCollection<ContactMessage>("contactMessages"),
          getCollection<NewsletterSubscriber>("newsletterSubscribers"),
        ]);

        setOrders(ordList);
        setProducts(prodList);
        setUsers(userList);
        setCategories(catList);
        setMessages(msgList);
        setSubscribers(subList);
      } catch (err) {
        console.error("Error fetching dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-charcoal/10 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-charcoal/5 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-charcoal/5 rounded-xl" />
      </div>
    );
  }

  // ─── Metrics Calculations ─────────────────────────────────────────────────

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed" || o.status === "packed").length;
  const shippedOrders = orders.filter((o) => o.status === "shipped").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "returned" && o.status !== "refunded")
    .reduce((acc, o) => acc + o.total, 0);

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outOfStockProducts = products.filter((p) => p.stock <= 0).length;

  // ─── Chart Data Preparation ─────────────────────────────────────────────

  // 1. Revenue over time (grouped by date)
  const getRevenueData = () => {
    const revMap: Record<string, number> = {};
    orders
      .filter((o) => o.status !== "cancelled")
      .slice(-10) // last 10 orders for demonstration
      .forEach((o) => {
        const dateStr = o.createdAt ? new Date((o.createdAt as any).seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today";
        revMap[dateStr] = (revMap[dateStr] || 0) + o.total;
      });

    return Object.keys(revMap).map((date) => ({
      date,
      revenue: revMap[date],
    }));
  };

  const revenueData = getRevenueData().length > 0 ? getRevenueData() : [
    { date: "Day 1", revenue: 0 },
    { date: "Day 2", revenue: 0 },
  ];

  // 2. Category Performance Data
  const getCategoryData = () => {
    const catMap: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        // Query product details from product list to map categoryName
        const prod = products.find((p) => p.id === item.productId);
        const catName = prod?.categoryName || "Uncategorized";
        catMap[catName] = (catMap[catName] || 0) + item.quantity;
      });
    });

    return Object.keys(catMap).map((name) => ({
      name,
      value: catMap[name],
    }));
  };

  const categoryData = getCategoryData().length > 0 ? getCategoryData() : [
    { name: "No Categories Yet", value: 1 },
  ];

  const colors = ["#C97B7B", "#1F2A44", "#DDD0BE", "#6B6B6B"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            YUMI DXB
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Operational Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-blush hover:bg-blush-dark text-ivory text-xs font-semibold uppercase tracking-wider rounded-md transition-colors shadow-soft"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-charcoal-muted font-light uppercase tracking-wider">Total Sales</span>
            <p className="text-2xl font-bold text-charcoal">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-4 bg-blush-subtle/50 rounded-full text-blush">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-charcoal-muted font-light uppercase tracking-wider">All Orders</span>
            <p className="text-2xl font-bold text-charcoal">{totalOrders}</p>
          </div>
          <div className="p-4 bg-blush-subtle/50 rounded-full text-navy">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-charcoal-muted font-light uppercase tracking-wider">Pending Orders</span>
            <p className="text-2xl font-bold text-charcoal">{pendingOrders}</p>
          </div>
          <div className="p-4 bg-yellow-100 rounded-full text-yellow-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-charcoal-muted font-light uppercase tracking-wider">Out of Stock</span>
            <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
            {lowStockProducts > 0 && (
              <span className="text-[10px] text-yellow-600 flex items-center gap-1 font-medium mt-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{lowStockProducts} products low stock</span>
              </span>
            )}
          </div>
          <div className={`p-4 rounded-full ${outOfStockProducts > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="font-heading text-lg font-semibold text-charcoal flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blush" />
            <span>Sales Revenue History</span>
          </h3>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C97B7B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C97B7B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,26,26,0.05)" />
                <XAxis dataKey="date" tickLine={false} style={{ fontSize: "11px", fontFamily: "var(--font-inter)" }} />
                <YAxis tickLine={false} style={{ fontSize: "11px", fontFamily: "var(--font-inter)" }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#C97B7B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Chart */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <h3 className="font-heading text-lg font-semibold text-charcoal flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blush" />
            <span>Category Popularity</span>
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-charcoal-muted">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span>{cat.name} ({cat.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="font-heading text-lg font-semibold text-charcoal flex items-center justify-between">
            <span>Recent Orders</span>
            <Link href="/admin/orders" className="text-xs text-blush font-semibold uppercase tracking-wider hover:text-blush-dark transition-colors">
              View All
            </Link>
          </h3>

          {orders.length > 0 ? (
            <div className="divide-y divide-charcoal/5">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="space-y-0.5 text-left">
                    <p className="text-sm font-semibold text-charcoal">{order.orderNumber}</p>
                    <p className="text-[10px] text-charcoal-muted">{order.userName} | {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-charcoal">{formatCurrency(order.total)}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-navy text-ivory tracking-wider">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-charcoal-muted text-sm font-light">
              No orders placed yet.
            </div>
          )}
        </div>

        {/* Business details overview */}
        <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-6">
          <h3 className="font-heading text-lg font-semibold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blush" />
            <span>Platform Overview</span>
          </h3>

          <div className="space-y-4 text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
              <span>Total Customers</span>
              <span className="text-charcoal font-bold text-sm">{users.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
              <span>Total Catalog Creations</span>
              <span className="text-charcoal font-bold text-sm">{products.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-charcoal/5">
              <span>Subscribers</span>
              <span className="text-charcoal font-bold text-sm">{subscribers.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Unread Messages</span>
              <span className="text-charcoal font-bold text-sm">{messages.filter((m) => m.status === "unread").length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
