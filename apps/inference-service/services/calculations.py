from typing import List, Optional

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
