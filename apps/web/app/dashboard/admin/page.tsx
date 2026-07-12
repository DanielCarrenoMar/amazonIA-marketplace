"use client";

import { useEffect, useState } from "react";
import { getPendingTribeCreations, reviewTribeCreation } from "@/lib/api";
import type { TribeResponseDto } from "event-types";
import { TribeStatus } from "event-types/enums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, User, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<TribeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await getPendingTribeCreations();
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (id: number, status: TribeStatus.ACTIVE | TribeStatus.REJECTED) => {
    try {
      await reviewTribeCreation(id, { status });
      // Remove from list or reload
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(status === TribeStatus.ACTIVE ? "Tribu aprobada exitosamente" : "Tribu rechazada");
    } catch (err) {
      console.error(err);
      toast.error("Error al revisar la solicitud");
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-outfit font-bold">Administración de Tribus</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-outfit text-muted">
          Solicitudes Pendientes ({requests.length})
        </h2>

        {requests.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed">
            <p className="text-muted">No hay solicitudes de creación pendientes.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map(req => (
              <Card key={req.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-outfit">{req.name}</h3>
                    <p className="text-sm text-muted">ID Solicitud: #{req.id}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Pendiente
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {req.description && (
                    <p className="text-sm text-foreground bg-gray-50 p-3 rounded-lg border">
                      "{req.description}"
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <User className="w-4 h-4" /> Solicitante: {req.requestedById}
                  </div>
                  {req.locationFormattedAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <MapPin className="w-4 h-4" /> {req.locationFormattedAddress}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="w-4 h-4" /> Solicitado el {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-gray-200"
                    onClick={() => handleReview(req.id, TribeStatus.REJECTED)}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleReview(req.id, TribeStatus.ACTIVE)}
                  >
                    Aprobar Creación
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
