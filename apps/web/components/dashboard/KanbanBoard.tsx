"use client";
import React from "react";
import type { ProductOrderResponseDto } from "event-types";
import { OrderCard } from "./OrderCard";
import { Package } from "lucide-react";

export interface KanbanColumnDef {
  key: string;
  label: string;
  color: "yellow" | "blue" | "green" | "gray" | "red";
}

interface KanbanBoardProps {
  columns: KanbanColumnDef[];
  orders: ProductOrderResponseDto[];
  viewMode: "seller" | "buyer";
  onAction?: (action: string, orderId: string) => void;
}

type ColorKey = "yellow" | "blue" | "green" | "gray" | "red";

const COLUMN_STYLES: Record<ColorKey, {
  header: string;
  badge: string;
  dot: string;
  empty: string;
}> = {
  yellow: {
    header: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border border-amber-200",
    dot: "bg-amber-400",
    empty: "border-amber-200/60",
  },
  blue: {
    header: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800 border border-blue-200",
    dot: "bg-blue-400",
    empty: "border-blue-200/60",
  },
  green: {
    header: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-400",
    empty: "border-emerald-200/60",
  },
  red: {
    header: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800 border border-red-200",
    dot: "bg-red-400",
    empty: "border-red-200/60",
  },
  gray: {
    header: "bg-gray-50 border-gray-200",
    badge: "bg-gray-200 text-gray-700 border border-gray-200",
    dot: "bg-gray-400",
    empty: "border-gray-200/60",
  },
};

export function KanbanBoard({ columns, orders, viewMode, onAction }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
      {columns.map((col) => {
        const columnOrders = orders.filter((o) => o.currentStatus === col.key);
        const styles = COLUMN_STYLES[col.color] ?? COLUMN_STYLES.gray;

        return (
          <div key={col.key} className="flex flex-col gap-3 min-w-0">
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-xl border ${styles.header} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${styles.dot} shadow-sm`} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${styles.badge}`}>
                {columnOrders.length}
              </span>
            </div>

            {/* Column Body */}
            <div
              className={`flex flex-col gap-3 rounded-xl border border-dashed ${styles.empty} bg-white/50 p-2`}
              style={{ minHeight: "12rem" }}
            >
              {columnOrders.length === 0 ? (
                <div className="m-auto flex flex-col items-center gap-2 py-8 text-center opacity-50">
                  <Package className="w-7 h-7 text-gray-300" />
                  <p className="text-xs text-muted">Sin pedidos</p>
                </div>
              ) : (
                columnOrders.map((order) => (
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
