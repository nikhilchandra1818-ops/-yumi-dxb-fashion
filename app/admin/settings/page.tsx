"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/context/SettingsContext";
import { setDocument } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import { Loader2, Settings, Landmark, ShoppingBag, ShieldCheck, Mail, Phone, Clock } from "lucide-react";

export default function AdminSettingsPage() {
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);

  // Business Info
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Commerce Config
  const [currency, setCurrency] = useState("INR");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [shippingFee, setShippingFee] = useState("");
  const [freeShippingAbove, setFreeShippingAbove] = useState("");
  const [returnWindowDays, setReturnWindowDays] = useState("");
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState("");

  // Payment gateway plug
  const [paymentGateway, setPaymentGateway] = useState("");

  // Sync state with settings context
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || "");
      setTagline(settings.tagline || "");
      setPhone(settings.phone || "");
      setBusinessEmail(settings.businessEmail || "");
      setWhatsapp(settings.whatsapp || "");
      setInstagram(settings.instagram || "");
      setAddress(settings.address || "");
      setBusinessHours(settings.businessHours || "");
      setGstNumber(settings.gstNumber || "");
      setCurrency(settings.currency || "INR");
      setCurrencySymbol(settings.currencySymbol || "₹");
      setShippingFee(settings.shippingFee ? String(settings.shippingFee) : "0");
      setFreeShippingAbove(settings.freeShippingAbove ? String(settings.freeShippingAbove) : "");
      setReturnWindowDays(settings.returnWindowDays ? String(settings.returnWindowDays) : "7");
      setEstimatedDeliveryDays(settings.estimatedDeliveryDays || "5-7 business days");
      setPaymentGateway(settings.paymentGateway || "");
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedSettings = {
        ...settings,
        businessName,
        tagline,
        phone: phone.trim() || null,
        businessEmail: businessEmail.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        address: address.trim() || null,
        businessHours: businessHours.trim() || null,
        gstNumber: gstNumber.toUpperCase().trim() || null,
        currency,
        currencySymbol,
        shippingFee: parseFloat(shippingFee) || 0,
        freeShippingAbove: freeShippingAbove ? parseFloat(freeShippingAbove) : null,
        returnWindowDays: parseInt(returnWindowDays) || 7,
        estimatedDeliveryDays,
        paymentGateway: paymentGateway || null,
        updatedAt: Timestamp.now(),
      };

      await setDocument("settings", "global", updatedSettings);
      toast.success("Settings updated successfully!");
      await refreshSettings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings in database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="pb-4 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Global Settings
        </span>
        <h1 className="font-heading text-display-sm font-semibold text-charcoal">
          Website Configurations
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Business details */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
            <h3 className="font-heading text-lg font-semibold text-charcoal border-b border-charcoal/5 pb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blush" />
              <span>Contact & Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Business Name *</label>
                <input
                  type="text" required placeholder="YUMI DXB Fashion"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Tagline</label>
                <input
                  type="text" placeholder="Where Comfort Meets Elegance"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={tagline} onChange={(e) => setTagline(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Contact Phone</label>
                <input
                  type="tel" placeholder="+91 98765 43210"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Business Email</label>
                <input
                  type="email" placeholder="hello@yumidxb.com"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted font-body">WhatsApp Handle</label>
                <input
                  type="text" placeholder="+91 98765 43210"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Instagram Username</label>
                <input
                  type="text" placeholder="yumi_dxb"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={instagram} onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Physical Store Address</label>
              <input
                type="text" placeholder="Mangaluru, Karnataka, India"
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                value={address} onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Store Business Hours</label>
                <input
                  type="text" placeholder="10:00 AM - 8:00 PM"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={businessHours} onChange={(e) => setBusinessHours(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">GST Number</label>
                <input
                  type="text" placeholder="29AAAAA0000A1Z5"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal uppercase"
                  value={gstNumber} onChange={(e) => setGstNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Commerce specifications */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
            <h3 className="font-heading text-lg font-semibold text-charcoal border-b border-charcoal/5 pb-2 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blush" />
              <span>Shipping & Operations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Shipping Fee (₹)</label>
                <input
                  type="number" placeholder="100"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={shippingFee} onChange={(e) => setShippingFee(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Free Shipping Threshold (₹)</label>
                <input
                  type="number" placeholder="1500"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={freeShippingAbove} onChange={(e) => setFreeShippingAbove(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Return Window (Days)</label>
                <input
                  type="number" placeholder="7"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted font-body">Est. Delivery Text</label>
                <input
                  type="text" placeholder="5-7 business days"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={estimatedDeliveryDays} onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Payment gateways & Submit */}
        <div className="space-y-6">
          
          {/* Payment config */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal border-b border-charcoal/5 pb-2 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blush" />
              <span>Payment Gateways</span>
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted">gateway provider</label>
              <select
                value={paymentGateway} onChange={(e) => setPaymentGateway(e.target.value)}
                className="w-full bg-transparent border border-charcoal/10 rounded p-2.5 text-xs text-charcoal focus:outline-none"
              >
                <option value="">Cash on Delivery Only</option>
                <option value="razorpay">Razorpay Checkout</option>
                <option value="paytm">Paytm Merchant</option>
              </select>
            </div>
            
            <p className="text-[10px] text-charcoal-subtle leading-relaxed font-light">
              Selecting COD leaves online checkout disabled. Choosing Razorpay or Paytm activates secure card/UPI details in checkout once api keys are defined in Cloud environment parameters.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-ivory hover:bg-navy-light py-3 px-6 rounded-md font-semibold tracking-widest uppercase transition-colors text-center text-xs shadow-navy flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Save Configurations</span>
          </button>
        </div>
      </div>
    </form>
  );
}
