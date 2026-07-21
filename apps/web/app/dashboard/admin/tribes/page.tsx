"use client";

import { useEffect, useState } from "react";
import { getPendingTribeCreations, reviewTribeCreation, getActiveTribes, createTribeDirect, updateTribeDirect, deleteTribeDirect } from "@/lib/api";
import type { TribeResponseDto } from "event-types";
import { TribeStatus } from "event-types/enums";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MapPin, User, Calendar, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface TribeFormState {
  id: number | null; // null => creando una nueva
  name: string;
  description: string;
}

const EMPTY_TRIBE_FORM: TribeFormState = { id: null, name: "", description: "" };

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<TribeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTribes, setActiveTribes] = useState<TribeResponseDto[]>([]);
  const [loadingTribes, setLoadingTribes] = useState(true);
  const [tribeModalOpen, setTribeModalOpen] = useState(false);
  const [tribeForm, setTribeForm] = useState<TribeFormState>(EMPTY_TRIBE_FORM);
  const [submittingTribe, setSubmittingTribe] = useState(false);
  const [deletingTribeId, setDeletingTribeId] = useState<number | null>(null);

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

  const loadActiveTribes = async () => {
    setLoadingTribes(true);
    try {
      const res = await getActiveTribes(new URLSearchParams({ limit: "100" }));
      setActiveTribes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTribes(false);
    }
  };

  useEffect(() => {
    loadRequests();
    loadActiveTribes();
  }, []);

  const handleReview = async (id: number, status: TribeStatus.ACTIVE | TribeStatus.REJECTED) => {
    try {
      await reviewTribeCreation(id, { status });
      // Remove from list or reload
      setRequests(prev => prev.filter(r => r.id !== id));
      toast.success(status === TribeStatus.ACTIVE ? "Tribu aprobada exitosamente" : "Tribu rechazada");
      if (status === TribeStatus.ACTIVE) loadActiveTribes();
    } catch (err) {
      console.error(err);
      toast.error("Error al revisar la solicitud");
    }
  };

  const openCreateTribeModal = () => {
    setTribeForm(EMPTY_TRIBE_FORM);
    setTribeModalOpen(true);
  };

  const openEditTribeModal = (tribe: TribeResponseDto) => {
    setTribeForm({ id: tribe.id, name: tribe.name, description: tribe.description || "" });
    setTribeModalOpen(true);
  };

  const handleSubmitTribe = async () => {
    if (!tribeForm.name.trim()) {
      toast.error("El nombre de la tribu es obligatorio");
      return;
    }
    setSubmittingTribe(true);
    try {
      const payload = {
        name: tribeForm.name.trim(),
        description: tribeForm.description.trim() || undefined,
      };
      if (tribeForm.id === null) {
        await createTribeDirect(payload);
        toast.success("Tribu creada exitosamente");
      } else {
        await updateTribeDirect(tribeForm.id, payload);
        toast.success("Tribu actualizada");
      }
      setTribeModalOpen(false);
      await loadActiveTribes();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la tribu");
    } finally {
      setSubmittingTribe(false);
    }
  };

  const handleDeleteTribe = async (tribe: TribeResponseDto) => {
    const confirmed = window.confirm(`¿Eliminar la tribu "${tribe.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingTribeId(tribe.id);
    try {
      await deleteTribeDirect(tribe.id);
      toast.success("Tribu eliminada");
      setActiveTribes(prev => prev.filter(t => t.id !== tribe.id));
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la tribu");
    } finally {
      setDeletingTribeId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6 pt-4">

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-outfit text-muted">
            Tribus Activas ({activeTribes.length})
          </h2>
          <Button variant="primary" onClick={openCreateTribeModal}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Tribu
          </Button>
        </div>

        {loadingTribes ? (
          <div className="animate-pulse">Cargando tribus...</div>
        ) : activeTribes.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50/50 border-dashed">
            <p className="text-muted">No hay tribus activas.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTribes.map(tribe => (
              <Card key={tribe.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-primary" /> {tribe.name}
                    </h3>
                    <p className="text-sm text-muted">ID: #{tribe.id}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Activa
                  </span>
                </div>

                {tribe.description && (
                  <p className="text-sm text-foreground bg-gray-50 p-3 rounded-lg border mb-4">
                    {tribe.description}
                  </p>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEditTribeModal(tribe)}
                  >
                    <Pencil className="w-4 h-4 mr-1.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-gray-200"
                    disabled={deletingTribeId === tribe.id}
                    onClick={() => handleDeleteTribe(tribe)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={tribeModalOpen}
        onClose={() => setTribeModalOpen(false)}
        title={tribeForm.id === null ? "Nueva Tribu" : "Editar Tribu"}
        footer={
          <>
            <Button variant="outline" onClick={() => setTribeModalOpen(false)} disabled={submittingTribe}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmitTribe} disabled={submittingTribe}>
              {tribeForm.id === null ? "Crear" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la tribu *"
            value={tribeForm.name}
            onChange={e => setTribeForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej. Tejedores del Amazonas"
          />
          <Textarea
            label="Descripción (opcional)"
            value={tribeForm.description}
            onChange={e => setTribeForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Breve descripción de la tribu"
          />
        </div>
      </Modal>
    </div>
  );
}
