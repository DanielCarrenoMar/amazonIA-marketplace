"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getShippingCarriers } from "@/lib/api";
import type { ShippingCarrierResponseDto } from "event-types";
import { Truck } from "lucide-react";

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { trackingNumber: string; carrierId: number; sensorId?: string }) => void;
  isLoading?: boolean;
}

export function ShipmentModal({ isOpen, onClose, onSubmit, isLoading }: ShipmentModalProps) {
  const [carriers, setCarriers] = useState<ShippingCarrierResponseDto[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [sensorId, setSensorId] = useState("");

  useEffect(() => {
    if (isOpen) {
      getShippingCarriers().then(setCarriers).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber || !carrierId) return;
    
    onSubmit({
      trackingNumber,
      carrierId: parseInt(carrierId),
      sensorId: sensorId || undefined
    });
  };

  const carrierOptions = carriers.map(c => ({ value: c.id.toString(), label: c.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Marcar como Enviado"
      description="Ingresa los datos logísticos para que el comprador pueda hacer seguimiento."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Número de Seguimiento (Tracking)"
          placeholder="Ej: TRK-98237492"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          required
        />
        
        <Select
          label="Empresa de Transporte"
          options={carrierOptions}
          value={carrierId}
          onChange={setCarrierId}
          placeholder="Selecciona el transportista"
          required
        />

        <div className="p-4 bg-brand-nature-bg rounded-xl border border-brand-primary-light">
          <h4 className="text-sm font-semibold text-brand-nature-content mb-2 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Integración IoT (Opcional)
          </h4>
          <Input
            placeholder="ID del Sensor (MAC o UUID)"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            helperText="Si envías con un sensor de AmazonIA, ingresa su ID aquí para habilitar telemetría."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>Guardar Envío</Button>
        </div>
      </form>
    </Modal>
  );
}
