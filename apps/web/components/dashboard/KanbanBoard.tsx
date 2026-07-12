"use client";
import React from "react";
import { ProductOrderResponseDto } from "@/lib/types";
import { OrderCard } from "./OrderCard";

export interface KanbanColumnDef {
  key: string;
  label: string;
  color: "yellow" | "blue" | "green" | "gray";
}

interface KanbanBoardProps {
  columns: KanbanColumnDef[];
  orders: ProductOrderResponseDto[];
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

export function KanbanBoard({ columns, orders, viewMode, onAction }: KanbanBoardProps) {
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'green': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-amber-100 text-amber-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'green': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
      {columns.map((col) => {
        const columnOrders = orders.filter(o => o.currentStatus === col.key);
        return (
          <div key={col.key} className="flex flex-col gap-4">
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-xl border font-semibold flex items-center justify-between ${getColorClasses(col.color)}`}>
              <span>{col.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getBadgeColor(col.color)}`}>
                {columnOrders.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex flex-col gap-3 min-h-[200px] p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              {columnOrders.length === 0 ? (
                <div className="m-auto text-center text-sm text-muted p-4">
                  No hay pedidos aquí
                </div>
              ) : (
                columnOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    viewMode={viewMode}
                    onAction={onAction}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
