import httpx
from datetime import date
from typing import Dict, Any, Optional
from services.temporal_interpolation import interpolate_small_gaps

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
            "timezone": "auto",
            "wind_speed_unit": "ms"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.archive_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                if "daily" not in data:
                    raise ValueError(f"Open-Meteo returned invalid historical data: {data}")
                
                precip = data.get("daily", {}).get("precipitation_sum", [])
                if not precip or all(p is None for p in precip):
                    raise ValueError("Open-Meteo returned null arrays for historical precipitation")
                
                return {
                    "fuente": "open-meteo-archive",
                    "temperatura_max_c": interpolate_small_gaps(data.get("daily", {}).get("temperature_2m_max", []), max_gap=2),
                    "temperatura_min_c": interpolate_small_gaps(data.get("daily", {}).get("temperature_2m_min", []), max_gap=2),
                    "precipitacion_mm": interpolate_small_gaps(data.get("daily", {}).get("precipitation_sum", []), max_gap=2),
                    "velocidad_viento_ms": interpolate_small_gaps(data.get("daily", {}).get("wind_speed_10m_max", []), max_gap=2)
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
            "forecast_days": days,
            "wind_speed_unit": "ms"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.forecast_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                if "daily" not in data:
                    raise ValueError(f"Open-Meteo returned invalid forecast data: {data}")
                
                precip = data.get("daily", {}).get("precipitation_sum", [])
                if not precip or all(p is None for p in precip):
                    raise ValueError("Open-Meteo returned null arrays for forecast precipitation")
                
                return {
                    "fuente": "open-meteo-forecast",
                    "temperatura_max_c": interpolate_small_gaps(data.get("daily", {}).get("temperature_2m_max", []), max_gap=2),
                    "temperatura_min_c": interpolate_small_gaps(data.get("daily", {}).get("temperature_2m_min", []), max_gap=2),
                    "precipitacion_mm": interpolate_small_gaps(data.get("daily", {}).get("precipitation_sum", []), max_gap=2),
                    "velocidad_viento_ms": interpolate_small_gaps(data.get("daily", {}).get("wind_speed_10m_max", []), max_gap=2)
                }
            except Exception as e:
                print(f"Error fetching forecast for ({lat}, {lon}): {e}")
                return None

climate_service = ClimateService()
