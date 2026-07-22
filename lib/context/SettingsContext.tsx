"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getDocument, setDocument } from "../firebase/firestore";
import { SiteSettings } from "../../types";
import { Timestamp } from "firebase/firestore";

interface SettingsContextType {
  settings: SiteSettings;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  id: "global",
  businessName: "YUMI DXB Fashion",
  tagline: "Where Comfort Meets Elegance.",
  phone: "+91 98765 43210", // Client placeholder, configurable
  businessEmail: "hello@yumidxb.com",
  whatsapp: "+91 98765 43210",
  instagram: "yumi_dxb",
  address: "Mangaluru, Karnataka, India",
  googleMapsLink: "",
  businessHours: "10:00 AM - 8:00 PM",
  currency: "INR",
  currencySymbol: "₹",
  shippingFee: 100,
  freeShippingAbove: 1500,
  returnWindowDays: 7,
  estimatedDeliveryDays: "5-7 business days",
  seoTitle: "YUMI DXB Fashion | Where Comfort Meets Elegance",
  seoDescription: "Discover premium comfort and elegance in modern Abayas, Kaftans, Co-ord Sets, and Floral Nightwear. Hand-selected quality from Mangaluru.",
  updatedAt: Timestamp.now(),
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loadingSettings: true,
  refreshSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getDocument<SiteSettings>("settings", "global");
      if (data) {
        setSettings(data);
      } else {
        // Create initial settings record in database if it doesn't exist
        await setDocument("settings", "global", defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading settings from Firestore:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadingSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
