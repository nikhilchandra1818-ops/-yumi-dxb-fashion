"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, X, Mic, MicOff, Send, Sparkles, ShoppingBag, Truck, ShieldCheck, ChevronRight, Loader2, Volume2, VolumeX, PhoneCall } from "lucide-react";
import { getCollection, where } from "@/lib/firebase/firestore";
import { Product, Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
  actionLink?: { label: string; url: string };
}

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Welcome to YUMI DXB Fashion! I am your AI Store & Drape Assistant. Ask me anything about our Kaftans, Abayas, Co-ords, Order Tracking, Shipping, or Personal Styling!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Voice Output (Speech Synthesis)
  const speakText = (textToSpeak: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = textToSpeak.replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
    }
  };

  // Web Speech API Voice Recognition (Speech to Text)
  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        setTimeout(() => handleSendMessage(transcript), 300);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Intelligent Multi-Domain AI Response Engine
  const processUserQuery = async (queryText: string) => {
    setIsTyping(true);
    const rawText = queryText.trim();
    const text = rawText.toLowerCase();

    let replyText = "";
    let suggestedProducts: Product[] | undefined = undefined;
    let actionLink: { label: string; url: string } | undefined = undefined;

    try {
      // 1. Specific Order Tracking Query (e.g., YUMI-20260727-7591)
      const orderMatch = text.match(/yumi-\d+-\d+/i) || text.match(/yumi\d+/i);
      if (orderMatch || (text.includes("track") && (text.includes("order") || text.includes("number")))) {
        const orderNum = orderMatch ? orderMatch[0].toUpperCase() : null;

        if (orderNum) {
          const fetchedOrders = await getCollection<Order>("orders", [
            where("orderNumber", "==", orderNum),
          ]);

          if (fetchedOrders.length > 0) {
            const ord = fetchedOrders[0];
            replyText = `Order ${ord.orderNumber} status: **${ord.status.toUpperCase()}**. Payment status: **${ord.paymentStatus.toUpperCase()}** (${ord.paymentMethod === "online" ? "Razorpay Paid" : "COD"}). Total: ${formatCurrency(ord.total)}. Deliveries arrive in 5-7 business days.`;
            actionLink = { label: "Track Full Order in Account", url: "/account" };
          } else {
            replyText = `I couldn't find an active order for "${orderNum}". Please verify your Order Number or login to your Account page.`;
            actionLink = { label: "Go to Account Orders", url: "/account" };
          }
        } else {
          replyText = "To track your shipment, please type your Order Number (e.g. YUMI-20260727-7591) or visit your Customer Account page.";
          actionLink = { label: "My Account Orders", url: "/account" };
        }
      }
      // 2. Specific Price Filter Query ("cheapest", "under 1500", "under 2000", "price", "budget")
      else if (text.includes("cheap") || text.includes("under") || text.includes("below") || text.includes("budget") || text.includes("lowest price")) {
        const allProds = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);

        const priceMatches = text.match(/(\d+)/);
        const maxPrice = priceMatches ? parseInt(priceMatches[0]) : 2000;

        const filtered = allProds
          .filter((p) => (p.discountPrice ?? p.price) <= maxPrice)
          .sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));

        if (filtered.length > 0) {
          replyText = `Here are our best creations priced under ${formatCurrency(maxPrice)}:`;
          suggestedProducts = filtered.slice(0, 3);
          actionLink = { label: "View All Products", url: "/collections" };
        } else {
          replyText = `Our handcrafted comfort wear starts at budget-friendly prices. Browse our full product list:`;
          suggestedProducts = allProds.slice(0, 3);
          actionLink = { label: "Explore Products", url: "/collections" };
        }
      }
      // 3. Category & Apparel Query (Abayas, Kaftans, Co-ords, Nightwear, Floral)
      else if (
        text.includes("kaftan") ||
        text.includes("abaya") ||
        text.includes("co-ord") ||
        text.includes("coord") ||
        text.includes("nightwear") ||
        text.includes("floral") ||
        text.includes("robe") ||
        text.includes("dress") ||
        text.includes("silk") ||
        text.includes("satin") ||
        text.includes("cotton")
      ) {
        const allProds = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);

        const keywords = text.split(" ").filter((w) => w.length > 2);
        const matched = allProds.filter((p) => {
          const combined = `${p.name} ${p.categoryName} ${p.fabric} ${p.description}`.toLowerCase();
          return keywords.some((kw) => combined.includes(kw));
        });

        if (matched.length > 0) {
          replyText = `Here are top recommendations matching your search:`;
          suggestedProducts = matched.slice(0, 3);
          actionLink = { label: "Browse Collections", url: "/collections" };
        } else {
          replyText = "Check out our newest collection of handpicked Kaftans, Abayas, Co-ords, and Nightwear:";
          suggestedProducts = allProds.slice(0, 3);
          actionLink = { label: "Explore Products", url: "/collections" };
        }
      }
      // 4. Shipping, Delivery & International/Dubai Queries
      else if (text.includes("ship") || text.includes("deliver") || text.includes("dubai") || text.includes("uae") || text.includes("mangaluru") || text.includes("charge")) {
        replyText = "We offer fast **Pan-India shipping (5-7 business days)** from our Mangaluru atelier. Orders over ₹1,500 get **FREE delivery**! Standard shipping fee is ₹100 for smaller orders.";
        actionLink = { label: "Shipping Policy Details", url: "/policies/shipping-policy" };
      }
      // 5. Returns, Refunds & Cancellations
      else if (text.includes("return") || text.includes("refund") || text.includes("exchange") || text.includes("cancel")) {
        replyText = "We offer hassle-free **7-day returns & exchanges** for all unworn apparel with original tags. Once inspected, refunds are issued back to your account or payment method within 3-5 business days.";
        actionLink = { label: "Return & Refund Policy", url: "/policies/return-refund-policy" };
      }
      // 6. Payment Gateways & COD
      else if (text.includes("pay") || text.includes("cod") || text.includes("razorpay") || text.includes("card") || text.includes("upi") || text.includes("netbanking")) {
        replyText = "We support 100% secure **Razorpay Online Payments** (UPI, Google Pay, PhonePe, Credit/Debit Cards, NetBanking) as well as **Cash on Delivery (COD)** at your doorstep!";
        actionLink = { label: "Start Shopping", url: "/collections" };
      }
      // 7. Sizing & Custom Fitting / Style Assistant
      else if (text.includes("size") || text.includes("fit") || text.includes("chart") || text.includes("drape") || text.includes("quiz")) {
        replyText = "Unsure about your perfect fit? Use our interactive **Style & Drape Assistant** to answer 3 quick lifestyle questions for tailored silhouette recommendations!";
        actionLink = { label: "Try Style Assistant", url: "/drape-assistant" };
      }
      // 8. Gift Cards & Vouchers
      else if (text.includes("gift") || text.includes("voucher") || text.includes("card") || text.includes("present")) {
        replyText = "Give the gift of luxury comfort! We offer digital YUMI DXB Gift Vouchers in ₹1,000, ₹2,500, ₹5,000, and ₹10,000 denominations.";
        actionLink = { label: "Buy Gift Vouchers", url: "/gift-cards" };
      }
      // 9. Brand Story & Sister Founders
      else if (text.includes("about") || text.includes("owner") || text.includes("sister") || text.includes("story") || text.includes("who")) {
        replyText = "YUMI DXB Fashion was founded by two sisters and homemakers with a passion for crafting elegant, high-quality comfort wear. If a design isn't good enough for our own family, it never leaves our atelier!";
        actionLink = { label: "Read Our Story", url: "/about" };
      }
      // 10. Contact & WhatsApp Support
      else if (text.includes("contact") || text.includes("phone") || text.includes("whatsapp") || text.includes("number") || text.includes("email") || text.includes("help")) {
        replyText = "Our customer care team is available daily! You can WhatsApp our Atelier directly or email us at support@yumidxb.com.";
        actionLink = { label: "Contact Us Page", url: "/contact" };
      }
      // General Dynamic Assistance
      else {
        replyText = `I am happy to help you with anything regarding YUMI DXB Fashion! Ask me about specific products, size fitting, shipping status, returns, or payment options.`;
        actionLink = { label: "Explore Collections", url: "/collections" };
      }
    } catch (e) {
      replyText = "How can I assist you with your YUMI DXB Fashion shopping experience today?";
      actionLink = { label: "Browse Store", url: "/collections" };
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "bot",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedProducts,
          actionLink,
        },
      ]);
      setIsTyping(false);
      speakText(replyText);
    }, 400);
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    processUserQuery(textToSend);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-4 bg-navy hover:bg-navy-light text-ivory rounded-full shadow-navy transition-all duration-300 flex items-center justify-center group hover:scale-105 border border-white/20"
          aria-label="Open AI Customer Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <div className="relative flex items-center gap-2">
              <MessageSquare className="w-6 h-6 fill-current" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider pr-1">Atelier AI</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blush rounded-full ring-2 ring-ivory animate-ping" />
            </div>
          )}
        </button>
      </div>

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[390px] h-[540px] bg-ivory-light border border-charcoal/10 rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-navy text-ivory flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blush-subtle/20 rounded-full text-blush">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold">Atelier AI Assistant</h3>
                <p className="text-[10px] text-ivory-dark/70">Store &amp; Drape Expert | Voice Enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice Output Audio Toggle */}
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-1.5 rounded-full transition-colors ${
                  speechEnabled ? "bg-blush text-ivory" : "text-ivory-dark/60 hover:text-ivory"
                }`}
                title={speechEnabled ? "Voice Output ON" : "Voice Output OFF"}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-navy-light rounded-full text-ivory-dark hover:text-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2.5 bg-ivory border-b border-charcoal/5 flex gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold text-charcoal">
            <button
              onClick={() => handleSendMessage("Track my order YUMI")}
              className="px-3 py-1 bg-blush-subtle/50 text-blush rounded-full hover:bg-blush hover:text-ivory transition-colors whitespace-nowrap"
            >
              📦 Track Order
            </button>
            <button
              onClick={() => handleSendMessage("Show me Kaftans and Abayas")}
              className="px-3 py-1 bg-charcoal/5 rounded-full hover:bg-navy hover:text-ivory transition-colors whitespace-nowrap"
            >
              👗 Kaftans &amp; Abayas
            </button>
            <button
              onClick={() => handleSendMessage("Show me items under 2000")}
              className="px-3 py-1 bg-charcoal/5 rounded-full hover:bg-navy hover:text-ivory transition-colors whitespace-nowrap"
            >
              🏷️ Under ₹2,000
            </button>
            <button
              onClick={() => handleSendMessage("What is your shipping & return policy?")}
              className="px-3 py-1 bg-charcoal/5 rounded-full hover:bg-navy hover:text-ivory transition-colors whitespace-nowrap"
            >
              🚚 Shipping &amp; Returns
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-navy text-ivory rounded-br-none shadow-navy"
                      : "bg-ivory border border-charcoal/10 text-charcoal rounded-bl-none shadow-soft"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Dynamic Product Cards */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-charcoal/10">
                      {msg.suggestedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2 bg-ivory-light border border-charcoal/10 rounded-lg hover:border-blush transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-charcoal text-xs block truncate">{p.name}</span>
                            <span className="text-[10px] text-charcoal-muted uppercase">{p.categoryName} • {p.fabric}</span>
                          </div>
                          <span className="text-xs font-bold text-blush">{formatCurrency(p.discountPrice ?? p.price)}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Action Link Button */}
                  {msg.actionLink && (
                    <div className="mt-3 pt-2 border-t border-charcoal/10">
                      <Link
                        href={msg.actionLink.url}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 text-blush font-bold uppercase tracking-wider text-[10px] hover:underline"
                      >
                        <span>{msg.actionLink.label}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-charcoal-subtle mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-charcoal-muted text-xs p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blush" />
                <span>Atelier AI is processing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Voice & Text Input Form */}
          <div className="p-3 bg-ivory border-t border-charcoal/10 flex items-center gap-2">
            <button
              onClick={handleVoiceInput}
              className={`p-2.5 rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-charcoal/5 hover:bg-blush hover:text-white text-charcoal"
              }`}
              title={isListening ? "Listening... Speak now" : "Speak to Voice Assistant"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening... speak now" : "Ask about products, orders, returns..."}
              className="flex-1 bg-transparent border border-charcoal/10 rounded-full px-4 py-2 text-xs text-charcoal outline-none focus:border-blush placeholder-charcoal-subtle"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-navy hover:bg-navy-light text-ivory rounded-full disabled:opacity-40 transition-colors shadow-navy"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
