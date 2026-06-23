from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class MissingClimateDataError(ValueError):
    """Raised when 100% of a critical climate array is None/missing (Fail-fast)."""
    pass

class ClimateData(BaseModel):
    """Raw climate data from NASA POWER or INPA. Lists represent daily values."""
    daily_precip: List[Optional[float]] = Field(default_factory=list)
    daily_max_temp: List[Optional[float]] = Field(default_factory=list)
    daily_min_temp: List[Optional[float]] = Field(default_factory=list)
    daily_humidity: List[Optional[float]] = Field(default_factory=list)
    daily_wind: List[Optional[float]] = Field(default_factory=list)
    daily_radiation: List[Optional[float]] = Field(default_factory=list)

    def validate_no_critical_gaps(self):
        """Raises MissingClimateDataError if critical arrays are completely empty or None."""
        critical_fields = ["daily_precip", "daily_max_temp"]
        for field_name in critical_fields:
            data_list = getattr(self, field_name)
            if not data_list or all(v is None for v in data_list):
                raise MissingClimateDataError(
                    f"Critical climate array '{field_name}' is entirely missing or null."
                )

class TelemetryData(BaseModel):
    """IoT telemetry data from the shipment."""
    internal_cargo_temp_c: Optional[float] = None
    internal_cargo_humidity_pct: Optional[float] = None

class ShipmentData(BaseModel):
    """Static metadata of the shipment segment."""
    transport_type: str
    product_type: str
    distance_km: float
    estimated_duration_days: float
    month_of_year: int

class XGBoostFeatures(BaseModel):
    """
    The feature vector required by the XGBoost model.
    Python code uses English names, but we use 'alias' so that .model_dump(by_alias=True)
    outputs the exact Spanish column names the model was trained on.
    """
    model_config = ConfigDict(populate_by_name=True)
    
    route_precip_mm: float = Field(..., alias="precipitacion_ruta_mm")
    max_temp_c: float = Field(..., alias="temperatura_max_c")
    min_temp_c: float = Field(..., alias="temperatura_min_c")
    relative_humidity_pct: float = Field(..., alias="humedad_relativa_pct")
    wind_speed_ms: float = Field(..., alias="velocidad_viento_ms")
    longwave_radiation: float = Field(..., alias="radiacion_onda_larga")
    precip_7d_accum: float = Field(..., alias="precipitacion_7d_acum")
    transport_type_enc: int = Field(..., alias="tipo_transporte_enc")
    product_type_enc: int = Field(..., alias="tipo_producto_enc")
    distance_km: float = Field(..., alias="distancia_km")
    estimated_duration_days: float = Field(..., alias="duracion_estimada_dias")
    internal_cargo_temp_c: float = Field(..., alias="temp_interna_carga_c")
    internal_cargo_humidity_pct: float = Field(..., alias="humedad_interna_carga_pct")
    thermal_delta: float = Field(..., alias="delta_termico")
    month_of_year: int = Field(..., alias="mes_del_anio")
    hydrological_regime_enc: int = Field(..., alias="regimen_hidrologico_enc")
