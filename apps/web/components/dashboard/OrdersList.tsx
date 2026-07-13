"use client";
import React from "react";
import type { ProductOrderResponseDto } from "event-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Truck, Check, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrdersListProps {
  orders: ProductOrderResponseDto[];
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

export function OrdersList({ orders, viewMode, onAction }: OrdersListProps) {
  const router = useRouter();
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <p className="text-gray-500">No hay pedidos disponibles.</p>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" size="sm">Esperando Pago</Badge>;
      case 'PAID':
        return <Badge variant="accent" size="sm">En Preparación</Badge>;
      case 'SHIPPED':
        return <Badge variant="secondary" size="sm">Enviado</Badge>;
      case 'DELIVERED':
        return <Badge variant="primary" size="sm">Entregado</Badge>;
      case 'CANCELED':
        return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50" size="sm">Cancelado</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  const renderAction = (order: ProductOrderResponseDto) => {
    if (viewMode === "seller") {
      if (order.currentStatus === 'PAID') {
        return (
          <Button size="sm" leftIcon={<Truck className="w-3.5 h-3.5"/>} onClick={(e) => { e.stopPropagation(); onAction?.('ship', order.id); }}>
            Enviar
          </Button>
        );
      }
      if (order.currentStatus === 'SHIPPED') {
        return (
          <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5"/>} onClick={(e) => { e.stopPropagation(); onAction?.('track', order.id); }}>
            Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === 'DELIVERED') {
        return (
          <Button size="sm" variant="secondary" leftIcon={<Check className="w-3.5 h-3.5"/>} onClick={(e) => { e.stopPropagation(); onAction?.('confirm', order.id); }}>
            Ver detalle
          </Button>
        );
      }
    } else {
      if (order.currentStatus === 'PENDING') {
        return (
          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" leftIcon={<XCircle className="w-3.5 h-3.5"/>} onClick={(e) => { e.stopPropagation(); onAction?.('cancel', order.id); }}>
            Cancelar
          </Button>
        );
      }
      if (order.currentStatus === 'SHIPPED') {
        return (
          <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5"/>} onClick={(e) => { e.stopPropagation(); onAction?.('track', order.id); }}>
            Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === 'DELIVERED') {
        return (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onAction?.('rate', order.id); }}>
            Calificar
          </Button>
        );
      }
    }
    return <span className="text-gray-400 text-sm">-</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {viewMode === "seller" ? "Comprador" : "Vendedor"}
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const otherPartyName = viewMode === "seller" ? order.buyer?.fullName : order.product?.seller?.user?.fullName;
              return (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 line-clamp-1">{order.product?.name || "Desconocido"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{otherPartyName || "Desconocido"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(order.createdAt), "d MMM, yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4">{renderStatusBadge(order.currentStatus)}</td>
                  <td className="px-6 py-4 text-right">{renderAction(order)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
