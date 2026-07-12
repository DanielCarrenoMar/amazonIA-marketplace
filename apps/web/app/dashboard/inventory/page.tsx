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
    router.push(`/dashboard/inventory/${product.id}`);
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
            <Button variant="primary">+ Añadir Nueva Artesanía</Button>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-border">
        <div className="flex gap-4 w-full sm:w-auto">
          <Input 
            placeholder="Buscar artesanía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            wrapperClassName="rounded-lg w-full sm:w-64"
          />
          <Select
            options={catOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full sm:w-48"
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}
          >
            <LayoutGrid className="w-4 h-4" />
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
