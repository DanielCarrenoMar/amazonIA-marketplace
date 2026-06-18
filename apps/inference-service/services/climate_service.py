import httpx
from datetime import date
from typing import Dict, Any, Optional

class ClimateService:
    def __init__(self):
        self.archive_url = "https://archive-api.open-meteo.com/v1/archive"
        self.forecast_url = "https://api.open-meteo.com/v1/forecast"

    async def get_historical_climate(self, lat: float, lon: float, start_date: date, end_date: date) -> Optional[Dict[str, Any]]:
        """
        Fetches historical climate data from Open-Meteo Archive API.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max"],
            "timezone": "auto"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.archive_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "fuente": "open-meteo-archive",
                    "temperatura_max_c": data.get("daily", {}).get("temperature_2m_max", []),
                    "temperatura_min_c": data.get("daily", {}).get("temperature_2m_min", []),
                    "precipitacion_mm": data.get("daily", {}).get("precipitation_sum", []),
                    "velocidad_viento_ms": data.get("daily", {}).get("wind_speed_10m_max", [])
                }
            except Exception as e:
                print(f"Error fetching historical climate for ({lat}, {lon}): {e}")
                return None

    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> Optional[Dict[str, Any]]:
        """
        Fetches climate forecast from Open-Meteo API.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max"],
            "timezone": "auto",
            "forecast_days": days
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.forecast_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "fuente": "open-meteo-forecast",
                    "temperatura_max_c": data.get("daily", {}).get("temperature_2m_max", []),
                    "temperatura_min_c": data.get("daily", {}).get("temperature_2m_min", []),
                    "precipitacion_mm": data.get("daily", {}).get("precipitation_sum", []),
                    "velocidad_viento_ms": data.get("daily", {}).get("wind_speed_10m_max", [])
                }
            except Exception as e:
                print(f"Error fetching forecast for ({lat}, {lon}): {e}")
                return None

climate_service = ClimateService()
