"use client";
import React from "react";
import type { ProductResponseDto } from "event-types";
import { ProductCard } from "@/components/ui/ProductCard";
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InventoryTableProps {
  products: ProductResponseDto[];
  viewMode: "list" | "grid";
  onEdit: (product: ProductResponseDto) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ products, viewMode, onEdit, onDelete }: InventoryTableProps) {
  const router = useRouter();
  
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
          <div key={product.id} className="relative group cursor-pointer" onClick={() => router.push(`/dashboard/inventory/${product.id}`)}>
             <ProductCard
                id={product.id}
                title={product.name}
                description={product.description || ""}
                price={`$${Number(product.price).toFixed(2)}`}
                category={product.category?.categoryName || "Otros"}
                rating={product.averageRating || 0}
                image={product.imageUrl || "/placeholder.jpg"}
                hideFavorite={true}
                href={`/dashboard/inventory/${product.id}`}
             />
             <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={e => e.stopPropagation()}>
               <Link href={`/marketplace/${product.id}`}>
                 <button className="flex items-center justify-center p-3 rounded-full shadow-lg bg-white text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-colors">
                   <Eye className="w-4 h-4"/>
                 </button>
               </Link>
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
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200">
      <div className="w-full">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Productos</th>
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Categoría</th>
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Precio</th>
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Stock</th>
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Estado</th>
              <th className="px-6 py-5 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr 
                key={product.id} 
                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                onClick={() => router.push(`/dashboard/inventory/${product.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-left">
                    <img src={product.imageUrl || "/placeholder.jpg"} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0" alt="" />
                    <span className="font-semibold text-gray-900 text-sm max-w-[150px] truncate">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-center">{product.category?.categoryName || "Otros"}</td>
                <td className="px-6 py-4 font-bold text-gray-900 text-sm text-center">${Number(product.price).toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${product.stockAvailable > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {product.stockAvailable} uds.
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {product.stockAvailable <= 0 ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-[#FF5A5F] border border-[#FF5A5F]/30 bg-white shadow-sm">
                      Agotado
                    </span>
                  ) : !product.isActive ? (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-gray-500 border border-gray-300 bg-gray-50 shadow-sm">
                      Pausado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold text-[#0B7D5C] border border-[#0B7D5C]/30 bg-white shadow-sm">
                      Activo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="relative inline-block text-left">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === product.id ? null : product.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openMenuId === product.id && (
                      <>
                        {/* Invisible overlay to catch clicks outside the menu */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} 
                        />
                        <div className="absolute right-1/2 translate-x-1/2 mt-2 w-44 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top">
                          <Link 
                            href={`/dashboard/inventory/${product.id}`} 
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary text-left font-medium"
                          >
                            <Eye className="w-4 h-4 mr-2 text-gray-400" />
                            Ver producto
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(product);
                              setOpenMenuId(null);
                            }} 
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary text-left font-medium"
                          >
                            <Edit className="w-4 h-4 mr-2 text-gray-400" />
                            Editar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(product.id);
                              setOpenMenuId(null);
                            }} 
                            className="w-full flex items-center px-4 py-2 text-sm text-[#FF5A5F] hover:bg-red-50 text-left font-medium"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
