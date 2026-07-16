import React from "react";
import { MarketplaceNavbar } from "@/components/layout/MarketplaceNavbar";
import { Footer } from "@/components/layout/Footer";

export default function TribesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNavbar />
      <div className="pt-20 flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
