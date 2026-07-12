"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requestTribeCreation } from "@/lib/api";

export default function CreateTribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    locationFormattedAddress: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await requestTribeCreation(formData);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Error al solicitar la creación de la tribu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/onboarding" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <Card className="p-8">
        <h1 className="text-3xl font-outfit font-bold mb-2">Solicitar Nueva Tribu</h1>
        <p className="text-muted mb-8">
          Completa los datos de la tribu que deseas crear. Un administrador revisará tu solicitud.
        </p>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nombre de la Tribu *</label>
            <Input 
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              placeholder="Ej. Artesanos del Amazonas"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Descripción (Opcional)</label>
            <textarea 
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              placeholder="Describe el propósito y valores de la tribu..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Ubicación / Comunidad (Opcional)</label>
            <Input 
              value={formData.locationFormattedAddress}
              onChange={(e) => setFormData(prev => ({...prev, locationFormattedAddress: e.target.value}))}
              placeholder="Ej. Comunidad San Francisco, Loreto"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
