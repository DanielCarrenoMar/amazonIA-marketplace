"use client";
import React from "react";
import type { ProductOrderResponseDto } from "event-types";
import { Button } from "@/components/ui/Button";
import { Calendar, Truck, Check, Eye, XCircle, Star, Ban } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface OrderCardProps {
  order: ProductOrderResponseDto;
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Esperando Pago", className: "bg-gray-100 text-gray-600 border border-gray-200" },
  PAID: { label: "Por Enviar", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  SHIPPED: { label: "En Camino", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  DELIVERED: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  CANCELED: { label: "Cancelado", className: "bg-red-50 text-red-600 border border-red-200" },
};

export function OrderCard({ order, viewMode, onAction }: OrderCardProps) {
  const router = useRouter();
  const shortId = order.id.slice(0, 8);
  const otherPartyName =
    viewMode === "seller"
      ? order.buyer?.fullName
      : order.product?.seller?.user?.fullName;
  const initial = otherPartyName ? otherPartyName.charAt(0).toUpperCase() : "?";
  const isCanceled = order.currentStatus === "CANCELED";

  const statusCfg = STATUS_CONFIG[order.currentStatus] ?? {
    label: order.currentStatus,
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  const renderActionButton = () => {
    if (isCanceled) return null;

    if (viewMode === "seller") {
      if (order.currentStatus === "PAID") {
        return (
          <Button
            size="sm"
            className="w-full"
            leftIcon={<Truck className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("ship", order.id); }}
          >
            Marcar como enviado
          </Button>
        );
      }
      if (order.currentStatus === "SHIPPED") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("track", order.id); }}
          >
            Ver Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === "DELIVERED") {
        return (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("confirm", order.id); }}
          >
            Ver Confirmación
          </Button>
        );
      }
    } else {
      if (order.currentStatus === "PENDING") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("cancel", order.id); }}
          >
            Cancelar Pedido
          </Button>
        );
      }
      if (order.currentStatus === "SHIPPED") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("track", order.id); }}
          >
            Ver Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === "DELIVERED") {
        return (
          <Button
            size="sm"
            className="w-full"
            leftIcon={<Star className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("rate", order.id); }}
          >
            Calificar Pedido
          </Button>
        );
      }
    }
    return null;
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
      className={`group rounded-xl border bg-white shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${
        isCanceled
          ? "opacity-60 hover:opacity-100 border-gray-100"
          : "hover:shadow-md hover:-translate-y-0.5 border-gray-100 hover:border-brand-primary/30"
      }`}
    >
      {/* Canceled overlay stripe */}
      {isCanceled && (
        <div className="h-1 w-full bg-gradient-to-r from-red-300 via-red-200 to-red-300" />
      )}

      {/* Green top accent when active */}
      {!isCanceled && (
        <div className="h-0.5 w-full bg-gradient-to-r from-brand-primary/0 via-brand-primary/40 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-mono text-muted bg-gray-100 px-1.5 py-0.5 rounded-md">
                #{shortId}
              </span>
              {isCanceled && (
                <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
                  <Ban className="w-3 h-3" /> Cancelado
                </span>
              )}
            </div>
            <h4
              className="text-sm font-semibold text-foreground line-clamp-2 leading-tight"
              title={order.product?.name}
            >
              {order.product?.name || "Producto desconocido"}
            </h4>
          </div>
          {/* Status pill */}
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Party info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary flex shrink-0 items-center justify-center font-bold text-xs uppercase">
            {initial}
          </div>
          <span className="text-xs text-muted truncate">{otherPartyName || "Usuario Desconocido"}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{format(new Date(order.createdAt), "d MMM, yyyy", { locale: es })}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
          <span className="text-lg font-bold text-foreground">
            ${Number(order.totalAmount).toFixed(2)}
          </span>
          <span className="text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">
            {order.quantity} {order.quantity === 1 ? "unidad" : "unidades"}
          </span>
        </div>

        {/* Action Button */}
        {renderActionButton()}
      </div>
    </div>
  );
}
