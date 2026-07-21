"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { OrderTimelineItemDto } from "event-types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Rampa secuencial de un solo hue (azul, claro→oscuro) — pasos tomados tal cual
// de la rampa validada del sistema de diseño (100/200/300/400/500/700).
// Magnitud = temperatura; nunca arcoíris, nunca color solo (siempre acompañado
// de la leyenda numérica y el tooltip con el valor exacto).
const TEMP_RAMP: { max: number; color: string }[] = [
  { max: 22, color: "#cde2fb" },
  { max: 26, color: "#9ec5f4" },
  { max: 30, color: "#6da7ec" },
  { max: 34, color: "#3987e5" },
  { max: 38, color: "#256abf" },
  { max: Infinity, color: "#0d366b" },
];

function colorForTemp(temp: number): string {
  return (TEMP_RAMP.find((step) => temp <= step.max) ?? TEMP_RAMP[TEMP_RAMP.length - 1]).color;
}

interface RoutePoint {
  lat: number;
  lng: number;
  temperature: number;
  shock: number | null;
  timestamp: string;
  status: string | null;
}

function isValidCoordinates(location: unknown): location is { coordinates: [number, number] } {
  if (!location || typeof location !== "object") return false;
  const coords = (location as { coordinates?: unknown }).coordinates;
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  );
}

interface ShipmentRouteHeatmapProps {
  items: OrderTimelineItemDto[];
}

export default function ShipmentRouteHeatmap({ items }: ShipmentRouteHeatmapProps) {
  const points = useMemo<RoutePoint[]>(() => {
    return items
      .filter(
        (item): item is OrderTimelineItemDto & { temperature_celsius: number } =>
          item.type === "telemetry" &&
          isValidCoordinates(item.location) &&
          typeof item.temperature_celsius === "number"
      )
      .map((item) => {
        const [lng, lat] = (item.location as { coordinates: [number, number] }).coordinates;
        return {
          lat,
          lng,
          temperature: item.temperature_celsius,
          shock: item.shock_g_force ?? null,
          timestamp: item.timestamp,
          status: item.shipment_status ?? null,
        };
      });
  }, [items]);

  if (points.length === 0) return null;

  const center: [number, number] = [points[0].lat, points[0].lng];
  const routeLine: [number, number][] = points.map((p) => [p.lat, p.lng]);

  return (
    <div className="space-y-3">
      <div className="relative h-[320px] w-full rounded-2xl overflow-hidden border border-border z-0">
        <MapContainer center={center} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={routeLine} pathOptions={{ color: "#898781", weight: 2, dashArray: "4 6" }} />
          {points.map((p, idx) => (
            <CircleMarker
              key={idx}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{
                fillColor: colorForTemp(p.temperature),
                fillOpacity: 0.9,
                color: "#ffffff",
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold">
                    {format(new Date(p.timestamp), "d MMM, HH:mm", { locale: es })}
                  </p>
                  <p>Temperatura: {p.temperature.toFixed(1)}°C</p>
                  {p.shock != null && <p>Impacto: {p.shock.toFixed(2)}g</p>}
                  {p.status && <p>Estado: {p.status}</p>}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda — escala secuencial de un hue, etiquetada numéricamente */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted shrink-0">Más frío</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${TEMP_RAMP.map((s) => s.color).join(", ")})` }}
        />
        <span className="text-xs text-muted shrink-0">Más caliente</span>
      </div>
      <p className="text-xs text-muted text-center">
        Temperatura registrada en cada punto de la ruta del envío ({points.length} lecturas) — pasa el cursor sobre un punto para ver el detalle
      </p>
    </div>
  );
}
