import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth surface.
    Returns the distance in kilometers.
    """
    # Earth radius in kilometers
    R = 6371.0

    # Convert coordinates from degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
        
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

from typing import List, Dict

def interpolate_climate_idw(
    target_lat: float, 
    target_lon: float, 
    known_points: List[Dict], 
    variable_key: str,
    p: int = 2
) -> float:
    """
    Interpolates a climate variable for a target coordinate using Inverse Distance Weighting (IDW).
    
    Args:
        target_lat: Target point latitude.
        target_lon: Target point longitude.
        known_points: List of dicts, each with 'lat', 'lon', and the climate variable 'variable_key'.
        variable_key: The dictionary key of the climate variable to interpolate.
        p: The power parameter (typically 2 for gravity-like distance weighting).
        
    Returns:
        The interpolated value. Returns 0.0 if no valid neighbors exist.
    """
    if not known_points:
        return 0.0
        
    weighted_sum = 0.0
    weight_total = 0.0
    
    for point in known_points:
        val = point.get(variable_key)
        if val is None:
            continue
            
        dist = calculate_haversine_distance(target_lat, target_lon, point['lat'], point['lon'])
        
        # Guard against division by zero (exact same coordinates)
        if dist == 0:
            return val
            
        weight = 1.0 / (dist ** p)
        weighted_sum += val * weight
        weight_total += weight
        
    if weight_total == 0:
        return 0.0
        
    return weighted_sum / weight_total
