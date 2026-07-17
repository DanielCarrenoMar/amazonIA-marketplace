"use client";

import { useEffect, useState } from "react";
import type { RiskAlertLevel, RiskEvaluationResponseDto } from "event-types";
import { evaluateRisk } from "@/lib/api/inference.api";
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
  orderLabel?: string;
}

type AlertConfig = {
  label: string;
  badge: "nature" | "accent" | "danger";
  bar: string;
  barSoft: string;
  ring: string;
  segmentBg: string;
  segmentBorder: string;
  segmentText: string;
  icon: string;
};

const ALERT_CONFIG: Record<RiskAlertLevel, AlertConfig> = {
  GREEN: {
    label: "Riesgo bajo",
    badge: "nature",
    bar: "bg-emerald-500",
    barSoft: "bg-emerald-500/70",
    ring: "text-emerald-500",
    segmentBg: "bg-emerald-50/70",
    segmentBorder: "border-emerald-200",
    segmentText: "text-emerald-900",
    icon: "lucide:shield-check",
  },
  YELLOW: {
    label: "Riesgo moderado",
    badge: "accent",
    bar: "bg-amber-500",
    barSoft: "bg-amber-500/70",
    ring: "text-amber-500",
    segmentBg: "bg-amber-50/70",
    segmentBorder: "border-amber-200",
    segmentText: "text-amber-900",
    icon: "lucide:alert-triangle",
  },
  RED: {
    label: "Riesgo alto",
    badge: "danger",
    bar: "bg-red-500",
    barSoft: "bg-red-500/70",
    ring: "text-red-500",
    segmentBg: "bg-red-50/70",
    segmentBorder: "border-red-200",
    segmentText: "text-red-900",
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
  if (source === "ml_model") return "XGBoost + SHAP";
  if (source === "fallback_heuristics") return "Heurísticas";
  return source ?? "Desconocido";
}

function formatConfidence(value?: number): string {
  if (value == null) return "N/D";
  return `${Math.round(value * 100)}%`;
}

function formatDuration(days: number): string {
  const totalHours = days * 24;
  if (totalHours < 1) {
    const minutes = Math.round(totalHours * 60);
    return `${minutes} min`;
  }
  if (totalHours < 24) {
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} horas`;
  }
  const fullDays = Math.floor(days);
  const remainingHours = Math.round((days - fullDays) * 24);
  return remainingHours > 0
    ? `${fullDays} ${fullDays === 1 ? "día" : "días"} y ${remainingHours} h`
    : `${fullDays} ${fullDays === 1 ? "día" : "días"}`;
}

function confidenceBadgeVariant(value?: number): "nature" | "accent" | "danger" | "outline" {
  if (value == null) return "outline";
  if (value >= 0.8) return "nature";
  if (value >= 0.5) return "accent";
  return "danger";
}

function MetricCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center min-h-[120px] ${className}`}
    >
      {children}
    </div>
  );
}

function ScoreRing({ score, ringClass }: { score: number; ringClass: string }) {
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${Math.min(100, score)} 100`}
          className={ringClass}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {Math.round(score)}%
      </span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[120px] bg-white rounded-xl border border-slate-100 shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-white rounded-xl border border-slate-100 shadow-sm" />
        <div className="h-64 bg-white rounded-xl border border-slate-100 shadow-sm" />
      </div>
      <p className="text-sm text-slate-500 text-center">Analizando ruta, clima e hidrología…</p>
    </div>
  );
}

export function LogisticsRiskPanel({ order, enabled = true, orderLabel }: LogisticsRiskPanelProps) {
  const [riskData, setRiskData] = useState<RiskEvaluationResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!order.originCoords || !order.destinationCoords) {
      setError("Este pedido no tiene coordenadas de origen/destino guardadas.");
      setRiskData(null);
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
        setError("El servicio de inferencia no está disponible en este momento.");
        setRiskData(null);
      })
      .finally(() => setLoading(false));
  }, [order.id, order.originCoords, order.destinationCoords, order.requiresColdChain, enabled]);

  const alert = riskData ? ALERT_CONFIG[riskData.alert_level] : null;
  const recommendations = riskData ? getPackagingRecommendations(riskData) : [];
  const maxImpact = riskData?.main_reasons.length
    ? Math.max(...riskData.main_reasons.map((r) => r.impact), 0.001)
    : 1;

  return (
    <section className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="lucide:brain-circuit" className="w-5 h-5 text-brand-primary" />
            Monitoreo Logístico IA
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {orderLabel ? `Pedido: ${orderLabel}` : `ID: ${order.id.slice(0, 8)}…`}
            {" · "}
            XGBoost · Open-Meteo · Hidrología · IoT · SHAP
          </p>
        </div>
        {riskData && alert && (
          <Badge variant={alert.badge} size="md">
            {alert.label}
          </Badge>
        )}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <p className="font-semibold text-red-800 flex items-center gap-2">
              <Icon icon="lucide:alert-triangle" className="w-5 h-5" />
              Evaluación no disponible
            </p>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : !riskData || !alert ? (
        <p className="text-sm text-slate-500 text-center py-8">No se pudo analizar la ruta.</p>
      ) : (
        <>
          {/* Fila superior: 3 métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Tarjeta 1: Score */}
            <MetricCard>
              <div className="flex items-center gap-3">
                <ScoreRing score={riskData.composite_score_pct} ringClass={alert.ring} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Score de riesgo
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{alert.label}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{riskData.message}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${alert.bar}`}
                  style={{ width: `${Math.min(100, riskData.composite_score_pct)}%` }}
                />
              </div>
            </MetricCard>

            {/* Tarjeta 2: Distancia y duración */}
            <MetricCard>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Ruta estimada
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Icon icon="lucide:route" className="w-4 h-4 text-slate-400" />
                    Distancia
                  </span>
                  <span className="font-bold text-slate-900">
                    {riskData.metadata?.distance_km != null
                      ? `${riskData.metadata.distance_km.toFixed(1)} km`
                      : "N/D"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Icon icon="lucide:clock" className="w-4 h-4 text-slate-400" />
                    Duración
                  </span>
                  <span className="font-bold text-slate-900">
                    {riskData.metadata?.estimated_duration_days != null
                      ? formatDuration(riskData.metadata.estimated_duration_days)
                      : "N/D"}
                  </span>
                </div>
              </div>
            </MetricCard>

            {/* Tarjeta 3: Confianza */}
            <MetricCard>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Confianza de datos
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={confidenceBadgeVariant(riskData.metadata?.confianza_clima)} size="sm">
                  Clima {formatConfidence(riskData.metadata?.confianza_clima)}
                </Badge>
                <Badge variant={confidenceBadgeVariant(riskData.metadata?.confianza_iot)} size="sm">
                  IoT {formatConfidence(riskData.metadata?.confianza_iot)}
                </Badge>
                {riskData.metadata?.iot_found && (
                  <Badge variant="nature" size="sm">
                    Sensor activo
                  </Badge>
                )}
              </div>
              {riskData.metadata?.penalizacion_aplicada != null &&
                riskData.metadata.penalizacion_aplicada > 0 && (
                  <p className="text-xs text-amber-700 mt-2 italic">
                    Penalización aplicada por datos incompletos
                  </p>
                )}
            </MetricCard>
          </div>

          {/* Sección central: 2/3 + 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: SHAP */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Icon icon="lucide:bar-chart-horizontal" className="w-4 h-4 text-brand-primary" />
                  Factores de riesgo detectados por la IA
                </h3>

                {/* Factores SHAP */}
                {riskData.main_reasons.length > 0 ? (
                  <div>
                    <ul className="space-y-2">
                      {riskData.main_reasons.map((reason, idx) => {
                        const featureTranslations: Record<string, string> = {
                          max_temperatura_c: "Temperatura Máxima (°C)",
                          precipitacion_acum_mm: "Precipitación Acumulada (mm)",
                          max_viento_ms: "Velocidad del Viento (m/s)",
                          tipo_transporte: "Tipo de Transporte",
                          tipo_producto: "Tipo de Producto",
                          nivel_rio_m: "Nivel del Río (m)",
                          regimen_hidrologico: "Régimen Hidrológico",
                          velocidad_corriente_rio_ms: "Velocidad de la Corriente del Río (m/s)",
                        };
                        const displayName = featureTranslations[reason.feature] || reason.feature;
                        return (
                          <li key={idx} className="text-sm">
                            <div className="flex justify-between gap-2 mb-0.5">
                              <span className="text-slate-700">{displayName}</span>
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
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Sin factores positivos significativos detectados.</p>
                )}
              </div>

              {riskData.shap_plot_base64 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Icon icon="lucide:line-chart" className="w-4 h-4 text-brand-primary" />
                    Gráfico de explicabilidad SHAP
                  </h3>
                  <img
                    src={`data:image/png;base64,${riskData.shap_plot_base64}`}
                    alt="Gráfico SHAP: impacto de cada variable en la predicción de riesgo logístico"
                    className="w-full rounded-lg border border-slate-100 bg-slate-50"
                  />
                </div>
              )}
            </div>

            {/* Columna derecha: tramo crítico + recomendaciones */}
            <div className="lg:col-span-1 space-y-4">
              {riskData.critical_segment && (
                <div
                  className={`rounded-xl border p-4 shadow-sm ${alert.segmentBg} ${alert.segmentBorder}`}
                >
                  <p
                    className={`font-semibold flex items-center gap-2 text-sm mb-2 ${alert.segmentText}`}
                  >
                    <Icon icon="lucide:map-pin" className="w-4 h-4" />
                    Tramo más crítico
                  </p>
                  <p className={`text-sm ${alert.segmentText} opacity-90`}>
                    {riskData.critical_segment.observation}
                  </p>
                  <p className="text-xs font-mono mt-2 opacity-75">
                    {riskData.critical_segment.coordinates.lat.toFixed(4)},{" "}
                    {riskData.critical_segment.coordinates.lon.toFixed(4)}
                  </p>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Recomendaciones de empaque
                  </h3>
                  <ol className="space-y-3">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <Icon
                          icon="lucide:package-check"
                          className="w-4 h-4 text-brand-primary shrink-0 mt-0.5"
                        />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
