"use client";

import { useEffect, useState } from "react";
import type { RiskEvaluationResponseDto } from "event-types";
import { evaluateRisk } from "@/lib/api/inference.api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@iconify/react";

export interface LogisticsRiskPanelOrderInput {
  id: string;
  originCoords: { latitude: number; longitude: number } | null;
  destinationCoords: { latitude: number; longitude: number } | null;
  requiresColdChain?: boolean;
}

interface LogisticsRiskPanelProps {
  order: LogisticsRiskPanelOrderInput;
  enabled?: boolean;
}

const ALERT_CONFIG = {
  GREEN: {
    label: "Riesgo bajo",
    badge: "nature" as const,
    bar: "bg-emerald-500",
    ring: "text-emerald-500",
    icon: "lucide:shield-check",
  },
  YELLOW: {
    label: "Riesgo moderado",
    badge: "accent" as const,
    bar: "bg-amber-500",
    ring: "text-amber-500",
    icon: "lucide:alert-triangle",
  },
  RED: {
    label: "Riesgo alto",
    badge: "danger" as const,
    bar: "bg-red-500",
    ring: "text-red-500",
    icon: "lucide:octagon-alert",
  },
};

function getPackagingRecommendations(risk: RiskEvaluationResponseDto): string[] {
  const recs = new Set<string>();

  if (risk.alert_level === "RED") {
    recs.add("Usar embalaje reforzado y evaluar posponer el despacho si es posible.");
  } else if (risk.alert_level === "YELLOW") {
    recs.add("Reforzar el empaque estándar según los factores detectados.");
  } else {
    recs.add("Empaque estándar suficiente para las condiciones actuales de la ruta.");
  }

  for (const reason of risk.main_reasons) {
    const f = reason.feature.toLowerCase();
    if (f.includes("temperatura")) {
      recs.add("Incluir aislante térmico y, si aplica, gel refrigerante o cadena de frío.");
    }
    if (f.includes("lluvia") || f.includes("precipit")) {
      recs.add("Impermeabilizar el empaque exterior (láminas plásticas o bolsas selladas).");
    }
    if (f.includes("viento")) {
      recs.add("Asegurar la carga con cinchas y protección contra golpes por movimiento.");
    }
    if (f.includes("río") || f.includes("rio")) {
      recs.add("Para rutas fluviales: verificar calado del río y reforzar impermeabilización.");
    }
    if (f.includes("inciert") || f.includes("fallback")) {
      recs.add("Datos climáticos limitados: usar empaque conservador hasta confirmar condiciones.");
    }
  }

  if (risk.metadata?.iot_found) {
    recs.add("Sensor IoT activo: monitorear temperatura y humedad interna durante el tránsito.");
  }

  return Array.from(recs).slice(0, 5);
}

function sourceLabel(source?: string): string {
  if (source === "ml_model") return "Modelo XGBoost + SHAP";
  if (source === "fallback_heuristics") return "Heurísticas (modelo no cargado)";
  return source ?? "Desconocido";
}

function formatConfidence(value?: number): string {
  if (value == null) return "N/D";
  return `${Math.round(value * 100)}%`;
}

export function LogisticsRiskPanel({ order, enabled = true }: LogisticsRiskPanelProps) {
  const [riskData, setRiskData] = useState<RiskEvaluationResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShap, setShowShap] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (!order.originCoords || !order.destinationCoords) {
      setError("No se pudo evaluar el riesgo: el pedido no tiene coordenadas de origen/destino guardadas.");
      return;
    }

    const productType = order.requiresColdChain ? "perecedero_alto" : "general";

    setLoading(true);
    setError(null);

    evaluateRisk({
      shipment_id: order.id,
      route_id: order.id,
      route_points: [
        { lat: order.originCoords.latitude, lon: order.originCoords.longitude },
        { lat: order.destinationCoords.latitude, lon: order.destinationCoords.longitude },
      ],
      departure_date: new Date().toISOString().split("T")[0],
      transport_types: ["terrestre"],
      product_types: [productType],
    })
      .then(setRiskData)
      .catch(() => {
        setError("El asistente de inferencia no está disponible. Puedes procesar el pedido normalmente.");
      })
      .finally(() => setLoading(false));
  }, [order.id, order.originCoords, order.destinationCoords, order.requiresColdChain, enabled]);

  const alert = riskData ? ALERT_CONFIG[riskData.alert_level] : null;
  const recommendations = riskData ? getPackagingRecommendations(riskData) : [];
  const maxImpact = riskData?.main_reasons.length
    ? Math.max(...riskData.main_reasons.map((r) => r.impact), 0.001)
    : 1;

  return (
    <Card padding="md" className="border-brand-primary/20 bg-linear-to-b from-white to-brand-primary/5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-bold flex items-center gap-2 text-slate-900">
          <Icon icon="lucide:brain-circuit" className="w-5 h-5 text-brand-primary" />
          Asistente de Embalaje IA
        </h3>
        {riskData && alert && (
          <Badge variant={alert.badge} size="sm">
            {alert.label}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted mb-4">
        Predicción XGBoost entrenada con clima real (Open-Meteo), hidrología amazónica e IoT en vivo.
        Explicabilidad SHAP incluida.
      </p>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-24 bg-gray-100 rounded-lg" />
          <p className="text-sm text-muted">Analizando ruta, clima e hidrología…</p>
        </div>
      ) : error ? (
        <div className="bg-brand-urgency/10 text-brand-urgency p-3 rounded-md text-sm border border-brand-urgency/20">
          <p className="font-semibold flex items-center gap-1">
            <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
            No disponible
          </p>
          <p className="mt-1">{error}</p>
        </div>
      ) : !riskData || !alert ? (
        <p className="text-sm text-muted">No se pudo analizar la ruta.</p>
      ) : (
        <div className="space-y-4">
          {/* Score principal */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${riskData.composite_score_pct} 100`}
                    className={alert.ring}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {Math.round(riskData.composite_score_pct)}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted uppercase font-medium">Probabilidad de fracaso logístico</p>
                <p className="text-sm mt-1">{riskData.message}</p>
                <p className="text-xs text-muted mt-1 flex items-center gap-1">
                  <Icon icon={alert.icon} className="w-3.5 h-3.5" />
                  Fuente: {sourceLabel(riskData.metadata?.source)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${alert.bar}`}
                style={{ width: `${Math.min(100, riskData.composite_score_pct)}%` }}
              />
            </div>
          </div>

          {/* Metadatos de ruta */}
          {(riskData.metadata?.distance_km != null || riskData.metadata?.estimated_duration_days != null) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {riskData.metadata.distance_km != null && (
                <div className="border border-border rounded-lg p-2.5 bg-white">
                  <span className="text-muted block text-xs">Distancia estimada</span>
                  <span className="font-semibold">{riskData.metadata.distance_km.toFixed(1)} km</span>
                </div>
              )}
              {riskData.metadata.estimated_duration_days != null && (
                <div className="border border-border rounded-lg p-2.5 bg-white">
                  <span className="text-muted block text-xs">Duración estimada</span>
                  <span className="font-semibold">{riskData.metadata.estimated_duration_days} días</span>
                </div>
              )}
              <div className="border border-border rounded-lg p-2.5 bg-white">
                <span className="text-muted block text-xs">Confianza clima</span>
                <span className="font-semibold">{formatConfidence(riskData.metadata?.confianza_clima)}</span>
              </div>
              <div className="border border-border rounded-lg p-2.5 bg-white">
                <span className="text-muted block text-xs">Confianza IoT</span>
                <span className="font-semibold">
                  {formatConfidence(riskData.metadata?.confianza_iot)}
                  {riskData.metadata?.iot_found ? " (sensor activo)" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Segmento crítico */}
          {riskData.critical_segment && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
                <Icon icon="lucide:map-pin" className="w-4 h-4" />
                Tramo más crítico
              </p>
              <p className="text-amber-800">{riskData.critical_segment.observation}</p>
              <p className="text-xs text-amber-700 mt-1 font-mono">
                {riskData.critical_segment.coordinates.lat.toFixed(4)},{" "}
                {riskData.critical_segment.coordinates.lon.toFixed(4)}
              </p>
            </div>
          )}

          {/* Factores SHAP */}
          {riskData.main_reasons.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase mb-2">
                Factores que elevan el riesgo (SHAP)
              </p>
              <ul className="space-y-2">
                {riskData.main_reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm">
                    <div className="flex justify-between gap-2 mb-0.5">
                      <span className="text-slate-700">{reason.feature}</span>
                      <span className="text-muted text-xs shrink-0">
                        +{(reason.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${(reason.impact / maxImpact) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gráfico SHAP */}
          {riskData.shap_plot_base64 && (
            <div>
              <button
                type="button"
                onClick={() => setShowShap((v) => !v)}
                className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline"
              >
                <Icon icon={showShap ? "lucide:chevron-up" : "lucide:chevron-down"} className="w-4 h-4" />
                {showShap ? "Ocultar" : "Ver"} gráfico de explicabilidad SHAP
              </button>
              {showShap && (
                <img
                  src={`data:image/png;base64,${riskData.shap_plot_base64}`}
                  alt="Gráfico SHAP: impacto de cada variable en la predicción de riesgo logístico"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white"
                />
              )}
            </div>
          )}

          {/* Recomendaciones de empaque */}
          {recommendations.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-bold text-slate-900 mb-2 uppercase">Recomendaciones de empaque</p>
              <ul className="space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <Icon
                      icon="lucide:package-check"
                      className="w-4 h-4 text-brand-primary shrink-0 mt-0.5"
                    />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskData.metadata?.penalizacion_aplicada != null && riskData.metadata.penalizacion_aplicada > 0 && (
            <p className="text-xs text-muted italic">
              * Se aplicó una penalización por datos incompletos; el score puede ser conservador.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
