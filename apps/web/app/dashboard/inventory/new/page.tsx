"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardHeader, ProductWizard } from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileDrop } from "@/components/ui/FileDrop";
import { Switch } from "@/components/ui/Switch";
import { getCategories, createProduct, uploadProductImage, uploadElaborationImages } from "@/lib/api";
import type { ProductCategoryResponseDto, GroupedCategoryResponseDto } from "event-types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { MapPin } from "lucide-react";
import { Icon } from "@iconify/react";

const wizardSteps = [
  { id: 'identidad', label: 'Identidad', title: 'Nombre, precio y stock', icon: 'lucide:tag' },
  { id: 'territorio', label: 'Territorio', title: 'Categoría y Ubicación', icon: 'lucide:map-pin' },
  { id: 'historia', label: 'Historia', title: 'Historia, Visuales y Logística', icon: 'lucide:feather' },
  { id: 'elaboracion', label: 'Elaboración', title: 'Proceso de Elaboración', icon: 'lucide:hammer' },
  { id: 'verificar', label: 'Verificar', title: 'Verificar y Publicar', icon: 'lucide:shield-check' }
];

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<GroupedCategoryResponseDto[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [elaborationSteps, setElaborationSteps] = useState("");
  const [elaborationImages, setElaborationImages] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Logistics State
  const [isFragile, setIsFragile] = useState(false);
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [maxTemperatureCelsius, setMaxTemperatureCelsius] = useState("");
  const [maxHumidity, setMaxHumidity] = useState("");

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Object URLs for the "verificar" preview step — created once per file list
  // (not on every render) and revoked when the list changes or on unmount.
  const imagePreviewUrls = useMemo(() => imageFiles.map(f => URL.createObjectURL(f)), [imageFiles]);
  const elaborationPreviewUrls = useMemo(() => elaborationImages.map(f => URL.createObjectURL(f)), [elaborationImages]);

  useEffect(() => {
    return () => { imagePreviewUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [imagePreviewUrls]);

  useEffect(() => {
    return () => { elaborationPreviewUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [elaborationPreviewUrls]);

  const handleSubmit = async () => {
    if (!name || !price || !categoryId || !description || !stock) {
      toast({ title: "Faltan datos", description: "Completa todos los campos obligatorios.", variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        name,
        description,
        elaborationText: elaborationSteps || undefined,
        price: parseFloat(price),
        stockAvailable: parseInt(stock),
        categoryId: parseInt(categoryId),
        isFragile,
        requiresColdChain,
      };

      if (requiresColdChain && maxTemperatureCelsius) {
        payload.maxTemperatureCelsius = parseFloat(maxTemperatureCelsius);
      }
      if (requiresColdChain && maxHumidity) {
        payload.maxHumidity = parseFloat(maxHumidity);
      }

      const prod = await createProduct(payload);

      if (imageFiles.length > 0) {
        await uploadProductImage(prod.id, imageFiles);
      }

      if (elaborationImages.length > 0) {
        await uploadElaborationImages(prod.id, elaborationImages);
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
    <div className="max-w-5xl mx-auto space-y-8">
      <DashboardHeader
        title="Nueva Artesanía"
        subtitle={`Paso ${step + 1} de ${wizardSteps.length} — ${wizardSteps[step].title}`}
      />

      <ProductWizard
        steps={wizardSteps}
        currentStep={step}
      />

      <div className="pb-12">
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <Input
              label="NOMBRE DE LA OBRA:"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. Collar Wayúu bordado en algodón"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="PRECIO ($ USD):"
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
              <Input
                label="STOCK DISPONIBLE (UNIDADES):"
                type="number"
                min="1"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="1"
                required
              />
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
              options={categories.flatMap(cat =>
                cat.subcategories.map(sub => ({
                  value: sub.id.toString(),
                  label: sub.subcategoryName ? `${cat.categoryName} - ${sub.subcategoryName}` : cat.categoryName
                }))
              )}
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
              label="Fotos de la Artesanía (Máximo 4)"
              accept="image/*"
              maxSizeMB={5}
              multiple={true}
              maxFiles={4}
              initialFiles={imageFiles}
              onFilesChanged={files => setImageFiles(files)}
            />

            <h3 className="text-xl font-outfit font-bold mt-8">Logística y Cuidados</h3>
            <div className="space-y-4">
              <Switch
                label="Producto Frágil"
                description="Requiere embalaje y manejo especial durante el transporte."
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
              />
              <Switch
                label="Requiere Cadena de Frío"
                description="El producto debe mantenerse a temperatura controlada."
                checked={requiresColdChain}
                onChange={(e) => setRequiresColdChain(e.target.checked)}
              />

              {requiresColdChain && (
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <Input
                    label="Temp. Máxima (°C)"
                    type="number"
                    step="0.1"
                    value={maxTemperatureCelsius}
                    onChange={e => setMaxTemperatureCelsius(e.target.value)}
                    placeholder="Ej. 8"
                  />
                  <Input
                    label="Humedad Máx. (%)"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxHumidity}
                    onChange={e => setMaxHumidity(e.target.value)}
                    placeholder="Ej. 60"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Proceso de Elaboración</h3>
            <Textarea
              label="Pasos de elaboración (Opcional)"
              value={elaborationSteps}
              onChange={e => setElaborationSteps(e.target.value)}
              placeholder="Describe paso a paso cómo elaboras esta artesanía (materiales, técnicas, tiempo)..."
              rows={6}
            />
            <FileDrop
              label="Fotos del proceso (Opcional)"
              accept="image/*"
              maxSizeMB={5}
              multiple={true}
              maxFiles={20}
              initialFiles={elaborationImages}
              onFilesChanged={files => setElaborationImages(files)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-outfit font-bold">Verificar y Publicar</h3>
            <div className="bg-gray-50 p-6 rounded-xl space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-3">
                  <p><strong>Nombre:</strong> {name}</p>
                  
                  <div className="py-1">
                    <p className="font-semibold text-gray-900 mb-1">Descripción:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{description || "Sin descripción"}</p>
                  </div>

                  <p><strong>Precio:</strong> ${price}</p>
                  <p><strong>Stock:</strong> {stock}</p>
                  <p><strong>Frágil:</strong> {isFragile ? 'Sí' : 'No'}</p>
                  <p><strong>Cadena de Frío:</strong> {requiresColdChain ? 'Sí' : 'No'} {requiresColdChain && maxTemperatureCelsius ? `(Máx. ${maxTemperatureCelsius}°C)` : ''}</p>
                  {!imageFiles.length && <p className="pt-2 border-t border-gray-100 mt-2"><strong>Foto:</strong> No hay foto</p>}
                </div>
                {imageFiles.length > 0 && (
                  <div className="w-full md:w-1/3 grid grid-cols-2 gap-2 content-start h-fit">
                    {imagePreviewUrls.map((url, i) => (
                      <img key={i} src={url} alt={`Preview ${i + 1}`} className="w-full h-32 rounded-lg object-cover shadow-sm" />
                    ))}
                  </div>
                )}
              </div>

              {elaborationSteps && (
                <div className="pt-4 border-t border-gray-100 mt-6 space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Proceso de Elaboración:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{elaborationSteps}</p>
                  </div>
                </div>
              )}

              {elaborationImages.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p><strong>Fotos de Elaboración ({elaborationImages.length}):</strong></p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {elaborationPreviewUrls.map((url, i) => (
                      <img key={i} src={url} alt={`Elaboración ${i + 1}`} className="w-full h-32 rounded-lg object-cover shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-end pt-6">
          {step > 0 && (
            <Button variant="ghost" className="mr-auto" onClick={() => setStep(s => Math.max(0, s - 1))}>
              Anterior
            </Button>
          )}

          {step < 4 ? (
            <Button
              className="bg-brand-accent hover:bg-[#f59e0b] text-white font-bold rounded-full px-6 flex items-center gap-2"
              onClick={() => setStep(s => Math.min(4, s + 1))}
            >
              Siguiente: {wizardSteps[step + 1].label}
              <Icon icon="lucide:chevron-right" className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              className="bg-[#10b981] hover:bg-brand-primary text-white font-bold rounded-full px-6 flex items-center gap-2"
              onClick={handleSubmit}
              isLoading={loading}
            >
              Publicar Artesanía
              <Icon icon="lucide:check" className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
