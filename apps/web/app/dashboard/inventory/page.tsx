"use client";

import { useState, useEffect } from "react";
import { DashboardHeader, InventoryTable } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getMyProducts, getProducts, deleteProduct, getCategories } from "@/lib/api";
import type { ProductResponseDto, ProductCategoryResponseDto } from "event-types";
import { Search, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDto[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadProducts();
      getCategories().then(res => {
        const flat = res.flatMap(cat =>
          cat.subcategories.map(sub => ({
            id: sub.id,
            categoryName: cat.categoryName,
            subcategoryName: sub.subcategoryName
          }))
        );
        setCategories(flat);
      }).catch(console.error);
    }
  }, [user]);

  async function loadProducts() {
    try {
      const res = isAdmin ? await getProducts() : await getMyProducts();
      setProducts(res.data);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error al cargar productos", description: err.message, variant: "error" });
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta artesanía?")) return;
    try {
      await deleteProduct(id);
      toast({ title: "Producto eliminado", variant: "success" });
      loadProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "error" });
    }
  };

  const handleEdit = (product: ProductResponseDto) => {
    router.push(`/dashboard/inventory/${product.id}/edit`);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? p.categoryId?.toString() === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  const catOptions = [
    { value: "", label: "Todas las categorías" },
    ...categories.map(c => ({
      value: c.id.toString(),
      label: c.subcategoryName ? `${c.categoryName} - ${c.subcategoryName}` : c.categoryName
    }))
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Gestión de Inventario"
        subtitle={`${products.length} productos registrados`}
        action={
          <Link href="/dashboard/inventory/new">
            <button className="bg-[#FFB700] hover:bg-[#F2AE00] text-white font-bold text-[15px] px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(255,183,0,0.4)] transition-all flex items-center gap-2 border-none">
              <span className="text-[22px] leading-none font-bold">+</span> Añadir Nueva Artesanía
            </button>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-5 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-shadow"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={catOptions}
            className="w-full sm:w-40 rounded-full! bg-white border-gray-200 shadow-sm"
          />
        </div>

        <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-brand-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-brand-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table / Grid */}
      <InventoryTable
        products={filteredProducts}
        viewMode={viewMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
