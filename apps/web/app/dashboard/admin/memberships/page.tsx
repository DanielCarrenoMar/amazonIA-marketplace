"use client";

import { useEffect, useState } from "react";
import { getAllTribeMembershipRequests, reviewTribeMembershipAsAdmin } from "@/lib/api";
import type { TribeMembershipRequestResponseDto } from "event-types";
import { MembershipRequestStatus } from "event-types/enums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Calendar, MessageSquare, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AdminMembershipsPage() {
  const [requests, setRequests] = useState<TribeMembershipRequestResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // By default get PENDING
      const res = await getAllTribeMembershipRequests(new URLSearchParams({ status: "PENDING" }));
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

  const handleReview = async (id: number, status: MembershipRequestStatus.APPROVED | MembershipRequestStatus.REJECTED) => {
    try {
      await reviewTribeMembershipAsAdmin(id, { status, reviewNote: "Aprobado por Admin Global" });
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(status === MembershipRequestStatus.APPROVED ? "Membresía aprobada exitosamente" : "Membresía rechazada");
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar la membresía");
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando membresías pendientes...</div>;
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-outfit text-muted">
          Solicitudes de Membresía Pendientes ({requests.length})
        </h2>

        {requests.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed">
            <p className="text-muted">No hay solicitudes de membresía pendientes en ninguna tribu.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map(req => (
              <Card key={req.id} className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-brand-primary/10 text-brand-primary rounded-bl-xl font-medium text-xs">
                  Global Admin View
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold font-outfit text-foreground">
                    Tribu: {(req as any).tribe?.name || `ID ${req.tribeId}`}
                  </h3>
                  <p className="text-sm text-muted">Solicitud de membresía #{req.id}</p>
                </div>

                <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center shrink-0 text-brand-primary font-bold">
                      {req.seller?.user?.avatarUrl ? (
                        <img src={req.seller.user.avatarUrl} alt={req.seller.user.fullName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        req.seller?.user?.fullName?.charAt(0) || <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{req.seller?.user?.fullName || 'Usuario Desconocido'}</p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {req.seller?.user?.locationFormattedAddress || 'Sin ubicación'}
                      </p>
                    </div>
                  </div>

                  {req.message && (
                    <div className="pt-2">
                      <div className="flex items-start gap-2 text-sm text-foreground bg-white p-3 rounded-lg border border-gray-200">
                        <MessageSquare className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                        <p className="italic">"{req.message}"</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted pt-2 border-t border-gray-200">
                    <Calendar className="w-3 h-3" /> 
                    Solicitado el {new Date(req.createdAt).toLocaleDateString()} a las {new Date(req.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-gray-200"
                    onClick={() => handleReview(req.id, MembershipRequestStatus.REJECTED)}
                  >
                    Rechazar Global
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleReview(req.id, MembershipRequestStatus.APPROVED)}
                  >
                    Aprobar Global
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
