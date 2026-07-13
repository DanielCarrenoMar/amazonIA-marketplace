"use client";
import React from "react";
import type { ProductOrderResponseDto } from "event-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Truck, Check, XCircle, Eye, Star, PackageX } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrdersListProps {
  orders: ProductOrderResponseDto[];
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  PENDING: {
    label: "Esperando Pago",
    dotClass: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  PAID: {
    label: "En Preparación",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  SHIPPED: {
    label: "Enviado",
    dotClass: "bg-blue-400",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  DELIVERED: {
    label: "Entregado",
    dotClass: "bg-emerald-400",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  CANCELED: {
    label: "Cancelado",
    dotClass: "bg-red-400",
    badgeClass: "bg-red-50 text-red-600 border border-red-200",
  },
};

export function OrdersList({ orders, viewMode, onAction }: OrdersListProps) {
  const router = useRouter();

  const renderStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] ?? {
      label: status,
      dotClass: "bg-gray-400",
      badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
      </span>
    );
  };

  const renderAction = (order: ProductOrderResponseDto) => {
    if (order.currentStatus === "CANCELED") {
      return <span className="text-xs text-muted italic">—</span>;
    }

    if (viewMode === "seller") {
      if (order.currentStatus === "PAID") {
        return (
          <Button
            size="sm"
            leftIcon={<Truck className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("ship", order.id); }}
          >
            Enviar
          </Button>
        );
      }
      if (order.currentStatus === "SHIPPED") {
        return (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("track", order.id); }}
          >
            Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === "DELIVERED") {
        return (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Check className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("confirm", order.id); }}
          >
            Ver detalle
          </Button>
        );
      }
    } else {
      if (order.currentStatus === "PENDING") {
        return (
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("cancel", order.id); }}
          >
            Cancelar
          </Button>
        );
      }
      if (order.currentStatus === "SHIPPED") {
        return (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("track", order.id); }}
          >
            Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === "DELIVERED") {
        return (
          <Button
            size="sm"
            leftIcon={<Star className="w-3.5 h-3.5" />}
            onClick={(e) => { e.stopPropagation(); onAction?.("rate", order.id); }}
          >
            Calificar
          </Button>
        );
      }
    }

    return <span className="text-gray-400 text-sm">—</span>;
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
            <PackageX className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm text-muted">No hay pedidos disponibles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {viewMode === "seller" ? "Comprador" : "Vendedor"}
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => {
              const otherPartyName =
                viewMode === "seller"
                  ? order.buyer?.fullName
                  : order.product?.seller?.user?.fullName;
              const isCanceled = order.currentStatus === "CANCELED";

              return (
                <tr
                  key={order.id}
                  className={`transition-colors group cursor-pointer ${
                    isCanceled
                      ? "opacity-60 hover:opacity-100 bg-gray-50/50 hover:bg-gray-100"
                      : "hover:bg-brand-nature-bg/30"
                  }`}
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <td className="px-6 py-4 text-xs font-mono text-muted">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded-md group-hover:bg-brand-primary-light group-hover:text-brand-primary transition-colors">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[180px]">
                    <span className="line-clamp-1">{order.product?.name || "Desconocido"}</span>
                    <span className="text-xs text-muted block mt-0.5">
                      {order.quantity} {order.quantity === 1 ? "unidad" : "unidades"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary flex shrink-0 items-center justify-center font-bold text-xs uppercase">
                        {(otherPartyName || "?").charAt(0)}
                      </div>
                      <span className="truncate max-w-[100px]">{otherPartyName || "Desconocido"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(order.createdAt), "d MMM, yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {renderStatusBadge(order.currentStatus)}
                  </td>
                  <td className="px-6 py-4 text-right">{renderAction(order)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-muted">
          {orders.length} {orders.length === 1 ? "resultado" : "resultados"}
        </p>
      </div>
    </div>
  );
}
