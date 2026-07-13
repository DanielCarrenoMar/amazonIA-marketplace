import type { Metadata } from "next";
import { Poppins, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/useAuth";
import { CartProvider } from "@/lib/cartContext";
import { FavoriteProvider } from "@/lib/favoriteContext";
import { Toaster } from "sonner";
import { ToastProvider } from "@/components/ui/Toast";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});


export const metadata: Metadata = {
  title: "AmazonIA Marketplace",
  description: "Mercado digital de impacto social y biodiversidad amazónica.",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <AuthProvider>
            <FavoriteProvider>
              <CartProvider>
                {children}
                <Toaster richColors position="top-right" />
              </CartProvider>
            </FavoriteProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

