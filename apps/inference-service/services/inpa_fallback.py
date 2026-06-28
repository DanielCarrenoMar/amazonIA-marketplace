from schemas.features import ClimateData

# Historical INPA approximation per month (1-12)
# Precipitation in mm/day, Temp in Celsius, Humidity in %, Wind in m/s, Radiation in W/m2
INPA_CLIMATOLOGY = {
    1: {"precip": 10.0, "max_temp": 32.0, "min_temp": 23.0, "humidity": 85.0, "wind": 1.5, "radiation": 350.0},
    2: {"precip": 12.0, "max_temp": 31.0, "min_temp": 23.0, "humidity": 86.0, "wind": 1.4, "radiation": 340.0},
    3: {"precip": 15.0, "max_temp": 31.0, "min_temp": 23.0, "humidity": 88.0, "wind": 1.2, "radiation": 330.0},
    4: {"precip": 16.0, "max_temp": 31.0, "min_temp": 23.0, "humidity": 89.0, "wind": 1.1, "radiation": 320.0},  # Peak wet
    5: {"precip": 13.0, "max_temp": 32.0, "min_temp": 23.0, "humidity": 87.0, "wind": 1.2, "radiation": 330.0},
    6: {"precip": 8.0,  "max_temp": 32.0, "min_temp": 22.0, "humidity": 85.0, "wind": 1.5, "radiation": 350.0},
    7: {"precip": 5.0,  "max_temp": 33.0, "min_temp": 22.0, "humidity": 82.0, "wind": 1.8, "radiation": 370.0},
    8: {"precip": 3.0,  "max_temp": 34.0, "min_temp": 23.0, "humidity": 80.0, "wind": 2.0, "radiation": 390.0},
    9: {"precip": 2.0,  "max_temp": 34.0, "min_temp": 24.0, "humidity": 78.0, "wind": 2.1, "radiation": 400.0},  # Peak dry
    10: {"precip": 4.0, "max_temp": 34.0, "min_temp": 24.0, "humidity": 80.0, "wind": 1.9, "radiation": 380.0},
    11: {"precip": 6.0, "max_temp": 33.0, "min_temp": 24.0, "humidity": 82.0, "wind": 1.7, "radiation": 370.0},
    12: {"precip": 8.0, "max_temp": 32.0, "min_temp": 23.0, "humidity": 84.0, "wind": 1.6, "radiation": 360.0},
}

def get_inpa_fallback_climate(month: int) -> ClimateData:
    """
    Returns a highly resilient ClimateData object populated with INPA historical
    averages based on the shipment month.
    """
    if month < 1 or month > 12:
        month = 1 # Default to Jan if invalid
        
    data = INPA_CLIMATOLOGY[month]
    
    # We populate the lists with 1 element so that our safe_avg and safe_sum functions work correctly.
    # 7-day accumulation will just extrapolate from this 1 day (1 day * 7).
    return ClimateData(
        daily_precip=[data["precip"]],
        daily_max_temp=[data["max_temp"]],
        daily_min_temp=[data["min_temp"]],
        daily_humidity=[data["humidity"]],
        daily_wind=[data["wind"]],
        daily_radiation=[data["radiation"]]
    )
