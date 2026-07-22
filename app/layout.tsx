import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
import { SettingsProvider } from "@/lib/context/SettingsContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YUMI DXB Fashion | Where Comfort Meets Elegance",
    template: "%s | YUMI DXB Fashion",
  },
  description:
    "YUMI DXB Fashion brings premium, comfortable, and elegant nightwear, abayas, kaftans, and co-ord sets. Carefully curated designs crafted to make you feel confident and comfortable.",
  metadataBase: new URL("https://yumi-e33cd.web.app"),
  openGraph: {
    title: "YUMI DXB Fashion",
    description: "Where Comfort Meets Elegance. Discover premium nightwear, abayas, kaftans, and co-ord sets.",
    url: "https://yumi-e33cd.web.app",
    siteName: "YUMI DXB Fashion",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F3EE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <div className="flex-1 flex flex-col min-h-screen">
                  {children}
                  {modal}
                </div>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#F7F3EE",
                      color: "#1A1A1A",
                      border: "1px solid rgba(26, 26, 26, 0.08)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "0.875rem",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                    },
                    success: {
                      iconTheme: {
                        primary: "#C97B7B",
                        secondary: "#F7F3EE",
                      },
                    },
                  }}
                />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
