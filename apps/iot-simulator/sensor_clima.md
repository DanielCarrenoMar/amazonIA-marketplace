# Campos implementables por un sensor de clima (weather sensor)

A partir de los campos que actualmente publica `sensor.js`, se identificaron cuáles de ellos tienen relevancia directa para un **sensor de condiciones climáticas/ambientales**, así como los campos adicionales que un sensor de clima típicamente aportaría.

---

## ✅ Campos actuales del payload compatibles con un sensor de clima

| Campo | Ruta completa | ¿Por qué es relevante para clima? |
|---|---|---|
| `recorded_at` | `recorded_at` | Toda medición climática requiere un timestamp preciso para series de tiempo |
| `tracking_number` | `metadata.tracking_number` | Identifica el activo o zona monitoreada (puede ser el ID de la estación climática) |
| `container_id` | `metadata.container_id` | Puede reutilizarse como ID único del dispositivo/sensor de clima |
| `coordinates` | `location.coordinates` | Las coordenadas GPS son esenciales: los datos climáticos siempre están georeferenciados |
| `location.type` | `location.type` | Necesario para representar la ubicación en formato GeoJSON estándar |
| `temperature_celsius` | `telemetry.temperature_celsius` | **Campo climático por excelencia.** La temperatura ambiente es la métrica más básica de todo sensor de clima |

---

## ❌ Campos actuales NO directamente relevantes para un sensor de clima puro

| Campo | Razón |
|---|---|
| `event_type: "shipment_telemetry"` | Semántica de logística, no de clima. Debería cambiarse a `"weather_telemetry"` |
| `status` (`business_context.status`) | Estados de logística (`in_transit`, `delivered`, etc.) no aplican para clima |
| `scan_type: "gps"` | Específico de trazabilidad de paquetes, no de monitoreo ambiental |
| `shock_g_force` | Mide impactos físicos/vibraciones, no variables atmosféricas |

---

## 🌦️ Campos adicionales recomendados para un sensor de clima completo

Estos campos **no existen actualmente** en el payload pero son estándar en sensores meteorológicos IoT y deberían añadirse:

| Campo propuesto | Tipo | Unidad | Descripción |
|---|---|---|---|
| `humidity_percent` | `float` | % | Humedad relativa del aire (0–100%) |
| `pressure_hpa` | `float` | hPa | Presión atmosférica en hectopascales |
| `wind_speed_ms` | `float` | m/s | Velocidad del viento |
| `wind_direction_deg` | `float` | grados (0–360°) | Dirección del viento (0° = Norte) |
| `rainfall_mm` | `float` | mm | Precipitación acumulada en el intervalo |
| `uv_index` | `float` | índice UV | Índice de radiación ultravioleta |
| `dew_point_celsius` | `float` | °C | Punto de rocío calculado |
| `visibility_km` | `float` | km | Visibilidad horizontal |
| `cloud_cover_percent` | `float` | % | Porcentaje de cobertura nubosa |
| `solar_radiation_wm2` | `float` | W/m² | Radiación solar incidente |

---

## 📐 Ejemplo de payload adaptado para sensor de clima

```json
{
  "event_type": "weather_telemetry",
  "recorded_at": "2026-06-15T22:30:00.000Z",
  "metadata": {
    "station_id": "WS-AMAZONIA-01",
    "device_id": "DEV-AMAZONIA-01"
  },
  "location": {
    "type": "Point",
    "coordinates": [-60.0217, -3.1190]
  },
  "telemetry": {
    "temperature_celsius": 31.45,
    "humidity_percent": 82.3,
    "pressure_hpa": 1012.5,
    "wind_speed_ms": 3.2,
    "wind_direction_deg": 135,
    "rainfall_mm": 0.0,
    "uv_index": 6.4,
    "dew_point_celsius": 27.8,
    "visibility_km": 10.0,
    "solar_radiation_wm2": 620.0
  }
}
```

---

## Resumen

| Categoría | Cantidad de campos |
|---|---|
| Campos actuales compatibles con clima | **6** |
| Campos actuales NO relevantes para clima | **4** |
| Campos nuevos recomendados para clima completo | **10** |
