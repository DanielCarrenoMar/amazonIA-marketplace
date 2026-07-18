"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardHeader, InventoryTable } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { getMyProducts, getProducts, deleteProduct, getCategories, getActiveTribes } from "@/lib/api";
import { getMyTribe } from "@/lib/api/tribe.api";
import { Modal } from "@/components/ui/Modal";
import type { ProductResponseDto, ProductCategoryResponseDto, TribeResponseDto } from "event-types";
import { Search, LayoutGrid, List, SlidersHorizontal, Star, ChevronDown, ChevronUp, Trash2, Users } from "lucide-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tribes, setTribes] = useState<TribeResponseDto[]>([]);
  const [hasTribe, setHasTribe] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductResponseDto | null>(null);
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeTribeIds, setActiveTribeIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedFilter, setExpandedFilter] = useState<string>("Categoría");
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        setHasTribe(true);
      } else {
        getMyTribe().then(tribe => setHasTribe(!!tribe)).catch(() => setHasTribe(false));
      }
      loadProducts();
      getCategories().then(res => {
        setCategories(res);
      }).catch(console.error);
      
      getActiveTribes().then(res => setTribes(res.data || [])).catch(console.error);
    }
  }, [user, isAdmin]);

  async function loadProducts() {
    try {
      const res = isAdmin ? await getProducts() : await getMyProducts();
      setProducts(res.data);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error al cargar productos", description: err.message, variant: "error" });
    }
  }

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToDelete(product);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast({ title: "Producto eliminado", description: "El producto ha sido eliminado exitosamente.", variant: "success" });
      loadProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al eliminar el producto", variant: "error" });
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product: ProductResponseDto) => {
    router.push(`/dashboard/inventory/${product.id}/edit`);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? p.categoryId?.toString() === categoryFilter : true;
    
    const price = Number(p.price);
    const matchesMinPrice = minPrice ? price >= Number(minPrice) : true;
    const matchesMaxPrice = maxPrice ? price <= Number(maxPrice) : true;
    
    const matchesRating = minRating ? Number(p.averageRating || 0) >= minRating : true;
    
    const finalTribeMatch = activeTribeIds.length > 0 ? (p.seller?.tribeId && activeTribeIds.includes(p.seller.tribeId)) : true;
    
    const matchesStatus = statusFilter === "" ? true : p.isActive === (statusFilter === "ACTIVE");

    return matchesSearch && matchesCat && matchesMinPrice && matchesMaxPrice && matchesRating && finalTribeMatch && matchesStatus;
  });

  if (hasTribe === false) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Gestión de Inventario"
          subtitle="Tribu Requerida"
        />
        
        <div className="bg-white rounded-3xl p-10 border border-yellow-200 shadow-sm text-center max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aún no tienes una tribu</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Para poder subir productos y convertirte en vendedor en AmazonIA 4.0, primero debes unirte a una Tribu o crear una. Esto nos ayuda a garantizar el origen y la calidad de nuestras artesanías.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/tribe">
              <Button variant="primary" className="font-bold">
                Ir a Mi Tribu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar artesanía..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-5 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                showFilters || categoryFilter || minPrice || maxPrice || minRating > 0 || activeTribeIds.length > 0 || statusFilter
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {(categoryFilter || minPrice || maxPrice || minRating > 0 || activeTribeIds.length > 0 || statusFilter) && (
                <span className="w-2 h-2 rounded-full bg-brand-primary absolute top-2 right-3"></span>
              )}
            </button>

            {/* Filter Dropdown (Popover) */}
            {showFilters && (
              <div ref={filterMenuRef} className="absolute top-full left-0 mt-2 w-80 bg-white rounded-3xl border border-gray-100 shadow-xl z-50 p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                
                {/* Categorías */}
                <div className="border-b border-gray-100 pb-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedFilter(expandedFilter === "Categoría" ? "" : "Categoría")}
                  >
                    <h3 className="font-bold text-slate-900 text-base">Categoría</h3>
                    <div className="flex items-center gap-2">
                      {categoryFilter && (
                        <button onClick={(e) => { e.stopPropagation(); setCategoryFilter(""); }} className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">
                          Limpiar
                        </button>
                      )}
                      {expandedFilter === "Categoría" ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {expandedFilter === "Categoría" && (
                    <div className="mt-4 flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                      {categories.map((group) => (
                        <div key={group.categoryName} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedCategory(expandedCategory === group.categoryName ? "" : group.categoryName)}
                            className="w-full flex items-center justify-between p-3 text-sm font-semibold bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            {group.categoryName}
                            {expandedCategory === group.categoryName ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </button>
                          {expandedCategory === group.categoryName && (
                            <div className="p-3 bg-white flex flex-col gap-2">
                              {group.subcategories.map((sub: any) => (
                                <label key={sub.id} className="flex items-center gap-3 cursor-pointer group">
                                  <input
                                    type="radio"
                                    name="categoryFilter"
                                    checked={categoryFilter === sub.id.toString()}
                                    onChange={() => setCategoryFilter(sub.id.toString())}
                                    className="accent-brand-primary w-4 h-4"
                                  />
                                  <span className="text-sm font-medium text-slate-700 group-hover:text-brand-primary transition-colors">
                                    {sub.subcategoryName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="border-b border-gray-100 pb-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedFilter(expandedFilter === "Estado" ? "" : "Estado")}
                  >
                    <h3 className="font-bold text-slate-900 text-base">Estado</h3>
                    <div className="flex items-center gap-2">
                      {statusFilter && (
                        <button onClick={(e) => { e.stopPropagation(); setStatusFilter(""); }} className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">
                          Limpiar
                        </button>
                      )}
                      {expandedFilter === "Estado" ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {expandedFilter === "Estado" && (
                    <div className="mt-4 flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === ""}
                          onChange={() => setStatusFilter("")}
                          className="accent-brand-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-brand-primary transition-colors">Cualquier Estado</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === "ACTIVE"}
                          onChange={() => setStatusFilter("ACTIVE")}
                          className="accent-brand-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-brand-primary transition-colors">Activo</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="statusFilter"
                          checked={statusFilter === "INACTIVE"}
                          onChange={() => setStatusFilter("INACTIVE")}
                          className="accent-brand-primary w-4 h-4"
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-brand-primary transition-colors">Inactivo</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="border-b border-gray-100 pb-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedFilter(expandedFilter === "Precio" ? "" : "Precio")}
                  >
                    <h3 className="font-bold text-slate-900 text-base">Precio</h3>
                    <div className="flex items-center gap-2">
                      {(minPrice || maxPrice) && (
                        <button onClick={(e) => { e.stopPropagation(); setMinPrice(''); setMaxPrice(''); }} className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">
                          Limpiar
                        </button>
                      )}
                      {expandedFilter === "Precio" ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {expandedFilter === "Precio" && (
                    <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                      <Input
                        placeholder="Min"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                        wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200"
                        className="text-sm"
                      />
                      <span className="text-gray-300 font-medium">-</span>
                      <Input
                        placeholder="Max"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                        wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Star Rating */}
                <div className="border-b border-gray-100 pb-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedFilter(expandedFilter === "Calificación" ? "" : "Calificación")}
                  >
                    <h3 className="font-bold text-slate-900 text-base">Calificación Mínima</h3>
                    <div className="flex items-center gap-2">
                      {minRating > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); setMinRating(0); }} className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">
                          Limpiar
                        </button>
                      )}
                      {expandedFilter === "Calificación" ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {expandedFilter === "Calificación" && (
                    <div className="mt-4 flex items-center justify-between group animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex gap-1 transition-transform" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map(star => {
                          const isFilled = star <= (hoverRating || minRating);
                          return (
                            <Icon
                              key={star}
                              icon="lucide:star"
                              onMouseEnter={() => setHoverRating(star)}
                              onClick={() => setMinRating(star)}
                              className={`w-6 h-6 cursor-pointer transition-colors ${isFilled ? "fill-amber-400 text-amber-400 hover:scale-110" : "fill-gray-300 text-gray-300 hover:scale-110 hover:fill-amber-200 hover:text-amber-200"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comunidad de Origen */}
                <div>
                  <div 
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => setExpandedFilter(expandedFilter === "Comunidades" ? "" : "Comunidades")}
                  >
                    <h3 className="font-bold text-slate-900 text-base">Comunidades</h3>
                    <div className="flex items-center gap-2">
                      {activeTribeIds.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); setActiveTribeIds([]); }} className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors">
                          Limpiar
                        </button>
                      )}
                      {expandedFilter === "Comunidades" ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {expandedFilter === "Comunidades" && (
                    <div className="flex flex-col gap-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-200 mt-4">
                      {tribes.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay comunidades disponibles</p>
                      ) : (
                        tribes.map(tribe => (
                          <label key={tribe.id} className="flex items-center gap-3 cursor-pointer group">
                            <Checkbox
                              checked={activeTribeIds.includes(tribe.id)}
                              onChange={(e) => {
                                if (e.target.checked) setActiveTribeIds(prev => [...prev, tribe.id]);
                                else setActiveTribeIds(prev => prev.filter(id => id !== tribe.id));
                              }}
                              className="border-gray-200 peer-checked:bg-brand-primary peer-checked:border-brand-primary"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-brand-primary transition-colors">
                              {tribe.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
              </div>
            )}
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden p-0.5 shrink-0 mt-4 sm:mt-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 transition-colors rounded-full flex items-center justify-center ${viewMode === "list" ? "bg-brand-primary text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 transition-colors rounded-full flex items-center justify-center ${viewMode === "grid" ? "bg-brand-primary text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}
        title="Eliminar Artesanía"
        description="¿Estás seguro de que deseas eliminar esta artesanía de tu inventario? Esta acción no se puede deshacer y borrará permanentemente toda su información e historial."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Sí, Eliminar Permanentemente</Button>
          </>
        }
      >
        <div className="py-4 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-700 text-sm">
            Si eliminas <strong>{productToDelete?.name}</strong> ya no será visible para los compradores en el Marketplace ni podrás gestionar su stock.
          </p>
        </div>
      </Modal>

    </div>
  );
}
