"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, Check, Info } from "lucide-react";

// TIPO DEL TOAST
export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextProps {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de un ToastProvider");
  return context;
};

// ICONOS POR VARIANTE
const getIcon = (variant: ToastVariant) => {
  switch (variant) {
    case "success": return (
      <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-white stroke-[3px]" />
      </div>
    );
    case "error": return (
      <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center shrink-0">
        <X className="w-5 h-5 text-white stroke-[3px]" />
      </div>
    );
    case "warning": return (
      <div className="w-8 h-8 rounded-full bg-[#fca55d] flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-lg leading-none -mt-0.5">!</span>
      </div>
    );
    case "info": return (
      <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-lg italic font-serif leading-none">i</span>
      </div>
    );
    default: return (
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <Info className="w-5 h-5 text-gray-500" />
      </div>
    );
  }
};

// ESTILOS POR VARIANTE
const getVariantStyles = (variant: ToastVariant) => {
  switch (variant) {
    case "success": return "border-emerald-50/50 bg-gradient-to-r from-emerald-50/80 to-transparent text-gray-600 shadow-emerald-500/5";
    case "error": return "border-red-50/50 bg-gradient-to-r from-red-50/80 to-transparent text-gray-600 shadow-red-500/5";
    case "warning": return "border-orange-50/50 bg-gradient-to-r from-orange-50/80 to-transparent text-gray-600 shadow-orange-500/5";
    case "info": return "border-brand-secondary/20 bg-gradient-to-r from-brand-secondary/10 to-transparent text-gray-600 shadow-brand-secondary/5";
    default: return "border-gray-50 bg-white text-gray-600 shadow-black/5";
  }
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);

    // Auto dismiss tras cierta duración
    const duration = options.duration || 4500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Contenedor fijo de notificaciones en la esquina inferior derecha */}
      <div className="fixed bottom-0 right-0 z-10000 p-4 sm:p-6 w-full sm:w-96 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center w-full px-5 py-4 gap-4 bg-white border shadow-xl rounded-full animate-in slide-in-from-bottom-5 fade-in duration-300 ${getVariantStyles(t.variant || "default")}`}
          >
            <div className="shrink-0">{getIcon(t.variant || "default")}</div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-medium text-[15.5px] tracking-wide text-gray-600">{t.title}</span>
              {t.description && (
                <span className="text-sm opacity-80 leading-relaxed text-gray-500">{t.description}</span>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors self-center p-2 rounded-full hover:bg-black/5"
            >
              <X className="w-5 h-5 cursor-pointer" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
