"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { getActiveTribes, requestTribeMembership } from "@/lib/api";
import { TribeResponseDto } from "@/lib/types";

export default function JoinTribePage() {
  const [tribes, setTribes] = useState<TribeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTribe, setSelectedTribe] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getActiveTribes()
      .then(res => setTribes(res.data))
      .catch(err => console.error("Failed to load tribes", err))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTribe) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await requestTribeMembership(selectedTribe, { message });
      setSuccess("¡Solicitud enviada correctamente! El líder de la tribu la revisará pronto.");
      setSelectedTribe(null);
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/onboarding" className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-outfit font-bold mb-2">Tribus Activas</h1>
        <p className="text-muted">Encuentra una tribu en tu región y solicita unirte.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando tribus...</div>
      ) : tribes.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50/50 border-dashed">
          <p className="text-muted">No hay tribus activas por el momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tribes.map((tribe) => (
            <Card key={tribe.id} className="p-6 flex flex-col">
              <h3 className="text-xl font-bold font-outfit mb-2">{tribe.name}</h3>
              {tribe.description && (
                <p className="text-muted text-sm mb-4 line-clamp-2">{tribe.description}</p>
              )}
              
              <div className="space-y-2 mt-auto mb-6 text-sm text-muted">
                {tribe.locationFormattedAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {tribe.locationFormattedAddress}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {/* Ideally we would have a member count, for now just an icon */}
                  Tribu Activa
                </div>
              </div>

              {selectedTribe === tribe.id ? (
                <form onSubmit={handleRequest} className="space-y-4 bg-gray-50 p-4 rounded-xl -mx-2 -mb-2">
                  <textarea
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[80px]"
                    placeholder="Escribe un mensaje al líder (opcional)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => setSelectedTribe(null)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                  onClick={() => setSelectedTribe(tribe.id)}
                >
                  Solicitar unirse
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
