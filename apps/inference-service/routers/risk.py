from fastapi import APIRouter, Depends
import asyncio
import json
from datetime import datetime, date, timedelta
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
from services.spatial import interpolate_climate_idw

router = APIRouter(prefix="/api/v1/risk", tags=["Risk"])

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
                fuente=res.get("fuente", "api"),
                temperatura_max_c=res.get("temperatura_max_c", []),
                temperatura_min_c=res.get("temperatura_min_c", []),
                precipitacion_mm=res.get("precipitacion_mm", []),
                velocidad_viento_ms=res.get("velocidad_viento_ms", [])
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
                climate_data_list = interpolate_climate_idw(climate_data_list, request.route_points)
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
    
    shipment = ShipmentData(
        transport_type=request.transport_types[0] if request.transport_types else "terrestre",
        product_type=request.product_types[0] if request.product_types else "perecedero_bajo",
        distance_km=100.0, # Placeholder until calculated
        estimated_duration_days=5.0, # Placeholder
        month_of_year=departure_dt.month
    )
    
    # 5. Feature Pipeline
    xgboost_features = construir_features_globales(
        climate=climate_data_list[0], # Using the first or aggregated climate in production
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
    
    # 7. Apply penalization based on data source confidence
    penalizacion = (1.0 - confianza_clima) * 0.3 + (1.0 - confianza_iot) * 0.2
    final_score = base_score * (1.0 + penalizacion)
    composite_score_pct = min(100.0, final_score * 100.0)
    
    # 8. Alert levels mapping
    if composite_score_pct < 30.0:
        alert_level = "GREEN"
    elif composite_score_pct < 70.0:
        alert_level = "YELLOW"
    else:
        alert_level = "RED"
        
    # 9. Deduce critical segment
    critical_segment = HeuristicSegment(
        segment_idx=0,
        coordinates=request.route_points[0],
        observation=f"Segmento principal evaluado."
    )
    
    # 10. Populate reasons (using model's Top 3 SHAP)
    human_labels = {
        "temperatura_max_c": "Temperatura Extrema",
        "precipitacion_7d_acum": "Lluvias Intensas",
        "velocidad_viento_ms": "Vientos Fuertes",
        "tipo_transporte": "Vulnerabilidad del Transporte",
        "tipo_producto": "Sensibilidad del Producto",
        "nivel_rio_m": "Nivel del Río (Peligro de Encallar)",
        "es_fallback_inpa": "Datos Climáticos Inciertos"
    }
    
    main_reasons = []
    for reason in prediction.get("top_reasons", []):
        raw_feat = reason["feature"]
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
        "iot_found": iot_res.get("found", False)
    }
    
    response = RiskResponse(
        shipment_id=request.shipment_id,
        composite_score_pct=composite_score_pct,
        alert_level=alert_level,
        message="Evaluación de riesgo completada.",
        main_reasons=main_reasons,
        critical_segment=critical_segment,
        shap_plot_base64=prediction.get("shap_plot_base64"),
        metadata=metadata
    )
    
    # 11. Auditoría SOTA: Desacoplar guardado usando Redis Streams
    try:
        await iot_service.redis.xadd("STREAM_TOPICS.PREDICTIONS", {
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
