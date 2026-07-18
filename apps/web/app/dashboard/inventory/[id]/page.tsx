"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getProductById, getProductMetrics, deleteProduct, updateProduct } from "@/lib/api";
import type { ProductResponseDto, ProductMetricsDto } from "event-types";
import { DollarSign, ShoppingCart, Star, Edit, MapPin, Package, AlertTriangle, Snowflake, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function ProductDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [metrics, setMetrics] = useState<ProductMetricsDto | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<"add" | "remove">("add");
  const [stockAmount, setStockAmount] = useState<number>(1);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, metricsData] = await Promise.all([
          getProductById(id),
          getProductMetrics(id)
        ]);
        
        setProduct(prodData);
        setMetrics(metricsData);
      } catch (err: any) {
        toast({ title: "Error al cargar datos", description: err.message, variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(id);
      toast({ title: "Producto eliminado", description: "El producto ha sido eliminado exitosamente", variant: "default" });
      router.push("/dashboard/inventory");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al eliminar el producto", variant: "error" });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleStockUpdate = async () => {
    if (!stockAmount || stockAmount <= 0 || !product) return;
    
    try {
      const newStock = stockActionType === "add" 
        ? product.stockAvailable + stockAmount 
        : Math.max(0, product.stockAvailable - stockAmount);
        
      await updateProduct(id, { stockAvailable: newStock });
      setProduct({ ...product, stockAvailable: newStock });
      toast({ title: "Stock actualizado", description: "El inventario ha sido actualizado correctamente.", variant: "default" });
      setIsStockModalOpen(false);
      setStockAmount(1);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al actualizar el stock", variant: "error" });
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    try {
      const newStatus = !product.isActive;
      await updateProduct(id, { isActive: newStatus });
      setProduct({ ...product, isActive: newStatus });
      toast({ title: newStatus ? "Producto Activo" : "Producto Pausado", description: newStatus ? "El producto ahora es visible en el marketplace." : "El producto ha sido ocultado del marketplace.", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al actualizar estado", variant: "error" });
    }
  };

  if (loading || !product || !metrics) {
    return <div className="p-8 text-center text-muted">Cargando información del producto...</div>;
  }

  const cleanDescription = product.description ? product.description.split('**Proceso de Elaboración:**')[0].trim() : "Sin descripción";
  const elaborationTextMatch = product.description ? product.description.split('**Proceso de Elaboración:**')[1] : null;
  const elaborationText = elaborationTextMatch ? elaborationTextMatch.trim() : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => router.push("/dashboard/inventory")} className="text-muted w-fit -ml-2 mb-2">
          ← Volver
        </Button>
        <DashboardHeader 
          title="Detalle de producto" 
          subtitle="Información y rendimiento"
          action={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleToggleStatus} 
                className={`flex items-center gap-2 shadow-sm transition-colors ${
                  product.isActive 
                    ? "text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600" 
                    : "text-green-600 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600"
                }`}
              >
                {product.isActive ? (
                  <><EyeOff className="w-4 h-4" /> Pausar</>
                ) : (
                  <><Eye className="w-4 h-4" /> Activar</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsStockModalOpen(true)} className="flex items-center gap-2 shadow-sm text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white transition-colors">
                <Package className="w-4 h-4" /> Stock
              </Button>
              <Button variant="outline" onClick={handleDelete} className="flex items-center gap-2 shadow-sm text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
                <Trash2 className="w-4 h-4" /> Eliminar
              </Button>
              <Button variant="primary" onClick={() => router.push(`/dashboard/inventory/${id}/edit`)} className="flex items-center gap-2 shadow-sm">
                <Edit className="w-4 h-4" /> Editar Producto
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Columna Izquierda: Información del Producto */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Información principal - Sin Card ni líneas */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 aspect-square relative rounded-xl overflow-hidden bg-gray-50 border-none shadow-sm">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-muted text-sm">Sin imagen</div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-foreground mb-1">{product.name}</h4>
                <div className="flex gap-2 items-center flex-wrap">
                  {product.category && (
                    <span className="inline-block px-3 py-1 bg-brand-nature-bg text-brand-nature-content text-xs font-semibold rounded-full border-none shadow-sm">
                      {(product.category as any).categoryName || 'Categoría'}
                    </span>
                  )}
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border-none shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border-none shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pausado
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border-none shadow-sm">
                  <p className="text-xs text-muted mb-1 font-medium">Precio (USD)</p>
                  <p className="text-xl font-bold text-brand-primary">${Number(product.price).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border-none shadow-sm">
                  <p className="text-xs text-muted mb-1 font-medium">Stock Disponible</p>
                  <p className="text-xl font-bold text-foreground">{product.stockAvailable} un.</p>
                </div>
              </div>

              <div className="pt-2 flex gap-4 flex-wrap">
                {product.isFragile && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border-none shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" /> Frágil
                  </div>
                )}
                {product.requiresColdChain && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border-none shadow-sm">
                    <Snowflake className="w-3.5 h-3.5" /> Cadena de Frío
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {cleanDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Imágenes de Producto (Adicionales) */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div className="space-y-4 mt-8 animate-in fade-in">
              <h3 className="font-bold text-lg text-foreground">Imágenes del Producto</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {product.imageUrls.map((url, idx) => (
                  <div key={`prod-${idx}`} className="shrink-0 w-36 h-36 relative rounded-2xl overflow-hidden border-none bg-gray-50 shadow-sm">
                    <Image src={url} alt={`Imagen ${idx + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}



        </div>

        {/* Columna Derecha: Métricas Reales */}
        <div className="space-y-4">
          <StatsCard 
            icon={<DollarSign className="w-6 h-6" />} 
            label="Ingresos (Total)" 
            value={`$${metrics.totalRevenue.toFixed(2)}`} 
            variant="highlight"
          />
          <StatsCard 
            icon={<ShoppingCart className="w-6 h-6" />} 
            label="Ventas Concretadas" 
            value={metrics.totalSales.toString()} 
          />
          <StatsCard 
            icon={<Star className="w-6 h-6" />} 
            label="Calificación Promedio" 
            value={`${metrics.averageRating.toFixed(1)} / 5`} 
            subtitle={`${metrics.totalReviews} reseñas publicadas`}
          />
        </div>
      </div>

      {/* Nuevo Bloque: Proceso de Elaboración e Imágenes */}
      {(elaborationText || (product.elaborationMediaUrls && product.elaborationMediaUrls.length > 0)) && (
        <div className="space-y-8 mt-8 pt-4 animate-in fade-in slide-in-from-bottom-3">
          <h3 className="font-bold text-2xl text-brand-nature-content">Proceso de Elaboración</h3>
          
          {elaborationText && (
            <div className="space-y-2">
              <h4 className="font-bold text-lg text-foreground">Descripción</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {elaborationText}
              </p>
            </div>
          )}

          {product.elaborationMediaUrls && product.elaborationMediaUrls.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-foreground">Fotos</h4>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {product.elaborationMediaUrls.map((url, idx) => (
                  <div key={`elab-${idx}`} className="shrink-0 w-36 h-36 relative rounded-2xl overflow-hidden border-none bg-gray-50 shadow-sm group">
                    <Image src={url} alt={`Proceso ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Actualizar Stock"
        description="Agrega o elimina unidades del inventario de este producto."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleStockUpdate}>Confirmar Cambios</Button>
          </>
        }
      >
        <div className="space-y-6 py-4">
          <div className="flex gap-4">
            <button 
              className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${stockActionType === 'add' ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setStockActionType('add')}
            >
              + Agregar
            </button>
            <button 
              className={`flex-1 py-3 px-4 rounded-xl border transition-colors ${stockActionType === 'remove' ? 'bg-red-50 border-red-500 text-red-600 font-bold' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setStockActionType('remove')}
            >
              - Reducir
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Cantidad de unidades</label>
            <input 
              type="number" 
              min="1" 
              className="w-full p-3 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all" 
              value={stockAmount}
              onChange={(e) => setStockAmount(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border-none shadow-sm">
            <span className="text-sm text-gray-600">Stock resultante aproximado:</span>
            <span className="text-lg font-bold text-foreground">
              {stockActionType === 'add' ? (product?.stockAvailable || 0) + stockAmount : Math.max(0, (product?.stockAvailable || 0) - stockAmount)} un.
            </span>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Artesanía"
        description="¿Estás seguro de que deseas eliminar esta artesanía de tu inventario? Esta acción no se puede deshacer y borrará permanentemente toda su información e historial."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Sí, Eliminar Permanentemente</Button>
          </>
        }
      >
        <div className="py-4 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-700 text-sm">
            Si eliminas <strong>{product?.name}</strong> ya no será visible para los compradores en el Marketplace ni podrás gestionar su stock.
          </p>
        </div>
      </Modal>

    </div>
  );
}
