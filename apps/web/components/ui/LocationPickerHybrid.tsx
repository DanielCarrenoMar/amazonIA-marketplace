"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin } from "lucide-react";

// 3. Solución explícita para los íconos perdidos de Leaflet en React (SSR friendly)
if (typeof window !== "undefined") {
  // Solo se ejecuta del lado del cliente
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default || require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png").default || require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png").default || require("leaflet/dist/images/marker-shadow.png"),
  });
}

// 5. Diccionario estático de zonas predefinidas
const PREDEFINED_ZONES = [
  { name: "Selecciona una zona...", coords: null },
  { name: "Alta Vista", coords: [8.2995, -62.7138] },
  { name: "Unare", coords: [8.2811, -62.7566] },
  { name: "San Félix Centro", coords: [8.3512, -62.6465] },
  { name: "Parque Macagua", coords: [8.3146, -62.6655] },
];

// 7. Subcomponente para separar la lógica de movimiento del mapa
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

interface LocationPickerProps {
  onLocationSelect?: (lat: number, lng: number, address?: string, city?: string, region?: string) => void;
}

export default function LocationPickerHybrid({ onLocationSelect }: LocationPickerProps) {
  // Estado central unificado para las coordenadas (Por defecto: Alta Vista)
  const [markerCoords, setMarkerCoords] = useState<[number, number]>([8.2995, -62.7138]);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2. Manejador para cuando el pin es arrastrado y soltado
  const handleMarkerDragEnd = useCallback((e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setMarkerCoords([position.lat, position.lng]);
  }, []);

  // 4. Lógica para "Usar mi ubicación actual"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La geolocalización no está soportada por tu navegador.");
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerCoords([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMsg("Permiso denegado. Habilita el GPS en tu navegador.");
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMsg("La información de ubicación no está disponible.");
            break;
          case error.TIMEOUT:
            setErrorMsg("El tiempo de espera para obtener la ubicación se agotó.");
            break;
          default:
            setErrorMsg("Ocurrió un error desconocido al obtener la ubicación.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Manejador del select de zonas predefinidas
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneName = e.target.value;
    const zone = PREDEFINED_ZONES.find((z) => z.name === zoneName);
    if (zone && zone.coords) {
      setMarkerCoords(zone.coords as [number, number]);
      setErrorMsg(null);
    }
  };

  // 6. Botón final para confirmar ubicación
  const handleConfirmLocation = async () => {
    if (onLocationSelect) {
      try {
        setIsGeocoding(true);
        // Reverse Geocoding via Nominatim (OSM)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${markerCoords[0]}&lon=${markerCoords[1]}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        
        const address = data.display_name;
        const city = data.address?.city || data.address?.town || data.address?.village || "";
        const region = data.address?.state || data.address?.region || "";
        
        onLocationSelect(markerCoords[0], markerCoords[1], address, city, region);
      } catch (err) {
        console.error("Geocoding error:", err);
        onLocationSelect(markerCoords[0], markerCoords[1]);
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* 4 y 5. Panel de Control Superior */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 transition-all focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLocating ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {isLocating ? "Localizando..." : "Usar mi ubicación"}
        </button>

        <div className="flex-1 w-full sm:w-auto flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            onChange={handleZoneChange}
            className="w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer appearance-none"
          >
            {PREDEFINED_ZONES.map((zone, idx) => (
              <option key={idx} value={zone.name} disabled={zone.coords === null}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensaje de Error (si ocurre) */}
      {errorMsg && (
        <div className="px-4 py-2 mx-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-500/20">
          {errorMsg}
        </div>
      )}

      {/* Mapa */}
      <div className="relative h-[400px] w-full z-0">
        <MapContainer
          center={markerCoords}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          {/* 1. Mosaicos gratuitos de OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* 2. Pin (Marker) arrastrable */}
          <Marker
            position={markerCoords}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
          {/* 7. Actualizador del centro del mapa */}
          <MapUpdater center={markerCoords} />
        </MapContainer>
      </div>

      {/* 6. Botón de Confirmación Prominente */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleConfirmLocation}
          disabled={isGeocoding}
          className="w-full flex items-center justify-center py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGeocoding ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : null}
          {isGeocoding ? "Procesando dirección..." : "Confirmar Ubicación"}
        </button>
      </div>
    </div>
  );
}
