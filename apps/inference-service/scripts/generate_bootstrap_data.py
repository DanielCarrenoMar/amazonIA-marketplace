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

async def fetch_weather_for_period(client: httpx.AsyncClient, lat: float, lon: float, start_d: date, end_d: date) -> dict | None:
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
        resp = await client.get(url, params=params, timeout=15.0)
        resp.raise_for_status()
        return resp.json().get("daily")
    except Exception as e:
        print(f"HTTP Error fetching {start_d} to {end_d}: {e}")
        return None

async def generate():
    print("Starting Synthetic Bootstrap Dataset generation...")
    start_date = date(2023, 1, 1)
    end_date = date(2023, 12, 31)
    
    # We take 100 random days of the year to avoid abusing the API rate limit in the initial test.
    # In production this script would run for 365 days of the year * N routes.
    delta = (end_date - start_date).days
    sampled_days = [start_date + timedelta(days=random.randint(0, delta)) for _ in range(100)]
    
    dataset = []
    
    async with httpx.AsyncClient() as client:
        for i, d in enumerate(sampled_days):
            route = random.choice(ROUTES)
            product = random.choice(PRODUCTS)
            
            # We simulate that each shipment takes 7 days. We extract the weather for that week of route.
            d_end = d + timedelta(days=7)
            weather = await fetch_weather_for_period(client, route["lat"], route["lon"], d, d_end)
            
            if weather:
                # Global Aggregation (Max pooling) that simulates what XGBoost will learn
                t_max = weather.get("temperature_2m_max", [])
                p_sum = weather.get("precipitation_sum", [])
                w_max = weather.get("wind_speed_10m_max", [])
                
                max_temp = max([t for t in t_max if t is not None]) if any(t is not None for t in t_max) else 30.0
                precip_sum = sum([p for p in p_sum if p is not None])
                wind_speed = max([w for w in w_max if w is not None]) if any(w is not None for w in w_max) else 0.0
                
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
            
            if (i + 1) % 10 == 0:
                print(f"Processed {i+1}/100 simulated shipments...")
                await asyncio.sleep(0.5) # Light throttle for Open-Meteo

    df = pd.DataFrame(dataset)
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, "bootstrap_dataset.csv")
    
    df.to_csv(out_path, index=False)
    print(f"\n[SUCCESS] Dataset saved to {out_path} with {len(df)} records.")
    print(f"Synthetic Failure Rate (Danger): {df['fracaso_logistico'].mean() * 100:.1f}%")

if __name__ == "__main__":
    asyncio.run(generate())
