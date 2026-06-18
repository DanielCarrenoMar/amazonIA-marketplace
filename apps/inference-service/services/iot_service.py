from redis.asyncio import Redis
from typing import Dict, Any, Optional
from core.config import settings

class IoTService:
    def __init__(self):
        # Initialize connection pool to avoid creating a new connection per request
        self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get_iot_telemetry(self, shipment_id: str) -> Dict[str, Any]:
        """
        Fetches the latest IoT telemetry for a shipment directly from Redis.
        Uses HGETALL to get all fields at once (O(N) where N is small).
        """
        key = f"iot:stats:{shipment_id}"
        try:
            data = await self.redis.hgetall(key)
            if not data:
                return {
                    "found": False,
                    "confianza_iot": 0.5, # Lower confidence if we must fallback to historical means
                    "data": {}
                }
            
            return {
                "found": True,
                "confianza_iot": 1.0, # High confidence since we have real-time sensor data
                "data": {
                    "temp_interna_carga_c": float(data.get("temp_interna_carga_c", 25.0)),
                    "humedad_interna_carga_pct": float(data.get("humedad_interna_carga_pct", 60.0)),
                    "timestamp": data.get("timestamp")
                }
            }
        except Exception as e:
            print(f"Error fetching IoT telemetry from Redis for shipment {shipment_id}: {e}")
            return {
                "found": False,
                "confianza_iot": 0.5,
                "data": {}
            }
            
    async def close(self):
        await self.redis.close()

iot_service = IoTService()
