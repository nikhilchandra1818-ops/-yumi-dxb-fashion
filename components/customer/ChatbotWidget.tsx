"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare, X, Mic, MicOff, Send, Sparkles, ShoppingBag, Truck, ShieldCheck, ChevronRight, Loader2, RefreshCw } from "lucide-react";
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! Welcome to YUMI DXB Fashion. How can I assist you today? You can ask me to track your order, find products, or check store policies.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Web Speech API Voice Recognition
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
        // Automatically send voice query after short pause
        setTimeout(() => handleSendMessage(transcript), 400);
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

  // Bot Logic Engine
  const processUserQuery = async (queryText: string) => {
    setIsTyping(true);
    const text = queryText.toLowerCase().trim();

    let replyText = "";
    let suggestedProducts: Product[] | undefined = undefined;
    let actionLink: { label: string; url: string } | undefined = undefined;

    // 1. Order Tracking Query (e.g. YUMI-20260727-1234)
    const orderMatch = text.match(/yumi-\d+-\d+/i) || text.match(/order\s*#?\s*([a-z0-9-]+)/i);
    if (orderMatch || text.includes("track") || text.includes("where is my order")) {
      const orderNum = orderMatch ? orderMatch[0].toUpperCase() : null;

      if (orderNum) {
        try {
          const fetchedOrders = await getCollection<Order>("orders", [
            where("orderNumber", "==", orderNum),
          ]);

          if (fetchedOrders.length > 0) {
            const ord = fetchedOrders[0];
            replyText = `Order ${ord.orderNumber} is currently **${ord.status.toUpperCase()}**. Payment status: **${ord.paymentStatus.toUpperCase()}**. Total: ${formatCurrency(ord.total)}.`;
            actionLink = { label: "View Order In Account", url: "/account" };
          } else {
            replyText = `I couldn't find an order matching "${orderNum}". Please verify your Order Number or check your Account page.`;
            actionLink = { label: "Check Account Orders", url: "/account" };
          }
        } catch (e) {
          replyText = "Please login to your account to view live order tracking status.";
          actionLink = { label: "Login To Account", url: "/login" };
        }
      } else {
        replyText = "To track your order, please type your Order Number (e.g., YUMI-20260727-7591) or visit your Account page.";
        actionLink = { label: "Go to Account Orders", url: "/account" };
      }
    }
    // 2. Product Search Queries
    else if (text.includes("kaftan") || text.includes("abaya") || text.includes("co-ord") || text.includes("coord") || text.includes("nightwear") || text.includes("floral") || text.includes("dress") || text.includes("show")) {
      try {
        const allProds = await getCollection<Product>("products", [
          where("isActive", "==", true),
          where("isArchived", "==", false),
        ]);

        const keywords = text.split(" ");
        const matches = allProds.filter((p) => {
          const combined = `${p.name} ${p.categoryName} ${p.fabric} ${p.description}`.toLowerCase();
          return keywords.some((kw) => kw.length > 2 && combined.includes(kw));
        });

        if (matches.length > 0) {
          replyText = `Here are some handpicked creations matching your request:`;
          suggestedProducts = matches.slice(0, 3);
          actionLink = { label: "Browse All Collections", url: "/collections" };
        } else {
          replyText = "I found our latest collection of luxury Kaftans, Abayas, and Co-ords for you!";
          suggestedProducts = allProds.slice(0, 3);
          actionLink = { label: "Explore Products", url: "/collections" };
        }
      } catch (e) {
        replyText = "Explore our full collection of Kaftans, Abayas, Co-ords, and Nightwear!";
        actionLink = { label: "View Collections", url: "/collections" };
      }
    }
    // 3. Shipping & Delivery
    else if (text.includes("shipping") || text.includes("delivery") || text.includes("how long") || text.includes("days")) {
      replyText = "We offer Pan-India delivery within 5-7 business days from our Mangaluru atelier. Orders over ₹1,500 qualify for FREE shipping!";
      actionLink = { label: "Read Shipping Policy", url: "/policies/shipping-policy" };
    }
    // 4. Returns & Refunds
    else if (text.includes("return") || text.includes("refund") || text.includes("exchange")) {
      replyText = "We accept easy returns & exchanges within 7 days of delivery for unworn, tagged apparel items.";
      actionLink = { label: "Return Policy Details", url: "/policies/return-refund-policy" };
    }
    // 5. Payment Methods
    else if (text.includes("payment") || text.includes("razorpay") || text.includes("cod") || text.includes("cash")) {
      replyText = "We accept 100% secure Online Payment (Razorpay: UPI, Credit/Debit Cards, NetBanking, Wallets) as well as Cash on Delivery (COD)!";
    }
    // Default Greeting / Help
    else {
      replyText = "I'm your Atelier Assistant! You can ask me about product recommendations, track an order, or inquire about shipping and returns.";
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
    }, 500);
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
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] bg-ivory-light border border-charcoal/10 rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-navy text-ivory flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blush-subtle/20 rounded-full text-blush">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold">Atelier Assistant</h3>
                <p className="text-[10px] text-ivory-dark/70">Online | AI Voice &amp; Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-navy-light rounded-full text-ivory-dark hover:text-ivory transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="p-2.5 bg-ivory border-b border-charcoal/5 flex gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold text-charcoal">
            <button
              onClick={() => handleSendMessage("Track my order")}
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
              onClick={() => handleSendMessage("What is your shipping policy?")}
              className="px-3 py-1 bg-charcoal/5 rounded-full hover:bg-navy hover:text-ivory transition-colors whitespace-nowrap"
            >
              🚚 Shipping Info
            </button>
          </div>

          {/* Messages Scroll Area */}
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
                  <p>{msg.text}</p>

                  {/* Suggested Products Cards */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-charcoal/10">
                      {msg.suggestedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2 bg-ivory-light border border-charcoal/5 rounded-lg hover:border-blush transition-all"
                        >
                          <span className="font-semibold text-charcoal truncate">{p.name}</span>
                          <span className="text-blush font-bold ml-auto">{formatCurrency(p.discountPrice ?? p.price)}</span>
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
                        <ChevronRight className="w-3 h-3" />
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
                <span>Atelier Assistant is typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Voice & Text Input Form */}
          <div className="p-3 bg-ivory border-t border-charcoal/10 flex items-center gap-2">
            {/* Voice Mic Button */}
            <button
              onClick={handleVoiceInput}
              className={`p-2.5 rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-charcoal/5 hover:bg-blush hover:text-white text-charcoal"
              }`}
              title={isListening ? "Listening... Speak now" : "Speak to search"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening to your voice..." : "Type or speak message..."}
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
