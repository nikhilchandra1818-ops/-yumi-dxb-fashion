"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useSettings } from "@/lib/context/SettingsContext";
import { formatCurrency, generateOrderNumber } from "@/lib/utils";
import { getCollection, where, runTransaction, doc, db, setDoc, addDoc } from "@/lib/firebase/firestore";
import { Address, Order, OrderItem, Product, CartItem } from "@/types";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { settings } = useSettings();

  // Step state: 1 = Shipping Info, 2 = Payment & Confirm, 3 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // Address Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [fetchingPin, setFetchingPin] = useState(false);
  const [pinDetectedLocation, setPinDetectedLocation] = useState("");

  const handlePincodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, "").slice(0, 6);
    setPincode(cleanPin);

    if (cleanPin.length === 6) {
      setFetchingPin(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await res.json();

        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const detectedCity = po.District || po.Block || po.Name;
          const detectedState = po.State;

          if (detectedCity) setCity(detectedCity);
          if (detectedState) setState(detectedState);
          setPinDetectedLocation(`${detectedCity}, ${detectedState}`);
          toast.success(`Auto-filled: ${detectedCity}, ${detectedState}`);
        } else {
          setPinDetectedLocation("");
        }
      } catch (err) {
        console.error("PIN code lookup error:", err);
      } finally {
        setFetchingPin(false);
      }
    } else {
      setPinDetectedLocation("");
    }
  };

  // Payment State (Default to Razorpay Online Payment)
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Fetch saved addresses if logged in
  useEffect(() => {
    const fetchAddresses = async () => {
      if (user) {
        try {
          const list = await getCollection<Address>("addresses", [
            where("userId", "==", user.uid),
          ]);
          setSavedAddresses(list);
          const defaultAddress = list.find((a) => a.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            fillAddressForm(defaultAddress);
          } else if (list.length > 0) {
            setSelectedAddressId(list[0].id);
            fillAddressForm(list[0]);
          }
        } catch (err) {
          console.error("Error loading saved addresses:", err);
        }
      }
    };
    fetchAddresses();
  }, [user]);

  // Sync user email on load
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const fillAddressForm = (addr: Address) => {
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
  };

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFullName("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setState("");
      setPincode("");
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) fillAddressForm(addr);
    }
  };

  const shippingFee =
    cartSubtotal >= (settings.freeShippingAbove ?? 1500) ? 0 : (settings.shippingFee ?? 100);
  const total = cartSubtotal + shippingFee;

  const validateAddress = () => {
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode || !email) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian phone number.");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      toast.error("Please enter a valid 6-digit PIN code.");
      return false;
    }

    return true;
  };

  const handleContinueToPayment = () => {
    if (validateAddress()) {
      setStep(2);
    }
  };

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Atomic order placement via Firestore Transaction (COD & Online Razorpay)
  const handlePlaceOrder = async () => {
    if (paymentMethod === "online") {
      setLoading(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load Razorpay SDK. Please check your connection.");
          setLoading(false);
          return;
        }

        // 1. Create Razorpay order on backend
        const createRes = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems,
            email,
            shippingAddress: { fullName, phone, addressLine1, addressLine2, city, state, pincode, country: "India" },
          }),
        });

        const createData = await createRes.json();
        if (!createData.success) {
          toast.error(createData.error || "Could not initiate payment.");
          setLoading(false);
          return;
        }

        // 2. Always Open Official Razorpay Checkout Modal
        const options = {
          key: createData.key,
          amount: createData.amount,
          currency: createData.currency,
          name: "YUMI DXB Fashion",
          description: `Order ${createData.orderNumber}`,
          order_id: createData.order_id,
          prefill: {
            name: fullName,
            email: email,
            contact: phone,
          },
          theme: {
            color: "#1B2A4A",
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderNumber: createData.orderNumber,
                  cartItems,
                  shippingAddress: { fullName, phone, addressLine1, addressLine2, city, state, pincode, country: "India" },
                  email,
                  userPhone: phone,
                  userName: fullName,
                  userId: user?.uid || "guest",
                  subtotal: cartSubtotal,
                  shippingFee,
                  total,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await clearCart();
                setCreatedOrderNumber(createData.orderNumber);
                setStep(3);
                toast.success("Payment verified! Order confirmed.");
              } else {
                toast.error(verifyData.error || "Payment verification failed.");
              }
            } catch (err) {
              console.error("Verification error:", err);
              toast.error("Failed to verify payment. Please contact support.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast.error("Payment cancelled. Cart preserved.");
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(`Payment Failed: ${response.error?.description || "Transaction declined"}`);
          setLoading(false);
        });
        rzp.open();
      } catch (err: any) {
        console.error("Online payment error:", err);
        toast.error("Error initiating online payment.");
        setLoading(false);
      }
      return;
    }

    // Cash on Delivery (COD) Flow
    setLoading(true);
    const orderNum = generateOrderNumber();

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Double check and decrement stock for all items
        const productSnaps = await Promise.all(
          cartItems.map(async (item) => {
            const productRef = doc(db, "products", item.productId);
            const snap = await transaction.get(productRef);
            if (!snap.exists()) {
              throw new Error(`Product ${item.productName} does not exist.`);
            }
            const data = snap.data() as Product;
            if (data.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.productName}. Only ${data.stock} units available.`);
            }
            return { ref: productRef, currentStock: data.stock, item };
          })
        );

        // 2. Decrement stock
        productSnaps.forEach(({ ref, currentStock, item }) => {
          transaction.update(ref, {
            stock: currentStock - item.quantity,
            updatedAt: Timestamp.now(),
          });
        });

        // 3. Create Order document in /orders
        const orderRef = doc(db, "orders", orderNum);
        const orderData: Omit<Order, "id"> = {
          orderNumber: orderNum,
          userId: user?.uid || "guest",
          userEmail: email.toLowerCase().trim(),
          userName: fullName,
          userPhone: phone,
          items: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            imageUrl: item.imageUrl,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            discountPrice: item.discountPrice,
            subtotal: (item.discountPrice ?? item.price) * item.quantity,
          })),
          shippingAddress: {
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            country: "India",
          },
          subtotal: cartSubtotal,
          shippingFee,
          discount: 0,
          total,
          status: "pending",
          statusHistory: [{ status: "pending", timestamp: Timestamp.now(), note: "COD Order placed successfully" }],
          paymentMethod: "cod",
          paymentStatus: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        transaction.set(orderRef, orderData);

        // 4. Log Inventory adjustment
        cartItems.forEach((item) => {
          const logRef = doc(db, "inventory_log", `${orderNum}-${item.productId}-${item.size}`);
          transaction.set(logRef, {
            productId: item.productId,
            productName: item.productName,
            previousStock: productSnaps.find((s) => s.item.productId === item.productId)?.currentStock || 0,
            newStock: (productSnaps.find((s) => s.item.productId === item.productId)?.currentStock || 0) - item.quantity,
            change: -item.quantity,
            reason: "order_placed",
            referenceId: orderNum,
            createdAt: Timestamp.now(),
          });
        });

        // 5. Add notification for admin
        const notifRef = doc(db, "notifications", `new_order_${orderNum}`);
        transaction.set(notifRef, {
          type: "new_order",
          title: "New Order Placed (COD)",
          body: `Order ${orderNum} for ${formatCurrency(total)} placed by ${fullName}`,
          link: `/admin/orders`,
          isRead: false,
          createdAt: Timestamp.now(),
        });
      });

      // 6. Success: Send Email & Clear Cart
      fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_confirmation",
          recipientEmail: email,
          recipientName: fullName,
          orderNumber: orderNum,
          items: cartItems,
          subtotal: cartSubtotal,
          shippingFee,
          total,
          shippingAddress: { fullName, phone, addressLine1, addressLine2, city, state, pincode, country: "India" },
          paymentMethod: "cod",
          paymentStatus: "pending",
        }),
      }).catch((e) => console.warn("Async email send warning:", e));

      await clearCart();
      setCreatedOrderNumber(orderNum);
      setStep(3);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      console.error("Order transaction error:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-charcoal-subtle mx-auto" />
        <h1 className="font-heading text-2xl font-bold">Your Checkout is empty</h1>
        <Link href="/collections" className="inline-block px-6 py-2 bg-navy text-ivory text-xs uppercase tracking-wider rounded">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Step Indicators */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-4 pb-8 border-b border-charcoal/5 mb-8 text-xs font-semibold uppercase tracking-wider">
          <span className={`${step === 1 ? "text-blush" : "text-charcoal-muted"}`}>1. Shipping Info</span>
          <span className="text-charcoal-subtle">/</span>
          <span className={`${step === 2 ? "text-blush" : "text-charcoal-muted"}`}>2. Payment & Confirm</span>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start animate-fade-in">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-8 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold text-charcoal">Shipping Address</h2>
              <Link href="/cart" className="flex items-center gap-1 text-xs text-blush font-semibold hover:text-blush-dark transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Cart</span>
              </Link>
            </div>

            {/* Saved Addresses for Logged-In Users */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Choose Saved Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => handleAddressSelect(addr.id)}
                      className={`text-left p-4 border rounded-xl relative transition-all duration-300 ${
                        selectedAddressId === addr.id
                          ? "border-blush bg-blush-subtle/10"
                          : "border-charcoal/10 hover:border-charcoal/30 bg-transparent"
                      }`}
                    >
                      <p className="text-sm font-semibold text-charcoal">{addr.fullName}</p>
                      <p className="text-xs text-charcoal-muted mt-1 truncate">{addr.addressLine1}</p>
                      <p className="text-xs text-charcoal-muted">{addr.city}, {addr.state} - {addr.pincode}</p>
                      {selectedAddressId === addr.id && (
                        <span className="absolute top-3 right-3 p-0.5 bg-blush rounded-full text-ivory">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => handleAddressSelect("new")}
                    className={`text-center p-4 border rounded-xl flex flex-col items-center justify-center border-dashed font-semibold text-xs transition-colors ${
                      selectedAddressId === "new" ? "border-blush text-blush bg-blush-subtle/10" : "border-charcoal/20 text-charcoal-muted hover:border-charcoal/40"
                    }`}
                  >
                    <span>+ Use New Address</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Primary Pincode with Auto-Detect */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">PIN Code (Auto-Detect) *</label>
                    {fetchingPin && <Loader2 className="w-3.5 h-3.5 animate-spin text-blush" />}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit PIN code (e.g. 575001)"
                    className="w-full bg-ivory border border-charcoal/20 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal font-semibold"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                  />
                  {pinDetectedLocation && (
                    <p className="text-[11px] text-green-700 font-bold flex items-center gap-1 pt-1">
                      <span>✓ Auto-detected: {pinDetectedLocation}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Auto-filled City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blush-subtle/20 p-4 rounded-xl border border-blush/20">
                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">City / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    className="w-full bg-ivory border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal font-semibold"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    className="w-full bg-ivory border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal font-semibold"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              {/* Address Line 1 */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Address Line 1 (House No, Street, Building) *</label>
                <input
                  type="text"
                  required
                  placeholder="House No, Building Name, Street Name"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Address Line 2 (Optional Landmark / Apartment)</label>
                <input
                  type="text"
                  placeholder="Apartment, Suite, Unit, Landmark"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-charcoal/5">
              <button
                onClick={handleContinueToPayment}
                className="w-full bg-navy text-ivory hover:bg-navy-light py-3 px-6 rounded-md font-semibold tracking-widest uppercase transition-colors text-center text-xs shadow-navy"
              >
                Continue to Payment
              </button>
            </div>
          </div>

          {/* Right Column: Mini Cart Summary */}
          <div className="space-y-6 bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft">
            <h3 className="font-heading text-lg font-semibold text-charcoal border-b border-charcoal/5 pb-3">Order Summary</h3>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 text-xs items-center">
                  <div className="relative w-12 h-15 bg-charcoal/5 border border-charcoal/5 rounded overflow-hidden flex-shrink-0">
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal truncate">{item.productName}</p>
                    <p className="text-[10px] text-charcoal-muted uppercase">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-charcoal">
                    {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-charcoal/5 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-charcoal-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-charcoal border-t border-charcoal/5 pt-3">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start animate-fade-in">
          {/* Payment Panel */}
          <div className="lg:col-span-2 space-y-8 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold text-charcoal">Select Payment Method</h2>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-blush font-semibold hover:text-blush-dark transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Shipping</span>
              </button>
            </div>

            {/* Payment options */}
            <div className="space-y-4 pt-2">
              {/* Cash on Delivery (COD) */}
              <button
                onClick={() => setPaymentMethod("cod")}
                className={`w-full flex items-center justify-between p-5 border rounded-xl text-left transition-all ${
                  paymentMethod === "cod" ? "border-blush bg-blush-subtle/10" : "border-charcoal/10 hover:border-charcoal/30"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-charcoal-muted mt-0.5">Pay in cash or UPI upon delivery at your doorstep.</p>
                  </div>
                </div>
                {paymentMethod === "cod" && (
                  <span className="p-0.5 bg-blush rounded-full text-ivory">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              {/* Online Payment (Razorpay: UPI, Credit/Debit Cards, NetBanking) */}
              <button
                onClick={() => setPaymentMethod("online")}
                className={`w-full flex items-center justify-between p-5 border rounded-xl text-left transition-all ${
                  paymentMethod === "online" ? "border-blush bg-blush-subtle/10" : "border-charcoal/10 hover:border-charcoal/30"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">Online Payment (UPI, Cards, NetBanking, Wallets)</h4>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Fast &amp; 100% secure instant checkout powered by Razorpay.
                    </p>
                  </div>
                </div>
                {paymentMethod === "online" && (
                  <span className="p-0.5 bg-blush rounded-full text-ivory">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            </div>

            {/* Delivery address preview */}
            <div className="p-5 bg-ivory rounded-xl border border-charcoal/5 space-y-2 text-xs">
              <h4 className="font-semibold text-charcoal">Delivery Address Preview</h4>
              <p className="text-charcoal-muted">{fullName} | {phone}</p>
              <p className="text-charcoal-muted">{addressLine1}, {addressLine2 ? addressLine2 + ", " : ""}{city}, {state} - {pincode}</p>
            </div>

            <div className="pt-4 border-t border-charcoal/5">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-navy text-ivory hover:bg-navy-light py-3.5 px-6 rounded-md font-semibold tracking-widest uppercase transition-colors text-center text-xs shadow-navy flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{paymentMethod === "online" ? `Pay Now with Razorpay \u2013 ${formatCurrency(total)}` : `Place Order (COD) \u2013 ${formatCurrency(total)}`}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Mini Cart Summary */}
          <div className="space-y-6 bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft">
            <h3 className="font-heading text-lg font-semibold text-charcoal border-b border-charcoal/5 pb-3">Your Order</h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between text-xs text-charcoal-muted">
                  <span>{item.productName} (x{item.quantity})</span>
                  <span>{formatCurrency((item.discountPrice ?? item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-charcoal/5 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-charcoal-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-charcoal border-t border-charcoal/5 pt-3">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md mx-auto text-center py-20 bg-ivory-light border border-charcoal/5 rounded-2xl shadow-elevated p-8 space-y-6 animate-fade-up">
          <div className="w-16 h-16 bg-blush-subtle/50 rounded-full flex items-center justify-center mx-auto text-blush">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-charcoal">Thank You!</h1>
            <p className="text-sm text-charcoal-muted font-light leading-relaxed">
              Your order has been placed successfully. We are preparing your hand-selected creations with care.
            </p>
          </div>

          <div className="p-4 bg-ivory rounded-xl border border-charcoal/5 text-xs text-charcoal-muted space-y-1">
            <p>Order Number: <strong className="text-charcoal font-semibold">{createdOrderNumber}</strong></p>
            <p>Recipient: {fullName}</p>
            <p>Estimated Delivery: {settings.estimatedDeliveryDays}</p>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/account"
              className="w-full py-3 bg-navy text-ivory hover:bg-navy-light text-xs font-semibold uppercase tracking-widest rounded shadow-navy transition-colors"
            >
              Track Order In My Account
            </Link>
            <Link
              href="/"
              className="w-full py-3 bg-transparent border border-charcoal/20 text-charcoal hover:bg-charcoal/5 text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
