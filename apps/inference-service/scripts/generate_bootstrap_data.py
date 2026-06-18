import os
import asyncio
import pandas as pd
import random
from datetime import date, timedelta
import httpx

# Real routes constants in the Amazon
ROUTES = [
    {"name": "Manaus-Belem", "lat": -3.119, "lon": -60.021, "type": "fluvial"},
    {"name": "PortoVelho-Manaus", "lat": -8.761, "lon": -63.903, "type": "fluvial"},
    {"name": "Manaus-BoaVista", "lat": -3.119, "lon": -60.021, "type": "terrestre"}
]

PRODUCTS = ["perecedero_alto", "perecedero_bajo", "electronica", "general"]
NUM_SAMPLES = 15000 # Increased dataset size

def check_failure(route_type: str, product: str, max_temp: float, precip_sum: float, wind_speed: float) -> int:
    """
    Applies hard heuristics of Amazon logistics to determine if the shipment fails.
    """
    # 1. Fluvial routes with extreme rain (floods, navigation hazards)
    if route_type == "fluvial" and precip_sum > 100.0:
        return 1
    # 2. Perishables in extreme heat (cold chain failure)
    if product == "perecedero_alto" and max_temp > 35.0:
        return 1
    # 3. Strong winds on vessels
    if route_type == "fluvial" and wind_speed > 25.0:
        return 1
    # 4. Base stochastic factor (random accidents, etc.)
    if random.random() < 0.05:
        return 1
        
    return 0

async def fetch_yearly_weather(client: httpx.AsyncClient, lat: float, lon: float, start_d: date, end_d: date) -> dict:
    """
    Fetches the weather for a whole year to avoid rate limits and speed up generation.
    Returns a dictionary mapping 'YYYY-MM-DD' to daily weather stats.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_d.isoformat(),
        "end_date": end_d.isoformat(),
        "daily": ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"],
        "timezone": "auto"
    }
    
    try:
        resp = await client.get(url, params=params, timeout=30.0)
        resp.raise_for_status()
        data = resp.json().get("daily", {})
        
        # Convert parallel arrays into a date-indexed dictionary
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

async def generate():
    print(f"Starting Synthetic Bootstrap Dataset generation ({NUM_SAMPLES} samples)...")
    start_date = date(2022, 1, 1)
    end_date = date(2023, 12, 31) # 2 years of data
    
    # 1. Pre-fetch all weather data for our 3 routes to save time and API calls
    print("Pre-fetching 2 years of climate data for all routes...")
    climate_cache = {}
    async with httpx.AsyncClient() as client:
        for route in ROUTES:
            print(f"Fetching climate for {route['name']}...")
            climate_cache[route["name"]] = await fetch_yearly_weather(
                client, route["lat"], route["lon"], start_date, end_date
            )
            await asyncio.sleep(1) # Be nice to the API
            
    # 2. Generate random shipments using the cached data
    delta = (end_date - start_date).days - 7 # Leave room for the 7-day trip
    dataset = []
    
    for i in range(NUM_SAMPLES):
        route = random.choice(ROUTES)
        product = random.choice(PRODUCTS)
        
        # Random start date
        d = start_date + timedelta(days=random.randint(0, delta))
        
        # Aggregate the 7-day trip from cache
        route_climate = climate_cache.get(route["name"], {})
        
        t_max_list, p_sum_list, w_max_list = [], [], []
        
        for day_offset in range(7):
            current_day = (d + timedelta(days=day_offset)).isoformat()
            daily_stats = route_climate.get(current_day)
            if daily_stats:
                t_max_list.append(daily_stats["temp"])
                p_sum_list.append(daily_stats["precip"])
                w_max_list.append(daily_stats["wind"])
                
        if t_max_list:
            max_temp = max(t_max_list)
            precip_sum = sum(p_sum_list)
            wind_speed = max(w_max_list)
            
            failure = check_failure(route["type"], product, max_temp, precip_sum, wind_speed)
            
            dataset.append({
                "fecha_despacho": d.isoformat(),
                "ruta": route["name"],
                "lat": route["lat"],
                "lon": route["lon"],
                "tipo_transporte": route["type"],
                "tipo_producto": product,
                "max_temperatura_c": max_temp,
                "precipitacion_acum_mm": precip_sum,
                "max_viento_ms": wind_speed,
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

if __name__ == "__main__":
    asyncio.run(generate())
