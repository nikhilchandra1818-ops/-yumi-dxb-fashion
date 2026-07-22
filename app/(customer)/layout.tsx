import React from "react";
import { Navbar } from "@/components/customer/Navbar";
import { Footer } from "@/components/customer/Footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-ivory">
      <Navbar />
      <main className="flex-1 flex flex-col pt-20 sm:pt-24 lg:pt-28">
        {children}
      </main>
      <Footer />
    </div>
  );
}
