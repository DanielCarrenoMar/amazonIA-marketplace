import os
import asyncio
import pandas as pd
import random
from datetime import date, timedelta
import httpx

# Real routes constants in the Amazon + Venezuela
ROUTES = [
    {"name": "Manaus-Belem", "lat": -3.119, "lon": -60.021, "type": "fluvial"},
    {"name": "PortoVelho-Manaus", "lat": -8.761, "lon": -63.903, "type": "fluvial"},
    {"name": "Manaus-BoaVista", "lat": -3.119, "lon": -60.021, "type": "terrestre"},
    {"name": "Caracas-Maracaibo", "lat": 10.480, "lon": -66.903, "type": "terrestre"},
    {"name": "Miami-LaGuaira", "lat": 10.601, "lon": -66.932, "type": "maritimo"},
    {"name": "Panama-PuertoCabello", "lat": 10.478, "lon": -68.012, "type": "maritimo"},
    {"name": "Bogota-Caracas", "lat": 4.711, "lon": -74.072, "type": "aereo"},
    {"name": "Miami-Caracas", "lat": 25.761, "lon": -80.191, "type": "aereo"}
]

PRODUCTS = ["perecedero_alto", "perecedero_bajo", "electronica", "general"]
NUM_SAMPLES = 15000 

def check_failure(route_type: str, product: str, max_temp: float, precip_sum: float,
                   wind_ms: float, river_discharge: float, nivel_rio: float) -> int:
    """
    Balanced failure heuristic. Wind values in m/s (consistent with inference service).
    Target failure rate: 6-10% across all transport types.
    A single moderate condition does NOT trigger failure alone.
    
    Reference m/s wind thresholds:
      4-6 m/s = light breeze (normal tropical trade winds)
      7-9 m/s = fresh breeze (choppy sea, some spray)
      10-12 m/s = strong breeze (rough conditions on water)
      > 12 m/s = near-gale (dangerous for small vessels)
    """
    risk_score = 0.0
    
    # 1. Temperature x product fragility
    if product == "perecedero_alto":
        if max_temp > 37.0: risk_score += 0.50    # Alone can trigger failure
        elif max_temp > 35.0: risk_score += 0.25  # Needs a second factor
        elif max_temp > 33.0: risk_score += 0.10  # Minor concern
    elif product == "perecedero_bajo":
        if max_temp > 38.5: risk_score += 0.40
        elif max_temp > 36.0: risk_score += 0.15
    
    # 2. Rain (7-day accumulated)
    if precip_sum > 110.0: risk_score += 0.35    # Heavy rainy week
    elif precip_sum > 65.0: risk_score += 0.15   # Moderate rain
    
    # 3. Wind in m/s — stricter for water transport
    if route_type in ["fluvial", "maritimo"]:
        if wind_ms > 11.0: risk_score += 0.45    # Near-gale on water
        elif wind_ms > 7.5: risk_score += 0.20   # Fresh breeze on vessels
    else:  # terrestre / aereo
        if wind_ms > 14.0: risk_score += 0.30    # Gale-level
        elif wind_ms > 10.0: risk_score += 0.10
    
    # 4. Fluvial-specific hydrology
    if route_type == "fluvial":
        if river_discharge > 3.0: risk_score += 0.30
        if nivel_rio < 10.5: risk_score += 0.25  # Low water level (drought)
    
    # 5. Stochastic: accidents, customs, mechanical
    risk_score += random.uniform(0.0, 0.15)
    
    if risk_score >= 0.75:
        return 1
    return 0


async def fetch_yearly_weather(client: httpx.AsyncClient, lat: float, lon: float, start_d: date, end_d: date) -> dict:
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_d.isoformat(),
        "end_date": end_d.isoformat(),
        "daily": ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"],
        "wind_speed_unit": "ms",  # Match the inference service — both must use m/s
        "timezone": "auto"
    }
    
    try:
        resp = await client.get(url, params=params, timeout=30.0)
        resp.raise_for_status()
        data = resp.json().get("daily", {})
        
        weather_map = {}
        if "time" in data:
            for i, d_str in enumerate(data["time"]):
                weather_map[d_str] = {
                    "temp": data["temperature_2m_max"][i] if data["temperature_2m_max"][i] is not None else 30.0,
                    "precip": data["precipitation_sum"][i] if data["precipitation_sum"][i] is not None else 0.0,
                    "wind": data["wind_speed_10m_max"][i] if data["wind_speed_10m_max"][i] is not None else 0.0
                }
        return weather_map
    except Exception as e:
        print(f"HTTP Error fetching {start_d} to {end_d}: {e}")
        return {}

async def fetch_yearly_hydro(client: httpx.AsyncClient, lat: float, lon: float, start_d: date, end_d: date) -> dict:
    url = "https://flood-api.open-meteo.com/v1/flood"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_d.isoformat(),
        "end_date": end_d.isoformat(),
        "daily": "river_discharge",
        "timezone": "auto"
    }
    
    try:
        resp = await client.get(url, params=params, timeout=30.0)
        resp.raise_for_status()
        data = resp.json().get("daily", {})
        
        hydro_map = {}
        if "time" in data:
            for i, d_str in enumerate(data["time"]):
                val = data["river_discharge"][i]
                hydro_map[d_str] = val if val is not None else 1.5
        return hydro_map
    except Exception as e:
        print(f"HTTP Error fetching hydro {start_d} to {end_d}: {e}")
        return {}

async def generate():
    print(f"Starting Synthetic Bootstrap Dataset generation ({NUM_SAMPLES} samples)...")
    start_date = date(2022, 1, 1)
    end_date = date(2023, 12, 31)
    
    print("Pre-fetching 2 years of climate and hydro data for all routes...")
    climate_cache = {}
    hydro_cache = {}
    async with httpx.AsyncClient() as client:
        for route in ROUTES:
            print(f"Fetching climate & hydro for {route['name']}...")
            climate_cache[route["name"]] = await fetch_yearly_weather(
                client, route["lat"], route["lon"], start_date, end_date
            )
            hydro_cache[route["name"]] = await fetch_yearly_hydro(
                client, route["lat"], route["lon"], start_date, end_date
            )
            await asyncio.sleep(1)
            
    delta = (end_date - start_date).days - 7
    dataset = []
    
    for i in range(NUM_SAMPLES):
        route = random.choice(ROUTES)
        product = random.choice(PRODUCTS)
        
        d = start_date + timedelta(days=random.randint(0, delta))
        
        route_climate = climate_cache.get(route["name"], {})
        route_hydro = hydro_cache.get(route["name"], {})
        
        t_max_list, p_sum_list, w_max_list, h_list = [], [], [], []
        
        for day_offset in range(7):
            current_day = (d + timedelta(days=day_offset)).isoformat()
            daily_stats = route_climate.get(current_day)
            daily_hydro = route_hydro.get(current_day)
            
            if daily_stats:
                t_max_list.append(daily_stats["temp"])
                p_sum_list.append(daily_stats["precip"])
                w_max_list.append(daily_stats["wind"])
            
            if daily_hydro is not None:
                h_list.append(daily_hydro)
                
        if t_max_list and h_list:
            max_temp = max(t_max_list)
            precip_sum = sum(p_sum_list)
            wind_ms = max(w_max_list)   # Already in m/s from API (wind_speed_unit=ms)
            
            avg_discharge = sum(h_list) / len(h_list)
            
            # Create variance in river level based on month (seasonality)
            month = d.month
            if month in [1, 2, 3, 4]:
                nivel_rio = random.uniform(8.0, 15.0) # Aguas bajas
            elif month in [8, 9]:
                nivel_rio = random.uniform(20.0, 28.0) # Aguas altas
            elif month in [5, 6, 7]:
                nivel_rio = random.uniform(15.0, 22.0) # Ascenso
            else:
                nivel_rio = random.uniform(12.0, 20.0) # Descenso
                
            failure = check_failure(route["type"], product, max_temp, precip_sum, wind_ms, avg_discharge, nivel_rio)
            
            dataset.append({
                "fecha_despacho": d.isoformat(),
                "ruta": route["name"],
                "lat": route["lat"],
                "lon": route["lon"],
                "tipo_transporte": route["type"],
                "tipo_producto": product,
                "max_temperatura_c": max_temp,
                "precipitacion_acum_mm": precip_sum,
                "max_viento_ms": wind_ms,
                "nivel_rio_m": round(nivel_rio, 2),
                "velocidad_corriente_rio_ms": round(avg_discharge, 2),
                "fracaso_logistico": failure
            })
            
        if (i + 1) % 5000 == 0:
            print(f"Generated {i+1}/{NUM_SAMPLES} simulated shipments...")

    df = pd.DataFrame(dataset)
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, "bootstrap_dataset.csv")
    
    df.to_csv(out_path, index=False)
    print(f"\n[SUCCESS] Dataset saved to {out_path} with {len(df)} records.")
    print(f"Synthetic Failure Rate (Danger): {df['fracaso_logistico'].mean() * 100:.1f}%")
    print(df.groupby(['tipo_transporte','fracaso_logistico']).size().unstack(fill_value=0))

if __name__ == "__main__":
    asyncio.run(generate())
