from fastapi import APIRouter, Depends, Query
import asyncio
import json
import math
from datetime import datetime, date, timedelta
from typing import Optional
from schemas.request import EvaluationRequest
from schemas.response import RiskResponse, RiskReason, HeuristicSegment
from middleware.auth import verify_jwt
from services.iot_service import iot_service
from services.climate_service import climate_service
from services.hydro_service import hydro_service
from services.model_service import model_service
from schemas.features import ClimateData, TelemetryData, ShipmentData, HydroData
from services.feature_pipeline import construir_features_globales
from services.inpa_fallback import get_inpa_fallback_climate
from services.spatial import interpolate_climate_idw, calculate_haversine_distance
from services.spatial_risk_engine import ZONES
from services.calculations import estimate_duration_days

router = APIRouter(prefix="/api/v1/risk", tags=["Risk"])

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcula distancia euclidiana simple para ponderar"""
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

def find_critical_segment(climate_list: list[ClimateData], route_points: list[dict]) -> HeuristicSegment:
    """Identifies which route point has the most dangerous individual climate reading,
    so the response can point at a specific segment instead of always the first point."""
    best_idx = 0
    best_severity = -1.0
    best_hazard = None

    for i, climate in enumerate(climate_list):
        if climate is None or i >= len(route_points):
            continue
        max_precip = max((v for v in climate.daily_precip if v is not None), default=0.0)
        max_temp = max((v for v in climate.daily_max_temp if v is not None), default=0.0)
        max_wind = max((v for v in climate.daily_wind if v is not None), default=0.0)

        hazards = {
            "precip": max(0.0, (max_precip - 50.0) / 50.0) * 0.5,
            "temp": max(0.0, (max_temp - 30.0) / 10.0) * 0.3,
            "wind": max(0.0, (max_wind - 15.0) / 15.0) * 0.2,
        }
        dominant_hazard = max(hazards, key=hazards.get)
        severity = hazards[dominant_hazard]

        if severity > best_severity:
            best_severity = severity
            best_idx = i
            best_hazard = dominant_hazard if severity > 0 else None

    observations = {
        "precip": "Riesgo de lluvias intensas en este tramo.",
        "temp": "Riesgo de temperatura extrema en este tramo.",
        "wind": "Riesgo de vientos fuertes en este tramo.",
        None: "Segmento principal evaluado.",
    }

    return HeuristicSegment(
        segment_idx=best_idx,
        coordinates=route_points[best_idx],
        observation=observations[best_hazard]
    )

CLIMATE_DAILY_FIELDS = [
    "daily_precip", "daily_max_temp", "daily_min_temp",
    "daily_humidity", "daily_wind", "daily_radiation"
]

def fill_missing_climate_with_idw(climate_list: list[Optional[ClimateData]], route_points: list[dict]) -> list[ClimateData]:
    """Fills route points whose climate fetch failed by spatially interpolating (IDW),
    per day and per variable, from the points that did succeed. Only points that
    genuinely have no data get replaced — a partial climate failure should not force
    the whole route onto the generic INPA climatology fallback."""
    known_indices = [i for i, c in enumerate(climate_list) if c is not None]
    missing_indices = [i for i, c in enumerate(climate_list) if c is None]
    if not known_indices or not missing_indices:
        return climate_list

    days = max(len(getattr(climate_list[i], "daily_precip")) for i in known_indices)
    result = list(climate_list)

    for m in missing_indices:
        target = route_points[m]
        filled_values = {}
        for field in CLIMATE_DAILY_FIELDS:
            day_values = []
            for day in range(days):
                known_day_points = []
                for i in known_indices:
                    series = getattr(climate_list[i], field)
                    if day < len(series) and series[day] is not None:
                        known_day_points.append({"lat": route_points[i]["lat"], "lon": route_points[i]["lon"], "v": series[day]})
                day_values.append(interpolate_climate_idw(target["lat"], target["lon"], known_day_points, "v") if known_day_points else None)
            filled_values[field] = day_values
        result[m] = ClimateData(**filled_values)

    return result

def aggregate_route_climate(climate_list: list[ClimateData]) -> ClimateData:
    """Consolida el clima de toda la ruta calculando el 'peor caso' (máximos y mínimos críticos) por día."""
    if not climate_list:
        return None
    valid_climates = [c for c in climate_list if c is not None]
    if not valid_climates:
        return None
        
    days = max((len(c.daily_precip) for c in valid_climates), default=0)
    
    aggregated = ClimateData(
        daily_precip=[], daily_max_temp=[], daily_min_temp=[],
        daily_humidity=[], daily_wind=[], daily_radiation=[]
    )
    
    for i in range(days):
        precip = [c.daily_precip[i] for c in valid_climates if i < len(c.daily_precip) and c.daily_precip[i] is not None]
        max_t = [c.daily_max_temp[i] for c in valid_climates if i < len(c.daily_max_temp) and c.daily_max_temp[i] is not None]
        min_t = [c.daily_min_temp[i] for c in valid_climates if i < len(c.daily_min_temp) and c.daily_min_temp[i] is not None]
        hum = [c.daily_humidity[i] for c in valid_climates if i < len(c.daily_humidity) and c.daily_humidity[i] is not None]
        wind = [c.daily_wind[i] for c in valid_climates if i < len(c.daily_wind) and c.daily_wind[i] is not None]
        rad = [c.daily_radiation[i] for c in valid_climates if i < len(c.daily_radiation) and c.daily_radiation[i] is not None]
        
        aggregated.daily_precip.append(max(precip) if precip else None)
        aggregated.daily_max_temp.append(max(max_t) if max_t else None)
        aggregated.daily_min_temp.append(min(min_t) if min_t else None)
        aggregated.daily_humidity.append(max(hum) if hum else None)
        aggregated.daily_wind.append(max(wind) if wind else None)
        aggregated.daily_radiation.append(max(rad) if rad else None)
        
    return aggregated

@router.get("/spatial")
async def get_spatial_risk(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    transport_type: str = Query("terrestre"),
    product_type: str = Query("perecedero_bajo"),
    # user_payload: dict = Depends(verify_jwt) # Podemos activarlo luego si es necesario
):
    """
    Consulta rápida del riesgo espacial basado en las zonas pre-calculadas en Redis.
    (Respuesta rápida < 100ms)
    """
    try:
        # 1. Leer datos pre-calculados de las zonas desde Redis
        zone_data = []
        for zone in ZONES:
            raw = await iot_service.redis.get(f"zone:data:{zone['id']}")
            if raw:
                try:
                    data = json.loads(raw)
                    # Si el dato se parseo bien como string, lo pasamos a dict
                    if isinstance(data, str):
                        data = json.loads(data)
                    zone_data.append({**zone, "data": data})
                except Exception as e:
                    print(f"Error parsing zone {zone['id']}: {e}")
                    
        if not zone_data:
            return {"status": "error", "message": "No spatial data available yet. Background worker is warming up."}
            
        # 2. Encontrar la zona más cercana
        nearest_zone = min(zone_data, key=lambda z: calculate_distance(lat, lon, z["lat"], z["lon"]))
        climate_res = nearest_zone["data"]["climate"]
        hydro_res = nearest_zone["data"]["hydro"]
        
        climate_data = ClimateData(
            daily_max_temp=climate_res.get("temperatura_max_c", []),
            daily_min_temp=climate_res.get("temperatura_min_c", []),
            daily_precip=climate_res.get("precipitacion_mm", []),
            daily_wind=climate_res.get("velocidad_viento_ms", [])
        )
        
        hydro_data = HydroData(
            river_level_m=hydro_res["river_level_m"],
            river_current_speed_ms=hydro_res["river_current_speed_ms"]
        )
        
        shipment = ShipmentData(
            transport_type=transport_type,
            product_type=product_type,
            distance_km=100.0,
            estimated_duration_days=5.0,
            month_of_year=date.today().month
        )
        
        telemetry = TelemetryData(temperature=None, humidity=None) # No live telemetry for spatial query
        
        # 3. Construir features y predecir
        xgboost_features = construir_features_globales(
            climate=climate_data,
            telemetry=telemetry,
            shipment=shipment,
            hydro=hydro_data,
            is_inpa_fallback=False
        )
        
        prediction = model_service.predict_risk(xgboost_features.model_dump(by_alias=True))
        composite_score_pct = min(100.0, prediction["risk_score"] * 100.0)
        
        if composite_score_pct < 30.0:
            alert_level = "GREEN"
        elif composite_score_pct < 70.0:
            alert_level = "YELLOW"
        else:
            alert_level = "RED"
            
        human_labels = {
            "max_temperatura_c": "Temperatura Extrema",
            "precipitacion_acum_mm": "Lluvias Intensas",
            "max_viento_ms": "Vientos Fuertes",
            "tipo_transporte": "Vulnerabilidad del Transporte",
            "tipo_producto": "Sensibilidad del Producto",
            "nivel_rio_m": "Nivel del Río"
        }
        
        main_reasons = []
        for reason in prediction.get("top_reasons", []):
            raw_feat = reason["feature"]
            main_reasons.append(RiskReason(impact=reason["impact"], feature=human_labels.get(raw_feat, raw_feat)))
            
        return RiskResponse(
            shipment_id=f"spatial-{lat}-{lon}",
            composite_score_pct=composite_score_pct,
            alert_level=alert_level,
            message=f"Riesgo espacial aproximado basado en la zona de {nearest_zone['name']}.",
            main_reasons=main_reasons,
            critical_segment=HeuristicSegment(segment_idx=0, coordinates={"lat": lat, "lon": lon}, observation=f"Zona: {nearest_zone['name']}"),
            shap_plot_base64=None,
            metadata={"nearest_zone": nearest_zone["name"]}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@router.post("/evaluate", response_model=RiskResponse)
async def evaluate_risk(request: EvaluationRequest, user_payload: dict = Depends(verify_jwt)):
    # 1. Parse departure_date to choose weather api
    try:
        departure_dt = datetime.strptime(request.departure_date, "%Y-%m-%d").date()
    except Exception:
        departure_dt = date.today()
        
    today = date.today()
    
    # 2. Build parallel tasks
    iot_task = iot_service.get_iot_telemetry(request.shipment_id)
    
    climate_tasks = []
    for pt in request.route_points:
        lat, lon = pt["lat"], pt["lon"]
        if departure_dt >= today:
            # Forecast (7 days)
            climate_tasks.append(climate_service.get_forecast(lat, lon, days=7))
        else:
            # Historical (7 days window)
            end_dt = departure_dt + timedelta(days=7)
            climate_tasks.append(climate_service.get_historical_climate(lat, lon, departure_dt, end_dt))
            
    # Also fetch hydro data for the first point as reference
    ref_lat = request.route_points[0]["lat"] if request.route_points else 0.0
    ref_lon = request.route_points[0]["lon"] if request.route_points else 0.0
    hydro_task = hydro_service.get_hydro_data(ref_lat, ref_lon, departure_dt)
    
    # 3. Gather in parallel to minimize latency
    results = await asyncio.gather(iot_task, hydro_task, *climate_tasks)
    iot_res = results[0]
    hydro_res = results[1]
    climate_res_list = results[2:]
    
    # 4. Map to Pydantic and evaluate confidence
    climate_data_list = []
    for res in climate_res_list:
        if res is None:
            climate_data_list.append(None)
        else:
            climate_data_list.append(ClimateData(
                daily_max_temp=res.get("temperatura_max_c", []),
                daily_min_temp=res.get("temperatura_min_c", []),
                daily_precip=res.get("precipitacion_mm", []),
                daily_wind=res.get("velocidad_viento_ms", [])
            ))
            
    is_inpa = False
    confianza_clima = 1.0
    
    # Resiliencia: Fallback INPA e IDW
    if None in climate_data_list:
        if all(c is None for c in climate_data_list):
            is_inpa = True
            confianza_clima = 0.5
            fallback = get_inpa_fallback_climate(departure_dt.month)
            climate_data_list = [fallback for _ in range(len(climate_data_list))]
        else:
            try:
                climate_data_list = fill_missing_climate_with_idw(climate_data_list, request.route_points)
                confianza_clima = 0.8
            except Exception:
                is_inpa = True
                confianza_clima = 0.5
                fallback = get_inpa_fallback_climate(departure_dt.month)
                climate_data_list = [fallback for _ in range(len(climate_data_list))]
                
    confianza_iot = iot_res.get("confianza_iot", 0.5) if iot_res else 0.5
    telemetry = TelemetryData(
        temperature=iot_res.get("data", {}).get("temp_interna_carga_c") if iot_res else None,
        humidity=iot_res.get("data", {}).get("humedad_interna_carga_pct") if iot_res else None,
    )
    
    hydro_data = HydroData(
        river_level_m=hydro_res["river_level_m"],
        river_current_speed_ms=hydro_res["river_current_speed_ms"]
    )
    
    shipment_transport_type = request.transport_types[0] if request.transport_types else "terrestre"
    origin = request.route_points[0]
    destination = request.route_points[-1]
    distance_km = calculate_haversine_distance(origin["lat"], origin["lon"], destination["lat"], destination["lon"])
    estimated_duration_days = estimate_duration_days(distance_km, shipment_transport_type)

    # Map unseen frontend transport types to what the XGBoost model was trained on
    model_transport_type = shipment_transport_type
    if model_transport_type == "maritimo":
        model_transport_type = "fluvial"
    elif model_transport_type == "aereo":
        model_transport_type = "terrestre"

    shipment = ShipmentData(
        transport_type=model_transport_type,
        product_type=request.product_types[0] if request.product_types else "perecedero_bajo",
        distance_km=distance_km,
        estimated_duration_days=estimated_duration_days,
        month_of_year=departure_dt.month
    )
    
    # 5. Feature Pipeline
    aggregated_climate = aggregate_route_climate(climate_data_list)
    xgboost_features = construir_features_globales(
        climate=aggregated_climate, # Using the worst-case aggregated climate for the entire route
        telemetry=telemetry,
        shipment=shipment,
        hydro=hydro_data,
        is_inpa_fallback=is_inpa
    )
    features_dict = xgboost_features.model_dump(by_alias=True)
    
    # 6. Run XGBoost / Heuristic prediction
    prediction = model_service.predict_risk(features_dict)
    base_score = prediction["risk_score"]
    shap_values = prediction["shap_values"]
    
    # 7. Apply transport vulnerability multiplier (post-hoc — not learned by the model).
    # The XGBoost model predicts pure environmental risk. Transport type amplifies it:
    # fluvial rivers have unpredictable currents and flooding, maritime has coastal storms,
    # terrestre and aereo are less sensitive to hydrological variables.
    TRANSPORT_MULTIPLIERS = {
        "terrestre": 1.00,
        "aereo":     1.05,
        "maritimo":  1.25,
        "fluvial":   1.50,
    }
    transport_mult = TRANSPORT_MULTIPLIERS.get(shipment_transport_type, 1.0)
    
    # 8. Apply data-confidence penalization (capped at +20% to avoid inflating nulls into 100% alerts)
    penalizacion = min(0.20, (1.0 - confianza_clima) * 0.3 + (1.0 - confianza_iot) * 0.2)
    
    final_score = base_score * transport_mult * (1.0 + penalizacion)
    # Hard cap at 95 — reserve "100%" as a truly exceptional value, not a math artifact
    composite_score_pct = min(95.0, final_score * 100.0)
    
    # 9. Alert levels mapping
    if composite_score_pct < 30.0:
        alert_level = "GREEN"
    elif composite_score_pct < 70.0:
        alert_level = "YELLOW"
    else:
        alert_level = "RED"
        
    # 10. Deduce critical segment
    critical_segment = find_critical_segment(climate_data_list, request.route_points)
    
    # 11. Populate reasons (using model's Top SHAP values)
    human_labels = {
        "max_temperatura_c": "Temperatura Extrema",
        "precipitacion_acum_mm": "Lluvias Intensas",
        "max_viento_ms": "Vientos Fuertes",
        "tipo_producto": "Perecibilidad del Producto",
        "nivel_rio_m": "Nivel del Río (Riesgo de Encallar)",
        "velocidad_corriente_rio_ms": "Velocidad de la Corriente del Río",
        "regimen_hidrologico": "Régimen Hidrológico",
        "es_fallback_inpa": "Datos Climáticos Inciertos"
    }
    
    RIVER_FEATURES = {"nivel_rio_m", "velocidad_corriente_rio_ms", "regimen_hidrologico"}
    
    main_reasons = []
    for reason in prediction.get("top_reasons", []):
        raw_feat = reason["feature"]
        
        # River-hydro factors only make sense for true river transport
        if shipment_transport_type != "fluvial":
            if raw_feat in RIVER_FEATURES:
                continue

        impact = reason["impact"]
        label = human_labels.get(raw_feat, raw_feat)
        main_reasons.append(RiskReason(impact=impact, feature=label))
    
    # Construct metadata
    metadata = {
        "source": prediction["source"],
        "confianza_clima": confianza_clima,
        "confianza_iot": confianza_iot,
        "penalizacion_aplicada": penalizacion,
        "base_score": base_score,
        "iot_found": iot_res.get("found", False),
        "distance_km": distance_km,
        "estimated_duration_days": estimated_duration_days
    }

    message = "Evaluación de riesgo completada."

    response = RiskResponse(
        shipment_id=request.shipment_id,
        composite_score_pct=composite_score_pct,
        alert_level=alert_level,
        message=message,
        main_reasons=main_reasons,
        critical_segment=critical_segment,
        shap_plot_base64=prediction.get("shap_plot_base64"),
        metadata=metadata
    )
    
    # 11. Auditoría SOTA: Desacoplar guardado usando Redis Streams
    try:
        await iot_service.redis.xadd("STREAM_TOPICS.PREDICTIONS", fields={
            "shipment_id": request.shipment_id,
            "features_json": json.dumps(features_dict),
            "shap_values_json": json.dumps(shap_values),
            "score_predicho": str(composite_score_pct),
            "nivel_alerta": alert_level,
            "fuente_iot": "live" if iot_res.get("found") else "fallback",
            "confianza_iot": str(confianza_iot)
        })
    except Exception as e:
        print(f"Error publishing to ML audit stream: {e}")
        
    return response
