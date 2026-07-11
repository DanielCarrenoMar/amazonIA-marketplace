from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class RiskReason(BaseModel):
    impact: float
    feature: str

class HeuristicSegment(BaseModel):
    segment_idx: int
    coordinates: dict
    observation: str

class RiskResponse(BaseModel):
    shipment_id: str
    composite_score_pct: float
    alert_level: Literal["GREEN", "YELLOW", "RED"]
    message: str
    main_reasons: List[RiskReason]
    critical_segment: Optional[HeuristicSegment]
    shap_plot_base64: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
