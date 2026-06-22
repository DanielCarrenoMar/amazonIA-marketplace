# Campos del payload publicado por `sensor.js`

El sensor publica en el tópico MQTT **`amazonia/iot/shipment`** un mensaje JSON con la siguiente estructura y campos:

---

## Estructura del payload

```json
{
  "event_type": "shipment_telemetry",
  "recorded_at": "<ISO 8601 timestamp>",
  "metadata": {
    "tracking_number": "ORD-001",
    "container_id": "DEV-AMAZONIA-01"
  },
  "location": {
    "type": "Point",
    "coordinates": [<longitude>, <latitude>]
  },
  "business_context": {
    "status": "<estado_del_envío>",
    "scan_type": "gps"
  },
  "telemetry": {
    "temperature_celsius": <número>,
    "shock_g_force": <número>
  }
}
```

---

## Listado completo de campos

| Campo | Ruta completa | Tipo | Descripción |
|---|---|---|---|
| `event_type` | `event_type` | `string` | Tipo de evento. Valor fijo: `"shipment_telemetry"` |
| `recorded_at` | `recorded_at` | `string` (ISO 8601) | Timestamp UTC del momento en que se genera el evento |
| `tracking_number` | `metadata.tracking_number` | `string` | Identificador del pedido/envío. Ej: `"ORD-001"` |
| `container_id` | `metadata.container_id` | `string` | Identificador del contenedor IoT. Ej: `"DEV-AMAZONIA-01"` |
| `location.type` | `location.type` | `string` | Tipo GeoJSON. Valor fijo: `"Point"` |
| `coordinates` | `location.coordinates` | `array [lng, lat]` | Coordenadas GPS en formato GeoJSON `[longitud, latitud]` |
| `status` | `business_context.status` | `string` (enum) | Estado del envío. Valores posibles: `pending_pickup`, `in_transit`, `out_for_delivery`, `delivered` |
| `scan_type` | `business_context.scan_type` | `string` | Tipo de escaneo. Valor fijo: `"gps"` |
| `temperature_celsius` | `telemetry.temperature_celsius` | `float` | Temperatura registrada en grados Celsius (rango simulado: 24 – 38 °C) |
| `shock_g_force` | `telemetry.shock_g_force` | `float` | Fuerza de impacto en G. Normal: 0.1–0.8 G; Golpe fuerte: 2.0–5.0 G (10% de probabilidad) |

---

## Configuración de publicación

| Parámetro | Valor |
|---|---|
| Protocolo | MQTT sobre TLS (`mqtts`) |
| Broker | HiveMQ Cloud |
| Tópico | `amazonia/iot/shipment` |
| QoS | 1 |
| Intervalo de publicación | Cada **5 segundos** |
| Checkpoints de ruta | 6 (de Manaos a Belém, Amazonas) |
