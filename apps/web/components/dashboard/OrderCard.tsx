"use client";
import React from "react";
import { ProductOrderResponseDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MoreVertical, Calendar, Check, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrderCardProps {
  order: ProductOrderResponseDto;
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

export function OrderCard({ order, viewMode, onAction }: OrderCardProps) {
  const shortId = order.id.slice(0, 8);
  const otherParty = viewMode === "seller" ? order.buyer : order.product.seller;

  const renderStatusButton = () => {
    if (viewMode === "seller") {
      if (order.currentStatus === 'PAID') {
        return (
          <Button 
            size="sm" 
            className="w-full"
            leftIcon={<Truck className="w-4 h-4"/>}
            onClick={() => onAction?.('ship', order.id)}
          >
            Marcar como enviado
          </Button>
        );
      }
      if (order.currentStatus === 'SHIPPED') {
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => onAction?.('track', order.id)}
          >
            Ver Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === 'DELIVERED') {
         return (
          <Button 
            size="sm" 
            variant="secondary"
            className="w-full"
            leftIcon={<Check className="w-4 h-4"/>}
            onClick={() => onAction?.('confirm', order.id)}
          >
            Ver Confirmación
          </Button>
        );
      }
    } else { // buyer
       if (order.currentStatus === 'SHIPPED') {
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => onAction?.('track', order.id)}
          >
            Ver Seguimiento
          </Button>
        );
      }
      if (order.currentStatus === 'DELIVERED') {
         return (
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onAction?.('rate', order.id)}
          >
            Calificar Pedido
          </Button>
        );
      }
    }
    return null;
  };

  return (
    <Card padding="md" className="group border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-mono font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-md">
            #{shortId}
          </span>
          <h4 className="font-semibold text-foreground mt-1 line-clamp-1" title={order.product.name}>
            {order.product.name}
          </h4>
        </div>
        <button className="text-gray-400 hover:text-gray-700 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <div className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary flex shrink-0 items-center justify-center font-bold text-xs">
            {otherParty.user.fullName.charAt(0)}
          </div>
          <span className="truncate">{otherParty.user.fullName}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{format(new Date(order.createdAt), "d MMM, yyyy", { locale: es })}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="font-bold text-lg text-foreground">
          ${Number(order.totalAmount).toFixed(2)}
        </div>
        <Badge variant={
          order.currentStatus === 'PAID' ? 'accent' :
          order.currentStatus === 'SHIPPED' ? 'secondary' :
          order.currentStatus === 'DELIVERED' ? 'primary' : 'outline'
        } size="sm">
          {order.quantity} uds
        </Badge>
      </div>

      <div className="mt-4">
        {renderStatusButton()}
      </div>
    </Card>
  );
}
