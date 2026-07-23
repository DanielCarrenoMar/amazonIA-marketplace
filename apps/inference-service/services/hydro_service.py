import httpx
from datetime import date
from typing import Optional

class HydroService:
    def __init__(self):
        # En producción, esto apuntaría a la API de Telemetría de la ANA (Brasil)
        self.api_url = "https://www.ana.gov.br/telemetria/api"

    async def get_hydro_data(self, lat: float, lon: float, query_date: date) -> dict:
        """
        Obtiene datos hidrológicos reales conectándose a la Flood API de Open-Meteo
        (Global Flood Awareness System - GloFAS).
        """
        api_url = "https://flood-api.open-meteo.com/v1/flood"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": query_date.isoformat(),
            "end_date": query_date.isoformat(),
            "daily": "river_discharge",
            "timezone": "auto"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(api_url, params=params, timeout=10.0)
                resp.raise_for_status()
                data = resp.json().get("daily", {})
                
                descargas = data.get("river_discharge", [None])
                discharge = descargas[0] if descargas and descargas[0] is not None else 1.5
                
                # Transformamos la descarga volumétrica en nuestra métrica proxy de corriente
                # Asumimos un nivel base correlacionado para la API de inferencia
                nivel_base = max(18.0, 18.0 + (discharge * 0.005))
                velocidad_corriente = discharge * 0.1
                
                return {
                    "river_level_m": round(nivel_base, 2),
                    "river_current_speed_ms": round(velocidad_corriente, 2)
                }
        except Exception as e:
            print(f"Error fetching real hydro data: {e}. Fallback to heuristics.")
            return {
                "river_level_m": 20.0,
                "river_current_speed_ms": 1.5
            }

hydro_service = HydroService()
