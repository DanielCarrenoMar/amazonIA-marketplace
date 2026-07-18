"use client";

import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to false for mobile, will set to true on mount for desktop

  useEffect(() => {
    // Check if desktop and open sidebar by default
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login"); 
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}

        <main className={`transition-all duration-300 ${isSidebarOpen ? 'md:pl-72' : 'pl-0'}`}>
          {/* Mobile Header with Hamburger */}
          <div className="md:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="ml-3 font-bold text-brand-primary">Dashboard</span>
          </div>
          
          {/* Desktop Floating Toggle Button */}
          <div 
            className={`hidden md:flex fixed top-8 z-40 transition-all duration-300 ${isSidebarOpen ? 'left-72' : 'left-0'}`}
          >
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center justify-center w-8 h-10 bg-white border border-gray-200 shadow-md text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer ${isSidebarOpen ? 'rounded-r-xl border-l-0 -ml-[1px]' : 'rounded-r-xl border-l-0 mt-4'}`}
              title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <div className="max-w-6xl mx-auto p-4 md:p-8 pt-6 md:pt-4">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
