"use client";

import React, { useState, useEffect } from "react";
import { getCollection, where } from "@/lib/firebase/firestore";
import { UserProfile, Order } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Users, Search, Eye, Loader2, Inbox, ShoppingBag, Mail, Phone, Calendar } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Customer Detail Inspection
  const [inspectingCustomer, setInspectingCustomer] = useState<UserProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const list = await getCollection<UserProfile>("users", []);
      // Sort newest first
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCustomers(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInspectCustomer = async (cust: UserProfile) => {
    setInspectingCustomer(cust);
    setLoadingOrders(true);
    try {
      const list = await getCollection<Order>("orders", [
        where("userId", "==", cust.uid),
      ]);
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCustomerOrders(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer order history.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredCustomers = customers.filter(
    (cust) =>
      cust.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Users Panel
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Customer Directory
          </h1>
        </div>
      </div>

      {/* Grid Layout: Customer List & Detail Inspector */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns: Customer directory table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="p-4 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft flex items-center mb-4">
              <div className="relative rounded-md shadow-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-subtle">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search by customer name, email, phone..."
                  className="block w-full pl-10 pr-3 py-2 border border-charcoal/10 rounded-md focus:outline-none focus:border-blush text-sm bg-transparent text-charcoal"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-ivory-light border border-charcoal/5 rounded-xl overflow-hidden shadow-soft text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-charcoal/5 border-b border-charcoal/10 text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                      <th className="p-4 pl-6">Customer</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 pr-6 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal/5 text-sm">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-charcoal/[0.02] transition-colors cursor-pointer" onClick={() => handleInspectCustomer(cust)}>
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="w-9 h-9 bg-blush-subtle/50 text-blush rounded-full flex items-center justify-center font-bold text-xs uppercase">
                            {cust.displayName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-charcoal block">{cust.displayName}</span>
                            <span className="text-[10px] text-charcoal-subtle block">{cust.email}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-charcoal-muted">{formatDate(cust.createdAt)}</td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectCustomer(cust);
                            }}
                            className="p-2 border border-charcoal/10 hover:border-navy text-navy rounded-full inline-flex items-center justify-center bg-transparent"
                            title="Inspect Profile"
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
          </div>

          {/* Right Column: Customer Details Inspector */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-6 text-left min-h-[300px]">
            {inspectingCustomer ? (
              <div className="space-y-6 animate-fade-in">
                {/* Profile header */}
                <div className="border-b border-charcoal/5 pb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blush-subtle/50 text-blush rounded-full flex items-center justify-center font-bold text-lg uppercase">
                      {inspectingCustomer.displayName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal leading-tight">{inspectingCustomer.displayName}</h3>
                      <p className="text-[10px] text-charcoal-subtle font-mono mt-0.5">UID: {inspectingCustomer.uid}</p>
                    </div>
                  </div>

                  <div className="text-xs text-charcoal-muted space-y-1.5 pt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blush" />
                      <span>{inspectingCustomer.email}</span>
                    </div>
                    {inspectingCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blush" />
                        <span>{inspectingCustomer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blush" />
                      <span>Member since: {formatDate(inspectingCustomer.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase history */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2">Purchase History ({customerOrders.length})</h4>
                  
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-blush" />
                    </div>
                  ) : customerOrders.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar text-xs">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="p-3 bg-ivory rounded border border-charcoal/5 flex justify-between items-center hover:border-charcoal/20 transition-all">
                          <div className="space-y-0.5 text-left">
                            <span className="font-semibold text-charcoal block">{order.orderNumber}</span>
                            <span className="text-[10px] text-charcoal-subtle block">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-charcoal block">{formatCurrency(order.total)}</span>
                            <span className="text-[9px] uppercase font-bold text-blush block">{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-charcoal-muted italic py-4">No order history recorded.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-charcoal-subtle space-y-3">
                <Users className="w-12 h-12" />
                <p className="text-sm text-charcoal-muted font-light">Select a customer profile to inspect details.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">No Registered Customers</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              When customers create accounts or checkout on your store, their directory profiles will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
