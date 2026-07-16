from typing import List, Optional

# Velocidad promedio asumida por modo de transporte, solo para estimar duración
# en metadata/auditoría. El modelo XGBoost NO usa estimated_duration_days como
# feature (no está en model_service.model_features) — seguro de refinar después
# sin afectar el score de riesgo. TODO: reemplazar con ETA real de un motor de ruteo.
ASSUMED_SPEED_KMH = {"terrestre": 60.0, "fluvial": 15.0, "maritimo": 25.0, "aereo": 500.0}
DEFAULT_SPEED_KMH = 40.0

def estimate_duration_days(distance_km: float, transport_type: str) -> float:
    """Estimates transit duration in days from distance and assumed transport speed."""
    speed = ASSUMED_SPEED_KMH.get(transport_type, DEFAULT_SPEED_KMH)
    return round(distance_km / speed / 24.0, 2) if speed > 0 else 5.0

def safe_max(values: List[Optional[float]], default: float = 0.0) -> float:
    """Returns the maximum ignoring None values, or default if empty/all None."""
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return default
    return max(valid_values)

def safe_min(values: List[Optional[float]], default: float = 0.0) -> float:
    """Returns the minimum ignoring None values, or default if empty/all None."""
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return default
    return min(valid_values)

def safe_sum(values: List[Optional[float]], default: float = 0.0) -> float:
    """
    Returns the sum. If there are gaps (None), it extrapolates the sum based on the 
    average of the valid days to prevent underestimating accumulated metrics like rain.
    """
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return default
        
    total_valid = sum(valid_values)
    num_valid = len(valid_values)
    total_len = len(values)
    
    # Extrapolate for the missing days
    average_per_day = total_valid / num_valid
    return average_per_day * total_len

def safe_avg(values: List[Optional[float]], default: float = 0.0) -> float:
    """Returns the average ignoring None values."""
    valid_values = [v for v in values if v is not None]
    if not valid_values:
        return default
    return sum(valid_values) / len(valid_values)

def calculate_thermal_delta(max_external_temp: float, internal_cargo_temp: Optional[float]) -> float:
    """
    Calculates the absolute difference between the external maximum temperature
    and the internal cargo temperature. Returns 0 if internal temperature is missing.
    """
    if internal_cargo_temp is None:
        return 0.0
    return abs(max_external_temp - internal_cargo_temp)
