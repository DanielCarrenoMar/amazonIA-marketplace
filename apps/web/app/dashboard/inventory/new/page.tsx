"use client";

import { useState, useEffect } from "react";
import { DashboardHeader, ProductWizard } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileDrop } from "@/components/ui/FileDrop";
import { Card } from "@/components/ui/Card";
import { getCategories, createProduct, uploadProductImage } from "@/lib/api";
import { ProductCategoryResponseDto } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { MapPin } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProductCategoryResponseDto[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!name || !price || !categoryId || !description || !stock) {
      toast({ title: "Faltan datos", description: "Completa todos los campos obligatorios.", variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const prod = await createProduct({
        name,
        description,
        price: parseFloat(price),
        stockAvailable: parseInt(stock),
        categoryId: parseInt(categoryId)
      });
      
      if (imageFile) {
        await uploadProductImage(prod.id, imageFile);
      }

      toast({ title: "Artesanía creada", variant: "success" });
      router.push("/dashboard/inventory");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <DashboardHeader title="Nueva Artesanía" subtitle="Publica tu obra en el mundo" />
      
      <ProductWizard 
        steps={['Identidad', 'Territorio', 'Historia', 'Verificar']}
        currentStep={step}
      />

      <Card padding="lg">
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Identidad de la Obra</h3>
            <Input label="Nombre de la obra" value={name} onChange={e => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Precio ($ USD)" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              <Input label="Stock disponible" type="number" min="1" value={stock} onChange={e => setStock(e.target.value)} required />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Territorio y Comunidad</h3>
            <Select 
              label="Categoría / Técnica" 
              value={categoryId} 
              onChange={setCategoryId}
              options={categories.map(c => ({ value: c.id.toString(), label: c.categoryName }))}
              required 
            />
            
            <div className="p-6 bg-brand-nature-bg border border-brand-primary-light rounded-xl flex items-center justify-center flex-col gap-3 text-brand-nature-content text-center">
               <div className="p-3 bg-brand-primary text-white rounded-full">
                 <MapPin className="w-6 h-6" />
               </div>
               <p className="font-semibold">La ubicación se tomará de tu perfil de vendedor.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Historia y Visuales</h3>
            <Textarea 
              label="Historia / Descripción" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuenta la historia detrás de esta artesanía..."
              rows={4}
              required 
            />
            <FileDrop 
              label="Foto Principal" 
              accept="image/*" 
              maxSizeMB={5}
              onFilesChanged={files => setImageFile(files[0] || null)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Verificar y Publicar</h3>
            <div className="bg-gray-50 p-6 rounded-xl space-y-3">
              <p><strong>Nombre:</strong> {name}</p>
              <p><strong>Precio:</strong> ${price}</p>
              <p><strong>Stock:</strong> {stock}</p>
              <p><strong>Foto:</strong> {imageFile ? imageFile.name : 'No hay foto'}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
            Anterior
          </Button>
          
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(s => Math.min(3, s + 1))}>
              Siguiente
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
              Publicar Artesanía
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
