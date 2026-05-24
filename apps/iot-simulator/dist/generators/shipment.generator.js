"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShipmentEvent = generateShipmentEvent;
const event_types_1 = require("event-types");
const noise_1 = require("./noise");
const ROUTES = [
    // Route 1: Mexico City → Guadalajara
    [
        { coords: [-99.1332, 19.4326], city: 'CDMX' },
        { coords: [-99.8237, 19.5793], city: 'Toluca' },
        { coords: [-101.6833, 20.1118], city: 'Morelia' },
        { coords: [-103.3496, 20.6596], city: 'Guadalajara' },
    ],
    // Route 2: Monterrey → Cancún (long route with connectivity gaps)
    [
        { coords: [-100.3161, 25.6866], city: 'Monterrey' },
        { coords: [-97.5014, 25.8796], city: 'Matamoros' },
        { coords: [-96.1342, 19.1738], city: 'Veracruz' },
        { coords: [-90.5349, 19.8301], city: 'Campeche' },
        { coords: [-86.8515, 21.1619], city: 'Cancún' },
    ],
    // Route 3: Guadalajara → Monterrey
    [
        { coords: [-103.3496, 20.6596], city: 'Guadalajara' },
        { coords: [-102.5528, 22.7709], city: 'Aguascalientes' },
        { coords: [-100.9855, 22.1565], city: 'San Luis Potosí' },
        { coords: [-100.3161, 25.6866], city: 'Monterrey' },
    ],
];
const activeShipments = new Map();
/**
 * Generates a realistic shipment telemetry event for a mobile sensor.
 *
 * Features:
 *  - Linear interpolation between route waypoints
 *  - Cold chain temperature: μ=-2°C, σ=0.5°C
 *  - Shock/g-force: log-normal distribution (rare heavy impacts)
 *  - Network loss simulation: buffers events during "dead zones"
 *    and returns them as a batch when connectivity resumes
 *
 * @param sensorIndex - Unique index for this simulated mobile sensor
 * @param networkLossRate - Probability of network unavailability per reading
 * @param anomalyRate - Probability of cold chain breach
 * @returns Array of events (usually 1, but can be a burst after reconnection)
 */
function generateShipmentEvent(sensorIndex, networkLossRate = 0.1, anomalyRate = 0.05) {
    // Initialize or get existing shipment state
    if (!activeShipments.has(sensorIndex)) {
        const route = ROUTES[sensorIndex % ROUTES.length];
        activeShipments.set(sensorIndex, {
            trackingNumber: `AMZ-MX-${String(Date.now()).slice(-6)}${String(sensorIndex).padStart(3, '0')}`,
            containerId: `truck-trailer-${String(sensorIndex).padStart(3, '0')}`,
            routeIndex: sensorIndex % ROUTES.length,
            progress: 0,
            buffer: [],
        });
    }
    const state = activeShipments.get(sensorIndex);
    const route = ROUTES[state.routeIndex];
    // Advance along the route (small increment per reading)
    state.progress = Math.min(state.progress + 0.02 + Math.random() * 0.03, 1.0);
    // Interpolate position between waypoints
    const coords = interpolateRoute(route, state.progress);
    // Determine shipment status based on progress
    const status = state.progress >= 1.0
        ? event_types_1.ShipmentStatus.DELIVERED
        : state.progress > 0.8
            ? event_types_1.ShipmentStatus.OUT_FOR_DELIVERY
            : event_types_1.ShipmentStatus.IN_TRANSIT;
    // Cold chain temperature (anomaly = temperature breach)
    const isAnomaly = Math.random() < anomalyRate;
    const temperature = isAnomaly
        ? (0, noise_1.roundTo)((0, noise_1.gaussianNoise)(8, 3), 1) // Cold chain breach!
        : (0, noise_1.roundTo)((0, noise_1.gaussianNoise)(-2, 0.5), 1);
    // Shock — log-normal distribution (usually low, rare spikes)
    const shock = (0, noise_1.roundTo)((0, noise_1.clamp)((0, noise_1.logNormalNoise)(-1.5, 0.8), 0, 15), 2);
    const event = {
        event_type: event_types_1.IoTEventType.SHIPMENT_TELEMETRY,
        recorded_at: new Date().toISOString(),
        metadata: {
            tracking_number: state.trackingNumber,
            container_id: state.containerId,
        },
        location: {
            type: 'Point',
            coordinates: coords,
        },
        business_context: {
            status,
            scan_type: event_types_1.ScanType.GPS,
        },
        telemetry: {
            temperature_celsius: temperature,
            shock_g_force: shock,
        },
    };
    // Simulate network loss
    if ((0, noise_1.simulateNetworkLoss)(networkLossRate) && state.progress < 0.95) {
        // Buffer the event — "no connectivity"
        state.buffer.push(event);
        return []; // Nothing sent this cycle
    }
    // If we have buffered events, flush them all (connectivity recovery burst)
    if (state.buffer.length > 0) {
        const burst = [...state.buffer, event];
        state.buffer = [];
        return burst;
    }
    // Reset if shipment is complete
    if (state.progress >= 1.0) {
        activeShipments.delete(sensorIndex);
    }
    return [event];
}
/**
 * Linearly interpolates a position along a multi-point route.
 */
function interpolateRoute(route, progress) {
    const totalSegments = route.length - 1;
    const segmentProgress = progress * totalSegments;
    const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
    const t = segmentProgress - segmentIndex;
    const from = route[segmentIndex].coords;
    const to = route[segmentIndex + 1].coords;
    return [
        (0, noise_1.roundTo)(from[0] + (to[0] - from[0]) * t, 6),
        (0, noise_1.roundTo)(from[1] + (to[1] - from[1]) * t, 6),
    ];
}
//# sourceMappingURL=shipment.generator.js.map