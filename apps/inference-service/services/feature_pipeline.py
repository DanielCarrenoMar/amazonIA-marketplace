from schemas.features import ClimateData, TelemetryData, ShipmentData, XGBoostFeatures, HydroData
from services.calculations import safe_max, safe_min, safe_avg, safe_sum, calculate_thermal_delta

def construir_features_globales(
    climate: ClimateData,
    telemetry: TelemetryData,
    shipment: ShipmentData,
    hydro: HydroData,
    is_inpa_fallback: bool = False
) -> XGBoostFeatures:
    """
    Core pipeline to transform raw data into ML features.
    1. Validates gap constraints
    2. Calculates aggregates using robust math
    3. Assembles the final contract vector
    Note: Categorical features are passed directly as strings, 
    XGBoost 2.x handles them natively with enable_categorical=True.
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
    
    # Determine hydrological regime string directly
    if shipment.month_of_year in [8, 9]:
        regime = "aguas_altas"
    elif shipment.month_of_year in [10, 11, 12]:
        regime = "descenso"
    elif shipment.month_of_year in [1, 2, 3, 4]:
        regime = "aguas_bajas"
    else:
        regime = "ascenso"
    
    # Complex derived feature
    thermal_delta = calculate_thermal_delta(max_temp_c, telemetry.internal_cargo_temp_c)
    
    # 4. Assemble the final feature vector based strictly on the model's contract
    return XGBoostFeatures(
        route_precip_mm=route_precip_mm,
        max_temp_c=max_temp_c,
        min_temp_c=min_temp_c,
        relative_humidity_pct=relative_humidity_pct,
        wind_speed_ms=wind_speed_ms,
        longwave_radiation=longwave_radiation,
        precip_7d_accum=precip_7d_accum,
        transport_type=shipment.transport_type,
        product_type=shipment.product_type,
        distance_km=shipment.distance_km,
        estimated_duration_days=shipment.estimated_duration_days,
        internal_cargo_temp_c=telemetry.internal_cargo_temp_c or 0.0,
        internal_cargo_humidity_pct=telemetry.internal_cargo_humidity_pct or 0.0,
        thermal_delta=thermal_delta,
        month_of_year=shipment.month_of_year,
        hydrological_regime=regime,
        river_level_m=hydro.river_level_m or 20.0,
        river_current_speed_ms=hydro.river_current_speed_ms or 1.5,
        is_inpa_fallback=is_inpa_fallback
    )
