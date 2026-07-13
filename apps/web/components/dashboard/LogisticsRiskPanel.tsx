"use client";

import { useState, useEffect } from "react";
import { getSpatialRisk } from "@/lib/api/inference.api";
import { Card } from "@/components/ui/Card";
import { Icon } from "@iconify/react";

interface LogisticsRiskPanelProps {
  lat?: number;
  lon?: number;
  transportType?: string;
  productType?: string;
}

export function LogisticsRiskPanel({
  lat = -12.0464, // Lima
  lon = -77.0428,
  transportType = "terrestre",
  productType = "general"
}: LogisticsRiskPanelProps) {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getSpatialRisk({ lat, lon, transportType, productType })
      .then((data) => {
        if (mounted) setRiskData(data);
      })
      .catch((err) => {
        console.error("Error fetching spatial risk:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [lat, lon, transportType, productType]);

  return (
    <Card padding="md" className="bg-slate-50 border-brand-primary/20">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Icon icon="lucide:brain-circuit" className="w-5 h-5 text-brand-primary" />
        Evaluación de Ruta IA
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      ) : !riskData ? (
        <div className="text-sm text-muted text-center py-4">
          No se pudo generar la evaluación espacial.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <div className={`p-2 rounded-full shrink-0 ${riskData.risk_level === 'high' ? 'bg-red-100 text-red-600' : riskData.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              <Icon icon="lucide:thermometer-sun" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase">Clima en Destino</p>
              <p className="text-sm font-semibold">{riskData.weather?.temperature_celsius}°C - {riskData.weather?.condition}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
             <div className="p-2 rounded-full shrink-0 bg-blue-100 text-blue-600">
              <Icon icon="lucide:droplets" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase">Humedad</p>
              <p className="text-sm font-semibold">{riskData.weather?.humidity_percent}%</p>
            </div>
          </div>

          {riskData.recommendations && riskData.recommendations.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs font-bold text-slate-900 mb-2 uppercase">Recomendaciones de Empaque:</p>
              <ul className="space-y-2">
                {riskData.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
