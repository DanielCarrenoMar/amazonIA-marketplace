"use client";
import React from "react";
import type { ProductResponseDto } from "event-types";
import { ProductCard } from "@/components/ui/ProductCard";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InventoryTableProps {
  products: ProductResponseDto[];
  viewMode: "list" | "grid";
  onEdit: (product: ProductResponseDto) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ products, viewMode, onEdit, onDelete }: InventoryTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted bg-white rounded-2xl border border-dashed border-gray-200">
        No tienes productos registrados.
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="relative group">
             <ProductCard
                id={product.id}
                title={product.name}
                description={product.description || ""}
                price={`$${Number(product.price).toFixed(2)}`}
                category={product.category?.categoryName || "Otros"}
                rating={product.averageRating || 0}
                image={product.imageUrl || "/placeholder.jpg"}
             />
             <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <Button size="icon" variant="primary" className="shadow-lg" onClick={() => onEdit(product)}>
                 <Edit className="w-4 h-4"/>
               </Button>
               <Button size="icon" variant="danger" className="shadow-lg" onClick={() => onDelete(product.id)}>
                 <Trash2 className="w-4 h-4"/>
               </Button>
             </div>
          </div>
        ))}
      </div>
    );
  }

  // Vista de Lista simplificada
  return (
    <div className="overflow-x-auto bg-white border border-border rounded-2xl">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted uppercase bg-gray-50 border-b border-border">
          <tr>
            <th className="px-6 py-4">Producto</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">Precio</th>
            <th className="px-6 py-4">Stock</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="bg-white border-b last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-3">
                <img src={product.imageUrl || "/placeholder.jpg"} className="w-10 h-10 rounded-lg object-cover" alt="" />
                <span className="truncate max-w-[200px]">{product.name}</span>
              </td>
              <td className="px-6 py-4">{product.category?.categoryName || "Otros"}</td>
              <td className="px-6 py-4 font-bold text-brand-nature-content">${Number(product.price).toFixed(2)}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stockAvailable > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {product.stockAvailable} uds
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => onEdit(product)} className="p-2 text-muted hover:text-brand-primary transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(product.id)} className="p-2 text-muted hover:text-brand-urgency transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
