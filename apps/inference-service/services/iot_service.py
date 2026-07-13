from upstash_redis.asyncio import Redis
from typing import Dict, Any, Optional
from core.config import settings

class IoTService:
    def __init__(self):
        # Usar SDK HTTP de Upstash Redis
        self.redis = Redis(url=settings.REDIS_URL, token=settings.REDIS_TOKEN)

    async def get_iot_telemetry(self, shipment_id: str) -> Dict[str, Any]:
        """
        Fetches the latest IoT telemetry for a shipment directly from Redis.
        If live data is missing or stale, fetches the moving average fallback.
        Uses HGETALL to get all fields at once (O(N) where N is small).
        """
        live_key = f"iot:stats:{shipment_id}"
        fallback_key = f"iot:fallback:{shipment_id}"
        
        try:
            # Try to get live data
            data = await self.redis.hgetall(live_key)
            if data:
                return {
                    "found": True,
                    "confianza_iot": 1.0, # High confidence since we have real-time sensor data
                    "data": {
                        "temp_interna_carga_c": float(data.get("temp_interna_carga_c", 25.0)),
                        "humedad_interna_carga_pct": float(data.get("humedad_interna_carga_pct", 60.0)),
                        "timestamp": data.get("timestamp")
                    }
                }
                
            # If no live data, try fallback (moving average calculated by ingestor)
            fallback_data = await self.redis.hgetall(fallback_key)
            if fallback_data:
                return {
                    "found": False, # False means not live, but we have fallback
                    "confianza_iot": 0.5, # Lower confidence for fallback
                    "data": {
                        "temp_interna_carga_c": float(fallback_data.get("avg_temp_c", 25.0)),
                        "humedad_interna_carga_pct": float(fallback_data.get("avg_humedad_pct", 60.0)),
                        "timestamp": fallback_data.get("last_updated")
                    }
                }
                
            # Total missing data
            return {
                "found": False,
                "confianza_iot": 0.25, # Very low confidence, rely entirely on rules
                "data": {}
            }
        except Exception as e:
            print(f"Error fetching IoT telemetry from Redis for shipment {shipment_id}: {e}")
            return {
                "found": False,
                "confianza_iot": 0.25,
                "data": {}
            }
            
    async def close(self):
        pass

iot_service = IoTService()
