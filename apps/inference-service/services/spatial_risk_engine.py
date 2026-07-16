import asyncio
import json
import logging
from datetime import date, datetime
from upstash_redis.asyncio import Redis

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from core.config import settings
from services.climate_service import climate_service
from services.hydro_service import hydro_service

logger = logging.getLogger("SpatialRiskEngine")

ZONES = [
    {"id": "iquitos", "name": "Iquitos", "lat": -3.74, "lon": -73.25},
    {"id": "leticia", "name": "Leticia", "lat": -4.21, "lon": -69.94},
    {"id": "manaos", "name": "Manaos", "lat": -3.11, "lon": -60.02},
]

class SpatialRiskEngine:
    def __init__(self):
        self.redis = Redis(url=settings.REDIS_URL, token=settings.REDIS_TOKEN)
        
    async def update_zones_data(self):
        """
        Fetches the latest climate and hydro data for all defined zones
        and saves it to Redis. This avoids slow API calls during user requests.
        """
        logger.info("Starting zone data update...")
        today = date.today()
        
        for zone in ZONES:
            zone_id = zone["id"]
            lat = zone["lat"]
            lon = zone["lon"]
            
            try:
                # 1. Fetch Forecast (7 days)
                climate = await climate_service.get_forecast(lat, lon, days=7)
                
                # 2. Fetch Hydro Data
                hydro = await hydro_service.get_hydro_data(lat, lon, today)
                
                if climate and hydro:
                    # Save to Redis
                    key = f"zone:data:{zone_id}"
                    data = {
                        "climate": climate,
                        "hydro": hydro,
                        "lat": lat,
                        "lon": lon,
                        "last_updated": datetime.utcnow().isoformat()
                    }
                    await self.redis.set(key, json.dumps(data))
                    logger.info(f"Successfully updated data for zone {zone['name']}")
                else:
                    logger.warning(f"Failed to fetch complete data for zone {zone['name']}")
                    
            except Exception as e:
                logger.error(f"Error updating zone {zone['name']}: {e}")
                
    async def scheduler_loop(self, interval_minutes=30):
        """
        Runs the update task periodically.
        """
        logger.info(f"Starting SpatialRiskEngine scheduler (every {interval_minutes} minutes)")
        while True:
            await self.update_zones_data()
            await asyncio.sleep(interval_minutes * 60)

spatial_engine = SpatialRiskEngine()
