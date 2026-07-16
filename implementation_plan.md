# Plan de Implementación - Opción 2: Activación de Sensor vía MQTT con Rutas Dinámicas y Payload Simplificado

Este plan detalla los cambios necesarios para:
1. Sincronizar el inicio del simulador de sensor con la asignación del pedido mediante un mensaje de control MQTT retenido (`START_TRANSIT`).
2. Obtener dinámicamente las coordenadas del origen (vendedor/producto) y destino (comprador) en el backend y enviarlas en el mensaje MQTT para calcular la ruta en tiempo real.
3. Simplificar el payload del sensor para que envíe `latitude` y `longitude` en lugar de una estructura GeoJSON anidada, mapeándola automáticamente en el servicio ingestor.
4. Ajustar el ID del sensor a la estructura de escalabilidad `ORD-#` (donde `#` es el número del sensor sin ceros a la izquierda, por ejemplo: `ORD-1`, `ORD-2`, `ORD-12`).

---

## Cambios Propuestos

### 1. API Backend (Microservicio `api`)

#### [MODIFY] [package.json](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/apps/api/package.json)
* Agregar `"mqtt": "^5.15.1"` a las dependencias.

#### [MODIFY] [product-order.service.ts](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/apps/api/src/product-order/product-order.service.ts)
* Importar `mqtt` y `ConfigService`.
* Inyectar `ConfigService` en `ProductOrderService`.
* Modificar la lógica posterior a la transacción en el método `update` para que, cuando la orden pase a `SHIPPED` con un `sensorId`:
  * Realice consultas SQL nativas (`$queryRaw`) para extraer la latitud y longitud desde PostGIS de:
    * El producto/vendedor (Origen): `ST_Y("locationCoords"::geometry)` y `ST_X("locationCoords"::geometry)` de la tabla `product`.
    * El comprador (Destino): `ST_Y("locationCoords"::geometry)` y `ST_X("locationCoords"::geometry)` de la tabla `user_account`.
  * Publique el mensaje MQTT de control con `retain: true` en el tópico `amazonia/iot/control/${sensorId}`:
    ```json
    {
      "action": "START_TRANSIT",
      "trackingNumber": "ORD-123",
      "origin": { "lat": -3.119, "lng": -60.0217 },
      "destination": { "lat": -1.3567, "lng": -48.4682 }
    }
    ```

---

### 2. Paquete de Tipos e Ingestor (`event-types` e `ingestor-service`)

#### [MODIFY] [climate-event.dto.ts](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/packages/event-types/src/iot/climate-event.dto.ts) y [shipment-event.dto.ts](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/packages/event-types/src/iot/shipment-event.dto.ts)
* Modificar los DTOs de entrada (`CreateClimateEventDto` y `CreateShipmentEventDto`) para aceptar `latitude` y `longitude` planos de tipo número en lugar del objeto anidado `location`.

#### [MODIFY] [ingest.service.ts](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/apps/ingestor-service/src/ingest/ingest.service.ts)
* En los métodos `enrichClimateEvent` y `enrichShipmentEvent`, extraer `latitude` y `longitude` del DTO plano y construir el objeto GeoJSON `location: { type: 'Point', coordinates: [longitude, latitude] }` para persistencia en MongoDB.

---

### 3. Simulador IoT (`iot-simulator`)

#### [MODIFY] [sensor.js](file:///c:/Users/Crom/Documents/GitHub/amazonIA-marketplace/apps/iot-simulator/sensor.js)
* Inicializar `let isAssigned = false;` y `let routeCheckpoints = [...ROUTE_CHECKPOINTS];`.
* Ajustar la lógica del ID del sensor (`ORDER_ID`) para que use el formato `ORD-#` (sin ceros a la izquierda, por ejemplo `ORD-1` si el usuario es `sensor01`).
* Al conectar a MQTT, suscribirse al tópico de control `amazonia/iot/control/${ORDER_ID}`.
* Al recibir el mensaje MQTT con la acción `START_TRANSIT`:
  * Establecer `isAssigned = true`.
  * Si se proveen las coordenadas de `origin` y `destination`, generar dinámicamente el array de checkpoints interpolando 6 puntos intermedios en línea recta.
* Modificar `publishTelemetry` para:
  * Solo avanzar el checkpoint si `isAssigned` es `true`.
  * Cambiar el payload de telemetría enviado: remover la estructura `location` y enviar en su lugar `latitude` y `longitude` planos extraídos del checkpoint actual.

---

## Plan de Verificación

1. **Prueba del Payload Simplificado**: Correr el simulador y verificar que el payload enviado a HiveMQ contiene los campos planos de coordenadas. Verificar que el Ingestor los reciba, los convierta a GeoJSON y se guarden correctamente en MongoDB.
2. **Prueba de Ruta Dinámica**:
   * Levantar el simulador en puerto local. Verás que se queda estático en la estación inicial (`pending_pickup`).
   * Actualizar una orden a `SHIPPED` con coordenadas específicas de origen y destino y asociarla al sensor con formato `ORD-#`.
   * Confirmar que el sensor recibe las coordenadas de HiveMQ, genera la nueva ruta dinámica, cambia su estado a `in_transit` (trayecto) y avanza por ella.
