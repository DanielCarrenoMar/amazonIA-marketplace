export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export enum TransportType {
  TERRESTRE = 'TERRESTRE',
  AEREO = 'AEREO',
  MARITIMO = 'MARITIMO',
}

// ---------------------------------------------------------------------------
// Tribe Enums
// ---------------------------------------------------------------------------

export enum TribeStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum MembershipRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ---------------------------------------------------------------------------
// IoT / Telemetry Enums
// ---------------------------------------------------------------------------

export enum IoTEventType {
  ENVIRONMENT_READING = 'environment_reading',
  SHIPMENT_TELEMETRY = 'shipment_telemetry',
}

export enum ShipmentStatus {
  PENDING_PICKUP = 'pending_pickup',
  IN_TRANSIT = 'in_transit',
  IN_WAREHOUSE = 'in_warehouse',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

export enum ScanType {
  PASSIVE_RFID = 'passive_rfid',
  ACTIVE_RFID = 'active_rfid',
  BARCODE = 'barcode',
  QR_CODE = 'qr_code',
  GPS = 'gps',
  MANUAL = 'manual',
}

export enum SensorType {
  FIXED_HVAC = 'fixed_hvac',
  FIXED_COLD_STORAGE = 'fixed_cold_storage',
  MOBILE_TRUCK = 'mobile_truck',
  MOBILE_DRONE = 'mobile_drone',
  WEARABLE = 'wearable',
  CLIMATE_BASIC = 'climate_basic',
  CLIMATE_STANDARD = 'climate_standard',
  CLIMATE_ADVANCED = 'climate_advanced',
}
