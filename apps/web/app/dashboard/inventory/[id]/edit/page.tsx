"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { getProductById, updateProduct, getCategories, uploadProductImage, deleteProductImage, uploadElaborationImages, deleteElaborationImage } from "@/lib/api";
import type { ProductResponseDto, GroupedCategoryResponseDto } from "event-types";
import { Trash2 } from "lucide-react";
import { FileDrop } from "@/components/ui/FileDrop";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [categories, setCategories] = useState<GroupedCategoryResponseDto[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [elaborationText, setElaborationText] = useState("");
  const [elaborationImages, setElaborationImages] = useState<File[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [elaborationMedia, setElaborationMedia] = useState<string[]>([]);
  const [draggedProductIdx, setDraggedProductIdx] = useState<number | null>(null);
  const [draggedElabIdx, setDraggedElabIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, catsData] = await Promise.all([
          getProductById(id),
          getCategories()
        ]);

        setProduct(prodData);
        setCategories(catsData);

        // Init form
        setName(prodData.name);
        setPrice(prodData.price.toString());
        setStock(prodData.stockAvailable.toString());
        setCategoryId(prodData.categoryId.toString());
        let initDesc = prodData.description || "";
        let initElab = prodData.elaborationText || "";

        const splitRegex = /\*\*?Proceso de Elaboraci[oó]n:\*\*?/i;
        if (!initElab && splitRegex.test(initDesc)) {
          const parts = initDesc.split(splitRegex);
          initDesc = parts[0].trim();
          initElab = parts[1].trim();
        }

        setDescription(initDesc);
        setElaborationText(initElab);
        
        setProductImages(Array.from(new Set([prodData.imageUrl, ...(prodData.imageUrls || [])].filter(Boolean))) as string[]);
        setElaborationMedia(prodData.elaborationMediaUrls || []);

      } catch (err: any) {
        toast({ title: "Error al cargar datos", description: err.message, variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  const handleUpdate = async () => {
    if (!name || !price || !categoryId || !stock) {
      toast({ title: "Faltan datos obligatorios", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      await updateProduct(id, {
        name,
        price: parseFloat(price),
        stockAvailable: parseInt(stock),
        categoryId: parseInt(categoryId),
        description,
        elaborationText,
        imageUrl: productImages.length > 0 ? productImages[0] : undefined,
        imageUrls: productImages,
        elaborationMediaUrls: elaborationMedia
      });

      if (imageFiles.length > 0) {
        await uploadProductImage(id, imageFiles);
      }

      if (elaborationImages.length > 0) {
        await uploadElaborationImages(id, elaborationImages);
      }

      toast({ title: "Producto actualizado con éxito", variant: "success" });
      router.push(`/dashboard/inventory/${id}`);
    } catch (err: any) {
      toast({ title: "Error al actualizar", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    setSaving(true);
    try {
      await deleteProductImage(id);
      setProduct(p => p ? { ...p, imageUrl: null, imageUrls: [] } : null);
      setProductImages([]);
      toast({ title: "Imágenes eliminadas", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error al eliminar imágenes", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecificImage = async (url: string) => {
    setSaving(true);
    try {
      const updated = await deleteProductImage(id, url);
      setProduct(updated);
      setProductImages(Array.from(new Set([updated.imageUrl, ...(updated.imageUrls || [])].filter(Boolean))) as string[]);
      toast({ title: "Imagen eliminada", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error al eliminar imagen", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteElaborationImage = async (url: string) => {
    setSaving(true);
    try {
      const updated = await deleteElaborationImage(id, url);
      setProduct(updated);
      setElaborationMedia(updated.elaborationMediaUrls || []);
      toast({ title: "Imagen eliminada", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error al eliminar imagen", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return <div className="p-8 text-center text-muted">Cargando formulario de edición...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/inventory/${id}`)} className="text-muted w-fit -ml-2 mb-2">
          ← Volver al Detalle
        </Button>
        <DashboardHeader
          title={`Editar: ${product.name}`}
          subtitle="Modifica la información de tu artesanía"
        />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
        
        {/* SECCIÓN 1: DATOS DEL PRODUCTO */}
        <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Datos del Producto</h3>
          <div className="flex flex-col md:flex-row gap-x-12 gap-y-8">
            
            {/* Imágenes del Producto */}
            <div className="w-full md:w-1/3 space-y-6">

              {(() => {
                return productImages.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 content-start">
                      {productImages.map((url, i) => (
                        <div 
                          key={i} 
                          className={`relative group cursor-move transition-transform ${draggedProductIdx === i ? 'scale-95 opacity-50' : 'hover:scale-[1.02]'}`}
                          draggable
                          onDragStart={() => setDraggedProductIdx(i)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            if (draggedProductIdx === null || draggedProductIdx === i) return;
                            const newArr = [...productImages];
                            const [draggedItem] = newArr.splice(draggedProductIdx, 1);
                            newArr.splice(i, 0, draggedItem);
                            setProductImages(newArr);
                            setDraggedProductIdx(null);
                          }}
                        >
                          {i === 0 && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full z-10 shadow-sm font-bold">
                              Principal
                            </div>
                          )}
                          <img src={url} alt={`Imagen ${i+1}`} className="w-full h-32 object-cover rounded-lg shadow-sm pointer-events-none" />
                          <button 
                            type="button" 
                            onClick={() => handleDeleteSpecificImage(url)} 
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-muted">Arrastra las imágenes para reordenarlas. La primera será la principal.</p>
                      <Button variant="danger" onClick={handleDeleteImage} disabled={saving} className="w-full text-xs py-2">
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar todas las imágenes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-muted text-sm border-none shadow-sm">
                    Sin imágenes
                  </div>
                );
              })()}

              <div className="pt-2">
                <FileDrop
                  label={(product.imageUrl || (product.imageUrls && product.imageUrls.length > 0)) ? "Sube fotos nuevas (máx 4)" : "Sube Fotos de la Artesanía (Máx 4)"}
                  accept="image/*"
                  maxSizeMB={5}
                  multiple={true}
                  maxFiles={4}
                  onFilesChanged={files => setImageFiles(files)}
                />
              </div>

            </div>

            {/* Formulario Principal */}
            <div className="flex-1 space-y-6">
              <div className="space-y-6">
                <Input
                  label="Nombre de la obra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Precio ($ USD)"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                  <Input
                    label="Stock disponible"
                    type="number"
                    min="0"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    required
                  />
                </div>

                <Select
                  label="Categoría / Técnica"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.flatMap(cat =>
                    cat.subcategories.map(sub => ({
                      value: sub.id.toString(),
                      label: sub.subcategoryName ? `${cat.categoryName} - ${sub.subcategoryName}` : cat.categoryName
                    }))
                  )}
                  required
                />

                <Textarea
                  label="Historia / Descripción"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: PROCESO DE ELABORACIÓN */}
      <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-foreground">Proceso de Elaboración</h3>
        
        <Textarea
          label="Describe el proceso (Opcional)"
          value={elaborationText}
          onChange={e => setElaborationText(e.target.value)}
          rows={4}
        />

        <div className="pt-2">
          {(() => {
            return elaborationMedia.length > 0 ? (
              <div className="flex flex-col gap-4 mb-6">
                <p className="text-xs text-muted mb-[-8px]">Arrastra las imágenes para reordenarlas.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {elaborationMedia.map((url, i) => (
                    <div 
                      key={i} 
                      className={`relative group cursor-move transition-transform ${draggedElabIdx === i ? 'scale-95 opacity-50' : 'hover:scale-[1.02]'}`}
                      draggable
                      onDragStart={() => setDraggedElabIdx(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (draggedElabIdx === null || draggedElabIdx === i) return;
                        const newArr = [...elaborationMedia];
                        const [draggedItem] = newArr.splice(draggedElabIdx, 1);
                        newArr.splice(i, 0, draggedItem);
                        setElaborationMedia(newArr);
                        setDraggedElabIdx(null);
                      }}
                    >
                      <img src={url} alt={`Proceso ${i + 1}`} className="w-full h-32 object-cover rounded-lg shadow-sm pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => handleDeleteElaborationImage(url)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <FileDrop
            label="Fotos del proceso (no reemplazan, máx 4)"
            accept="image/*"
            maxSizeMB={5}
            multiple={true}
            maxFiles={4}
            onFilesChanged={files => setElaborationImages(files)}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/inventory/${id}`)} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleUpdate} isLoading={saving}>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
