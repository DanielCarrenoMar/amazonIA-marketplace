from pydantic import BaseModel, Field
from typing import List, Optional

class EvaluationRequest(BaseModel):
    shipment_id: str
    route_id: str
    route_points: List[dict] = Field(..., description="List of points {lat, lon}")
    transport_types: List[str]
    product_types: List[str]
    departure_date: str
    iot_device_id: Optional[str] = None
