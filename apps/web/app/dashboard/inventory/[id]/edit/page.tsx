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
import { getProductById, updateProduct, getCategories, uploadProductImage, deleteProductImage } from "@/lib/api";
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
  const [imageFile, setImageFile] = useState<File | null>(null);

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
        setDescription(prodData.description || "");

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
        description
      });

      if (imageFile) {
        await uploadProductImage(id, imageFile);
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
    if (!confirm("¿Seguro que deseas eliminar la imagen del producto?")) return;
    setSaving(true);
    try {
      const updated = await deleteProductImage(id);
      setProduct(updated);
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
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/inventory/${id}`)} className="text-muted">
          ← Volver al Detalle
        </Button>
        <DashboardHeader 
          title={`Editar: ${product.name}`} 
          subtitle="Modifica la información de tu artesanía"
        />
      </div>

      <Card padding="lg" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 border border-border shadow-sm">
        <h3 className="text-xl font-outfit font-bold">Datos del Producto</h3>
        
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

        <div className="space-y-4 pt-4 border-t border-border mt-6">
          <h4 className="font-semibold text-foreground text-lg">Imagen del Producto</h4>
          
          {product.imageUrl ? (
            <div className="flex items-start gap-6 bg-gray-50 p-4 rounded-xl border border-border">
              <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded-lg shadow-sm" />
              <div className="space-y-3 flex-1">
                <p className="text-sm text-muted">Esta es la foto principal de tu producto. Para cambiarla, sube una nueva imagen abajo o elimínala si no deseas tener imagen.</p>
                <Button variant="danger" onClick={handleDeleteImage} disabled={saving} className="text-xs py-1.5 px-3">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar imagen actual
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No hay imagen asignada a este producto.</p>
          )}

          <div className="mt-4">
            <FileDrop 
              label={product.imageUrl ? "Subir nueva imagen (reemplazará la actual)" : "Subir Foto Principal"} 
              accept="image/*" 
              maxSizeMB={5}
              onFilesChanged={files => setImageFile(files[0] || null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
          <Button variant="ghost" onClick={() => router.push(`/dashboard/inventory/${id}`)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={saving}>
            Guardar Cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}
