"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { IClimateEvent } from "event-types";

// Misma rampa secuencial de un solo hue (azul, claro→oscuro) que el mapa de
// temperatura del envío — magnitud = temperatura, nunca arcoíris.
const TEMP_RAMP: { stop: number; color: string }[] = [
  { stop: 0.0, color: "#cde2fb" },
  { stop: 0.2, color: "#9ec5f4" },
  { stop: 0.4, color: "#6da7ec" },
  { stop: 0.6, color: "#3987e5" },
  { stop: 0.8, color: "#256abf" },
  { stop: 1.0, color: "#0d366b" },
];

const HEAT_GRADIENT = TEMP_RAMP.reduce<Record<number, string>>((acc, s) => {
  acc[s.stop] = s.color;
  return acc;
}, {});

function colorForTemp(temp: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (temp - min) / (max - min);
  const step = TEMP_RAMP.find((s) => t <= s.stop) ?? TEMP_RAMP[TEMP_RAMP.length - 1];
  return step.color;
}

interface StationReading {
  sensorId: string;
  lat: number;
  lng: number;
  temperature: number;
  humidity: number | null;
  recordedAt: string;
}

function HeatLayer({ points }: { points: StationReading[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (points.length === 0) return;

    const heatPoints: [number, number, number][] = points.map((p) => [p.lat, p.lng, p.temperature]);
    const temps = points.map((p) => p.temperature);
    const max = Math.max(...temps);

    const heat = L.heatLayer(heatPoints, {
      radius: 110,
      blur: 60,
      max,
      minOpacity: 0.55,
      gradient: HEAT_GRADIENT,
    });

    heat.addTo(map);
    layerRef.current = heat;

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [points, map]);

  return null;
}

interface RegionalClimateHeatmapProps {
  readings: IClimateEvent[];
}

export default function RegionalClimateHeatmap({ readings }: RegionalClimateHeatmapProps) {
  const points = useMemo<StationReading[]>(() => {
    return readings
      .filter((r) => Array.isArray(r.location?.coordinates) && typeof r.telemetry?.temperature_celsius === "number")
      .map((r) => {
        const [lng, lat] = r.location.coordinates;
        return {
          sensorId: r.metadata.sensor_id,
          lat,
          lng,
          temperature: r.telemetry.temperature_celsius,
          humidity: r.telemetry.humidity_percent ?? null,
          recordedAt: r.recorded_at,
        };
      });
  }, [readings]);

  if (points.length === 0) {
    return (
      <div className="h-[420px] w-full rounded-2xl border border-border bg-gray-50 flex items-center justify-center text-muted text-sm">
        No hay lecturas climáticas recientes disponibles.
      </div>
    );
  }

  const temps = points.map((p) => p.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const center: [number, number] = [points[0].lat, points[0].lng];

  return (
    <div className="space-y-3">
      <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-border z-0">
        <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer points={points} />
          {points.map((p) => (
            <CircleMarker
              key={p.sensorId}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{
                fillColor: colorForTemp(p.temperature, minTemp, maxTemp),
                fillOpacity: 1,
                color: "#ffffff",
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold">{p.sensorId}</p>
                  <p>Temperatura: {p.temperature.toFixed(1)}°C</p>
                  {p.humidity != null && <p>Humedad: {p.humidity.toFixed(0)}%</p>}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda — escala secuencial de un hue, etiquetada con los valores reales observados */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted shrink-0">{minTemp.toFixed(0)}°C</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${TEMP_RAMP.map((s) => s.color).join(", ")})` }}
        />
        <span className="text-xs text-muted shrink-0">{maxTemp.toFixed(0)}°C</span>
      </div>
      <p className="text-xs text-muted text-center">
        Temperatura por estación climática ({points.length} estaciones activas) — pasa el cursor sobre un punto para ver el detalle
      </p>
    </div>
  );
}
