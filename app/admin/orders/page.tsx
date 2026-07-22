"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument } from "@/lib/firebase/firestore";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Printer,
  ChevronDown,
  Loader2,
  Inbox,
  User,
  MapPin,
  CreditCard,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");

  // Detailed view modal
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await getCollection<Order>("orders", []);
      // Sort newest first
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const updatedHistory = [
        ...order.statusHistory,
        {
          status: newStatus,
          timestamp: Timestamp.now(),
          note: `Status updated to ${ORDER_STATUS_LABELS[newStatus]} by administrator`,
        },
      ];

      // If status is delivered, mark paymentStatus as paid if COD
      let newPaymentStatus = order.paymentStatus;
      if (newStatus === "delivered" && order.paymentMethod === "cod") {
        newPaymentStatus = "paid";
      }

      await setDocument("orders", orderId, {
        status: newStatus,
        statusHistory: updatedHistory,
        paymentStatus: newPaymentStatus,
        updatedAt: Timestamp.now(),
      }, true);

      toast.success(`Order status updated to ${ORDER_STATUS_LABELS[newStatus]}!`);
      
      // Update inspecting modal reference
      if (inspectingOrder && inspectingOrder.id === orderId) {
        setInspectingOrder({
          ...inspectingOrder,
          status: newStatus,
          statusHistory: updatedHistory,
          paymentStatus: newPaymentStatus,
        });
      }

      await fetchOrders();
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newPayStatus: "pending" | "paid" | "failed" | "refunded") => {
    try {
      await setDocument("orders", orderId, {
        paymentStatus: newPayStatus,
        updatedAt: Timestamp.now(),
      }, true);

      toast.success(`Payment status updated to ${newPayStatus.toUpperCase()}!`);
      
      if (inspectingOrder && inspectingOrder.id === orderId) {
        setInspectingOrder({
          ...inspectingOrder,
          paymentStatus: newPayStatus,
        });
      }

      await fetchOrders();
    } catch (err) {
      toast.error("Failed to update payment status.");
    }
  };

  // ─── Filter Logic ─────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const queryMatch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.userName.toLowerCase().includes(q) ||
      o.userEmail.toLowerCase().includes(q) ||
      o.userPhone.includes(q);

    const statusMatch = selectedStatus === "all" || o.status === selectedStatus;
    const payMatch = selectedPaymentStatus === "all" || o.paymentStatus === selectedPaymentStatus;

    return queryMatch && statusMatch && payMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Sales Console
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Order Management
          </h1>
        </div>
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
            placeholder="Search by Order ID, name, email, phone..."
            className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Order Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-transparent border border-charcoal/10 rounded-md p-2 text-sm text-charcoal focus:outline-none focus:border-blush"
        >
          <option value="all">All Order Statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {/* Payment Status */}
        <select
          value={selectedPaymentStatus}
          onChange={(e) => setSelectedPaymentStatus(e.target.value)}
          className="bg-transparent border border-charcoal/10 rounded-md p-2 text-sm text-charcoal focus:outline-none focus:border-blush"
        >
          <option value="all">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Date Placed</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5 text-sm">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-charcoal/[0.02] transition-colors">
                    {/* Order ID */}
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-blush">{order.orderNumber}</td>
                    {/* Customer */}
                    <td className="p-4 text-left">
                      <span className="font-semibold text-charcoal block">{order.userName}</span>
                      <span className="text-[10px] text-charcoal-subtle block">{order.userEmail} | {order.userPhone}</span>
                    </td>
                    {/* Date */}
                    <td className="p-4 text-xs font-medium text-charcoal-muted">{formatDate(order.createdAt)}</td>
                    {/* Total */}
                    <td className="p-4 font-semibold text-charcoal">{formatCurrency(order.total)}</td>
                    {/* Payment */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ORDER_STATUS_COLORS[order.status] || "bg-charcoal/5"
                      }`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => setInspectingOrder(order)}
                        className="p-2 border border-charcoal/10 hover:border-navy text-navy rounded-full inline-flex items-center justify-center bg-transparent"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
            <h3 className="font-heading text-xl font-medium text-charcoal">No Orders Placed</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              We couldn&rsquo;t find any customer orders in the system matching your filter query.
            </p>
          </div>
        </div>
      )}

      {/* INSPECT ORDER DETAILS MODAL */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setInspectingOrder(null)} className="fixed inset-0 bg-charcoal opacity-40" />

          {/* Modal Content */}
          <div className="bg-ivory w-full max-w-3xl rounded-xl p-8 relative shadow-elevated z-10 border border-charcoal/5 max-h-[90vh] overflow-y-auto space-y-8 text-left">
            <div className="flex items-center justify-between border-b border-charcoal/5 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blush">Order Inspection</span>
                <h3 className="font-heading text-2xl font-bold text-charcoal mt-1">ID: {inspectingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 border border-charcoal/20 rounded hover:bg-charcoal/5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

            {/* Quick Actions (Update Status) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-ivory-dark/40 rounded-xl p-5 border border-charcoal/5 items-center">
              {/* Order Status selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block">Change Order Status</span>
                <div className="relative">
                  <select
                    value={inspectingOrder.status}
                    onChange={(e) => handleUpdateStatus(inspectingOrder.id, e.target.value as OrderStatus)}
                    disabled={updatingStatus}
                    className="w-full bg-transparent border border-charcoal/10 rounded-md p-2.5 text-sm text-charcoal focus:outline-none focus:border-blush font-semibold uppercase tracking-wider"
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Status selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block">Change Payment Status</span>
                <select
                  value={inspectingOrder.paymentStatus}
                  onChange={(e) => handleUpdatePaymentStatus(inspectingOrder.id, e.target.value as any)}
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-2.5 text-sm text-charcoal focus:outline-none focus:border-blush font-semibold uppercase tracking-wider"
                >
                  <option value="pending">PENDING</option>
                  <option value="paid">PAID</option>
                  <option value="failed">FAILED</option>
                  <option value="refunded">REFUNDED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1 & 2: Items Purchased */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2">Apparel Items</h4>
                <div className="space-y-4">
                  {inspectingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs">
                      <div className="relative w-12 h-16 bg-charcoal/5 border border-charcoal/5 rounded overflow-hidden flex-shrink-0">
                        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-sm truncate">{item.productName}</p>
                        <p className="text-charcoal-muted uppercase text-[10px] mt-0.5">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-charcoal text-sm block">{formatCurrency(item.subtotal)}</span>
                        <span className="text-[10px] text-charcoal-subtle block font-light">Unit: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Status Timeline history */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2">Status Timeline</h4>
                <div className="relative border-l border-charcoal/10 ml-2 pl-4 space-y-4 text-xs font-light text-charcoal-muted">
                  {inspectingOrder.statusHistory.map((h, idx) => (
                    <div key={idx} className="relative">
                      {/* Circle indicator */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-blush rounded-full ring-4 ring-ivory" />
                      <p className="font-semibold text-charcoal uppercase tracking-wider text-[9px]">
                        {ORDER_STATUS_LABELS[h.status]}
                      </p>
                      <p className="text-[10px] text-charcoal-subtle">{formatDate(h.timestamp)}</p>
                      {h.note && <p className="mt-0.5 italic">{h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details & Shipping address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-charcoal/5 pt-6 text-xs text-charcoal-muted leading-relaxed">
              {/* Shipping Address */}
              <div className="space-y-2">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blush" />
                  <span>Delivery Address</span>
                </h4>
                <div className="pl-4.5 space-y-0.5">
                  <p className="font-semibold text-charcoal">{inspectingOrder.shippingAddress.fullName}</p>
                  <p>{inspectingOrder.shippingAddress.addressLine1}</p>
                  {inspectingOrder.shippingAddress.addressLine2 && <p>{inspectingOrder.shippingAddress.addressLine2}</p>}
                  <p>{inspectingOrder.shippingAddress.city}, {inspectingOrder.shippingAddress.state} - {inspectingOrder.shippingAddress.pincode}</p>
                  <p>Country: India</p>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-2">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blush" />
                  <span>Customer Contact</span>
                </h4>
                <div className="pl-4.5 space-y-0.5">
                  <p className="font-semibold text-charcoal">{inspectingOrder.userName}</p>
                  <p>Email: {inspectingOrder.userEmail}</p>
                  <p>Phone: {inspectingOrder.userPhone}</p>
                  <p className="font-mono text-[9px] mt-1 text-charcoal-subtle">ID: {inspectingOrder.userId}</p>
                </div>
              </div>

              {/* Payment details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-charcoal uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blush" />
                  <span>Payment Details</span>
                </h4>
                <div className="pl-4.5 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-charcoal uppercase">{inspectingOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-semibold text-charcoal uppercase">{inspectingOrder.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between border-t border-charcoal/5 pt-2 text-sm font-bold text-charcoal">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(inspectingOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
