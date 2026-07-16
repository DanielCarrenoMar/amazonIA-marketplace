from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class EvaluationRequest(BaseModel):
    shipment_id: str
    route_id: str
    route_points: List[dict] = Field(..., description="List of points {lat, lon}")
    transport_types: List[str]
    product_types: List[str]
    departure_date: str
    iot_device_id: Optional[str] = None

    @field_validator("route_points")
    @classmethod
    def validate_route_points(cls, v):
        if len(v) < 2:
            raise ValueError("route_points must contain at least 2 points (origin and destination)")
        for pt in v:
            if "lat" not in pt or "lon" not in pt:
                raise ValueError("each route_point requires 'lat' and 'lon'")
            if not (-90 <= pt["lat"] <= 90) or not (-180 <= pt["lon"] <= 180):
                raise ValueError(f"invalid coordinates: {pt}")
        return v
