"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getCurrentClimate } from "@/lib/api";
import type { IClimateEvent } from "event-types";
import { DashboardHeader } from "@/components/dashboard";
import { Card } from "@/components/ui/Card";
import { Thermometer } from "lucide-react";

// El mapa depende de Leaflet (usa `window`), así que se carga solo en el cliente
const RegionalClimateHeatmap = dynamic(
  () => import("@/components/dashboard/RegionalClimateHeatmap"),
  {
    ssr: false,
    loading: () => <div className="h-[420px] bg-gray-100 animate-pulse rounded-2xl" />,
  }
);

export default function ClimateMapPage() {
  const [readings, setReadings] = useState<IClimateEvent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentClimate()
      .then(setReadings)
      .catch((err: any) => {
        console.error(err);
        setLoadError(err.message || "No se pudo cargar el clima regional");
      });
  }, []);

  return (
    <div className="space-y-6 pt-4">
      <DashboardHeader
        title="Clima Regional"
        subtitle="Condiciones ambientales en tiempo real de las estaciones climáticas de la región amazónica"
      />

      <Card padding="lg">
        <h3 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-brand-primary" /> Mapa de Temperatura Regional
        </h3>

        {loadError ? (
          <p className="text-brand-urgency text-center py-8">{loadError}</p>
        ) : !readings ? (
          <div className="h-[420px] bg-gray-100 animate-pulse rounded-2xl" />
        ) : (
          <RegionalClimateHeatmap readings={readings} />
        )}
      </Card>
    </div>
  );
}
