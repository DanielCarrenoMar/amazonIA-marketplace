"use client";

import { useEffect, useState } from "react";
import { getMyTribe, getTribeMembershipRequests, reviewTribeMembership } from "@/lib/api";
import type { TribeResponseDto, TribeMembershipRequestResponseDto } from "event-types";
import { MembershipRequestStatus } from "event-types/enums";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, MapPin, UserCheck, UserX, User } from "lucide-react";

export default function MyTribePage() {
  const { isLeader, user } = useAuth();
  const [tribe, setTribe] = useState<TribeResponseDto | null>(null);
  const [requests, setRequests] = useState<TribeMembershipRequestResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const tribeRes = await getMyTribe();
      setTribe(tribeRes);

      if (isLeader && tribeRes) {
        const reqs = await getTribeMembershipRequests(tribeRes.id, new URLSearchParams({ status: "PENDING" }));
        setRequests(reqs.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isLeader]);

  const handleReview = async (requestId: number, status: MembershipRequestStatus.APPROVED | MembershipRequestStatus.REJECTED) => {
    if (!tribe) return;
    try {
      await reviewTribeMembership(tribe.id, requestId, { status });
      // Remove from pending list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error(err);
      alert("Error al revisar la solicitud");
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando datos de la tribu...</div>;
  }

  if (!tribe) {
    return (
      <Card className="p-8 text-center bg-gray-50/50 border-dashed">
        <p className="text-muted">No perteneces a ninguna tribu actualmente.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header de la Tribu */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-outfit font-bold mb-2">{tribe.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Tribu Activa</span>
            {tribe.locationFormattedAddress && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tribe.locationFormattedAddress}</span>
            )}
          </div>
        </div>
        {isLeader && (
          <span className="bg-brand-primary/10 text-brand-primary font-bold px-4 py-2 rounded-xl">
            Líder de Tribu
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Info y Miembros */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold font-outfit mb-4">Acerca de nosotros</h2>
            <p className="text-foreground leading-relaxed">
              {tribe.description || "Esta tribu aún no ha agregado una descripción."}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold font-outfit mb-4">Líderes</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {tribe.primaryLeaderId === user?.id ? "Tú" : "Líder Principal"}
                </p>
                <p className="text-sm text-muted">ID: {tribe.primaryLeaderId}</p>
              </div>
            </div>
            
            {/* Si existieran más miembros se listarían aquí, por ahora el backend en getMyTribe no retorna los miembros detallados */}
          </Card>
        </div>

        {/* Columna Derecha: Solicitudes (Solo si es líder) */}
        {isLeader && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-outfit">Solicitudes de Ingreso ({requests.length})</h2>
            
            {requests.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <p className="text-sm text-muted">No hay solicitudes pendientes.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <Card key={req.id} className="p-5 border-l-4 border-l-amber-400">
                    <p className="font-bold text-sm mb-1">Usuario: {req.sellerId}</p>
                    <p className="text-xs text-muted mb-3">
                      Hace {Math.floor((new Date().getTime() - new Date(req.createdAt).getTime()) / (1000 * 3600 * 24))} días
                    </p>
                    
                    {req.message && (
                      <p className="text-sm bg-gray-50 p-2 rounded mb-4 italic">
                        "{req.message}"
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReview(req.id, MembershipRequestStatus.REJECTED)}
                      >
                        <UserX className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReview(req.id, MembershipRequestStatus.APPROVED)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Aprobar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
