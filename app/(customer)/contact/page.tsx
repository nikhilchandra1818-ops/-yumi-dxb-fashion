"use client";

import React, { useState } from "react";
import { useSettings } from "@/lib/context/SettingsContext";
import { createDocument } from "@/lib/firebase/firestore";
import { toast } from "react-hot-toast";
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2, Clock } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);


export default function ContactPage() {
  const { settings } = useSettings();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save contact message to Firestore
      const msgRef = await createDocument("contactMessages", {
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        status: "unread",
      });

      // 2. Create admin notification in Firestore
      await createDocument("notifications", {
        type: "new_message",
        title: "New Customer Message",
        body: `Message from ${name} on: "${subject}"`,
        link: `/admin/messages`,
        isRead: false,
      });

      toast.success("Your message has been sent successfully!");
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Error submitting contact form:", err);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Page Header */}
      <div className="space-y-4 text-center pb-8 border-b border-charcoal/5">
        <span className="text-xs uppercase tracking-widest text-blush font-semibold">
          Get in Touch
        </span>
        <h1 className="font-heading text-display-lg font-semibold text-charcoal">
          Contact YUMI
        </h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto font-light leading-relaxed">
          We would love to hear from you. Have a question about our collections or sizing? Reach out and we will help.
        </p>
      </div>

      {/* Grid: Info + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Contact Info (Only display configured settings values) */}
        <div className="space-y-8 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft">
          <h2 className="font-heading text-2xl font-semibold text-charcoal">Contact Details</h2>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            Here is our confirmed business information. Feel free to reach out via phone, Instagram, or email.
          </p>

          <div className="space-y-6 pt-4">
            {/* Phone */}
            {settings.phone && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Call Us</h3>
                  <a href={`tel:${settings.phone}`} className="text-sm text-charcoal-muted hover:text-blush transition-colors mt-1 block">
                    {settings.phone}
                  </a>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {settings.whatsapp && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">WhatsApp</h3>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-charcoal-muted hover:text-blush transition-colors mt-1 block"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {settings.businessEmail && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Email Us</h3>
                  <a href={`mailto:${settings.businessEmail}`} className="text-sm text-charcoal-muted hover:text-blush transition-colors mt-1 block">
                    {settings.businessEmail}
                  </a>
                </div>
              </div>
            )}

            {/* Address */}
            {settings.address && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Location</h3>
                  <span className="text-sm text-charcoal-muted mt-1 block leading-relaxed">
                    {settings.address}
                  </span>
                </div>
              </div>
            )}

            {/* Business Hours */}
            {settings.businessHours && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Boutique Hours</h3>
                  <span className="text-sm text-charcoal-muted mt-1 block">
                    {settings.businessHours}
                  </span>
                </div>
              </div>
            )}

            {/* Instagram */}
            {settings.instagram && (
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blush-subtle/50 rounded-full text-blush">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Follow Us</h3>
                  <a
                    href={`https://instagram.com/${settings.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-charcoal-muted hover:text-blush transition-colors mt-1 block"
                  >
                    @{settings.instagram}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-ivory-light border border-charcoal/5 rounded-2xl p-8 shadow-soft">
          <h2 className="font-heading text-2xl font-semibold text-charcoal mb-6">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="form-name" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Full Name <span className="text-blush">*</span>
                </label>
                <input
                  id="form-name"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>
              
              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="form-email" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Email Address <span className="text-blush">*</span>
                </label>
                <input
                  id="form-email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="form-phone" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Phone Number
                </label>
                <input
                  id="form-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label htmlFor="form-subject" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Subject <span className="text-blush">*</span>
                </label>
                <input
                  id="form-subject"
                  type="text"
                  required
                  placeholder="Order Inquiry / Sizing / Customization"
                  className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label htmlFor="form-message" className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Message <span className="text-blush">*</span>
              </label>
              <textarea
                id="form-message"
                rows={5}
                required
                placeholder="Write your message here..."
                className="w-full bg-transparent border border-charcoal/10 rounded-md p-3 text-sm focus:outline-none focus:border-blush text-charcoal placeholder-charcoal-subtle"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-navy text-ivory hover:bg-navy-light py-3 px-8 rounded-md font-semibold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-xs shadow-navy"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Message</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
