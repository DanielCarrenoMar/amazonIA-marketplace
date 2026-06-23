from schemas.features import ClimateData, TelemetryData, ShipmentData, XGBoostFeatures
from services.calculations import safe_max, safe_min, safe_avg, safe_sum, calculate_thermal_delta

class EncodersMock:
    """
    Mock class for LabelEncoders. In production, this would be replaced
    by loading actual encoders using joblib: joblib.load('encoder_transporte.pkl').
    """
    @staticmethod
    def encode_transport(value: str) -> int:
        mapping = {"fluvial": 0, "terrestre": 1, "mixto": 2}
        return mapping.get(value.lower(), 1)  # Default terrestrial

    @staticmethod
    def encode_product(value: str) -> int:
        mapping = {"perecedero_alto": 0, "perecedero_bajo": 1, "artesania": 2}
        return mapping.get(value.lower(), 1)

    @staticmethod
    def encode_regime(month: int) -> int:
        # Determine hydrological regime based on Amazon basin logic
        if month in [8, 9]:
            regime = "aguas_altas"
        elif month in [10, 11, 12]:
            regime = "descenso"
        elif month in [1, 2, 3, 4]:
            regime = "aguas_bajas"
        else:
            regime = "ascenso"
            
        mapping = {"aguas_altas": 0, "descenso": 1, "aguas_bajas": 2, "ascenso": 3}
        return mapping.get(regime, 0)


def construir_features_globales(
    climate: ClimateData,
    telemetry: TelemetryData,
    shipment: ShipmentData,
    is_inpa_fallback: bool = False
) -> XGBoostFeatures:
    """
    Core pipeline to transform raw data into ML features.
    1. Validates gap constraints
    2. Calculates aggregates using robust math
    3. Encodes categorical variables
    4. Assembles the final contract vector
    """
    # 1. Validation (Fail-fast if completely empty)
    climate.validate_no_critical_gaps()
    
    # 2. Extract global aggregates mathematically
    route_precip_mm = safe_max(climate.daily_precip, default=0.0)
    max_temp_c = safe_max(climate.daily_max_temp, default=30.0)
    min_temp_c = safe_min(climate.daily_min_temp, default=20.0)
    relative_humidity_pct = safe_avg(climate.daily_humidity, default=80.0)
    wind_speed_ms = safe_max(climate.daily_wind, default=2.0)
    longwave_radiation = safe_max(climate.daily_radiation, default=350.0)
    precip_7d_accum = safe_sum(climate.daily_precip, default=0.0)
    
    # Complex derived feature
    thermal_delta = calculate_thermal_delta(max_temp_c, telemetry.internal_cargo_temp_c)
    
    # 3. Categorical Encoders
    transport_enc = EncodersMock.encode_transport(shipment.transport_type)
    product_enc = EncodersMock.encode_product(shipment.product_type)
    regime_enc = EncodersMock.encode_regime(shipment.month_of_year)
    
    # 4. Assemble the final feature vector based strictly on the model's contract
    # Remember: internal Python code uses English, but alias ensures proper export.
    return XGBoostFeatures(
        route_precip_mm=route_precip_mm,
        max_temp_c=max_temp_c,
        min_temp_c=min_temp_c,
        relative_humidity_pct=relative_humidity_pct,
        wind_speed_ms=wind_speed_ms,
        longwave_radiation=longwave_radiation,
        precip_7d_accum=precip_7d_accum,
        transport_type_enc=transport_enc,
        product_type_enc=product_enc,
        distance_km=shipment.distance_km,
        estimated_duration_days=shipment.estimated_duration_days,
        internal_cargo_temp_c=telemetry.internal_cargo_temp_c or 0.0,
        internal_cargo_humidity_pct=telemetry.internal_cargo_humidity_pct or 0.0,
        delta_termico=thermal_delta,
        month_of_year=shipment.month_of_year,
        hydrological_regime_enc=regime_enc,
        is_inpa_fallback=is_inpa_fallback
    )
