"use client";

import React, { useState, useEffect } from "react";
import { getCollection, setDocument, deleteDocument } from "@/lib/firebase/firestore";
import { ContactMessage } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Mail, Check, Archive, Trash2, Eye, Inbox, Loader2 } from "lucide-react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const list = await getCollection<ContactMessage>("contactMessages", []);
      // Sort newest first
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMessages(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (msg: ContactMessage) => {
    try {
      await setDocument("contactMessages", msg.id, { status: "read" }, true);
      toast.success("Message marked as read.");
      
      if (viewingMessage && viewingMessage.id === msg.id) {
        setViewingMessage({ ...viewingMessage, status: "read" });
      }

      await fetchMessages();
    } catch (err) {
      toast.error("Failed to update message status.");
    }
  };

  const handleArchive = async (msg: ContactMessage) => {
    try {
      await setDocument("contactMessages", msg.id, { status: "archived" }, true);
      toast.success("Message archived.");
      
      if (viewingMessage && viewingMessage.id === msg.id) {
        setViewingMessage(null);
      }

      await fetchMessages();
    } catch (err) {
      toast.error("Failed to archive message.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message?")) return;

    try {
      await deleteDocument("contactMessages", id);
      toast.success("Message deleted.");
      setViewingMessage(null);
      await fetchMessages();
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-charcoal/5">
        <div>
          <span className="text-xs uppercase tracking-widest text-blush font-semibold">
            Inquiries
          </span>
          <h1 className="font-heading text-display-sm font-semibold text-charcoal">
            Messages Inbox ({unreadCount} Unread)
          </h1>
        </div>
      </div>

      {/* Grid: Message list & Inspect details */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-blush" />
        </div>
      ) : messages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns: Messages List */}
          <div className="lg:col-span-2 space-y-4">
            {messages.map((msg) => {
              const isUnread = msg.status === "unread";
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setViewingMessage(msg);
                    if (isUnread) handleMarkRead(msg);
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer text-left shadow-soft flex justify-between items-start ${
                    isUnread
                      ? "bg-blush-subtle/10 border-blush/40"
                      : "bg-ivory-light border-charcoal/5 hover:border-charcoal/20"
                  } ${viewingMessage?.id === msg.id ? "ring-2 ring-blush" : ""}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal text-sm truncate">{msg.name}</span>
                      {isUnread && (
                        <span className="bg-blush text-ivory text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-charcoal-light truncate">{msg.subject}</p>
                    <p className="text-xs text-charcoal-muted line-clamp-1 font-light leading-relaxed">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right space-y-1 pl-4">
                    <span className="text-[9px] text-charcoal-subtle">{formatDate(msg.createdAt)}</span>
                    <span className="block text-[8px] uppercase tracking-wider font-semibold text-charcoal-subtle">{msg.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Inspect Message */}
          <div className="bg-ivory-light border border-charcoal/5 rounded-2xl p-6 shadow-soft space-y-6 text-left min-h-[300px]">
            {viewingMessage ? (
              <div className="space-y-6">
                <div className="border-b border-charcoal/5 pb-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blush">Subject</span>
                  <h3 className="font-heading text-xl font-bold text-charcoal leading-tight">{viewingMessage.subject}</h3>
                  <div className="text-xs text-charcoal-muted leading-relaxed font-light">
                    <p>Sender: <strong className="text-charcoal">{viewingMessage.name}</strong></p>
                    <p>Email: {viewingMessage.email}</p>
                    {viewingMessage.phone && <p>Phone: {viewingMessage.phone}</p>}
                    <p>Date: {formatDate(viewingMessage.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blush block">Message Body</span>
                  <p className="text-sm text-charcoal-muted leading-relaxed font-light whitespace-pre-wrap">
                    {viewingMessage.message}
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-charcoal/5 text-xs font-semibold uppercase tracking-wider">
                  {viewingMessage.status !== "archived" && (
                    <button
                      onClick={() => handleArchive(viewingMessage)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-charcoal/15 text-charcoal hover:bg-charcoal/5 rounded"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(viewingMessage.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-charcoal-subtle space-y-3">
                <Mail className="w-12 h-12" />
                <p className="text-sm text-charcoal-muted font-light">Select an email to view full conversation.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Inbox state */
        <div className="text-center py-20 bg-ivory-light border border-charcoal/5 rounded-xl shadow-soft space-y-6">
          <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-subtle">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-medium text-charcoal">Your Inbox is Empty</h3>
            <p className="text-sm text-charcoal-muted max-w-sm mx-auto font-light leading-relaxed">
              No customer inquiries or contact form submissions have been recorded in the database yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
