from typing import List, Optional
from scipy.interpolate import interp1d

def interpolate_small_gaps(data: List[Optional[float]], max_gap: int = 2) -> List[Optional[float]]:
    """
    Interpolates missing values (None) in a 1D array using linear interpolation,
    but ONLY if the consecutive gap of missing values is <= max_gap.
    """
    if not data or all(v is None for v in data):
        return data
        
    valid_indices = [i for i, v in enumerate(data) if v is not None]
    if len(valid_indices) < 2:
        return data  # Cannot interpolate with less than 2 points
        
    valid_values = [data[i] for i in valid_indices]
    
    # Create the interpolation function. We use extrapolate in case the gap is at the edges.
    f = interp1d(valid_indices, valid_values, kind='linear', bounds_error=False, fill_value="extrapolate")
    
    result = list(data)
    
    # Find and fill gaps
    in_gap = False
    gap_start = -1
    for i in range(len(data) + 1):
        is_none = (i < len(data) and data[i] is None)
        if is_none:
            if not in_gap:
                in_gap = True
                gap_start = i
        else:
            if in_gap:
                gap_end = i - 1
                gap_length = gap_end - gap_start + 1
                
                # Fill only if gap is small enough
                if gap_length <= max_gap:
                    for j in range(gap_start, gap_end + 1):
                        # Use round to avoid floating point precision issues in tests if desired,
                        # but float() is mathematically fine. We'll leave it as float.
                        result[j] = float(f(j))
                
                in_gap = False
                
    return result
