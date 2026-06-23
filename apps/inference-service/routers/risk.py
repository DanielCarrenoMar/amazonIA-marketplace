from fastapi import APIRouter, Depends
import asyncio
from datetime import datetime, date, timedelta
from schemas.request import EvaluationRequest
from schemas.response import RiskResponse, RiskReason, HeuristicSegment
from middleware.auth import verify_jwt
from services.iot_service import iot_service
from services.climate_service import climate_service
from services.model_service import model_service

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
            
    # 3. Gather in parallel to minimize latency
    results = await asyncio.gather(iot_task, *climate_tasks)
    iot_res = results[0]
    climate_res_list = results[1:]
    
    # 4. Evaluate confidence scores (failed fetches trigger INPA/fallback mode)
    confianza_clima = 1.0
    processed_weather = []
    
    for res in climate_res_list:
        if res is None:
            # Failed weather API fetch fallback (climate data "inventado/INPA")
            confianza_clima = 0.5
            processed_weather.append({
                "fuente": "INPA-invented",
                "temperatura_max_c": [30.0],
                "precipitacion_mm": [0.0],
                "velocidad_viento_ms": [5.0]
            })
        else:
            processed_weather.append(res)
            
    confianza_iot = iot_res.get("confianza_iot", 0.5)
    
    # 5. Extract point-level aggregates & construct global features
    point_weather_data = []
    for res in processed_weather:
        temps = [t for t in res.get("temperatura_max_c", []) if t is not None]
        precips = [p for p in res.get("precipitacion_mm", []) if p is not None]
        winds = [w for w in res.get("velocidad_viento_ms", []) if w is not None]
        
        pt_temp = max(temps) if temps else 30.0
        pt_precip = sum(precips) if precips else 0.0
        pt_wind = max(winds) if winds else 5.0
        
        point_weather_data.append({
            "max_temperatura_c": pt_temp,
            "precipitacion_acum_mm": pt_precip,
            "max_viento_ms": pt_wind
        })
        
    global_temp = max([pt["max_temperatura_c"] for pt in point_weather_data]) if point_weather_data else 30.0
    global_precip = max([pt["precipitacion_acum_mm"] for pt in point_weather_data]) if point_weather_data else 0.0
    global_wind = max([pt["max_viento_ms"] for pt in point_weather_data]) if point_weather_data else 5.0
    
    transport_type = request.transport_types[0] if request.transport_types else "terrestre"
    product_type = request.product_types[0] if request.product_types else "general"
    
    features = {
        "max_temperatura_c": global_temp,
        "precipitacion_acum_mm": global_precip,
        "max_viento_ms": global_wind,
        "tipo_transporte": transport_type,
        "tipo_producto": product_type
    }
    
    # 6. Run XGBoost / Heuristic prediction
    prediction = model_service.predict_risk(features)
    base_score = prediction["risk_score"]
    shap_values = prediction["shap_values"]
    
    # 7. Apply penalization based on data source confidence
    # Formula: riesgo_final = riesgo_base * (1 + penalizacion)
    penalizacion = (1.0 - confianza_clima) * 0.3 + (1.0 - confianza_iot) * 0.2
    final_score = base_score * (1.0 + penalizacion)
    
    # Composite score in percentage [0.0, 100.0]
    composite_score_pct = min(100.0, final_score * 100.0)
    
    # 8. Alert levels mapping
    if composite_score_pct < 30.0:
        alert_level = "GREEN"
    elif composite_score_pct < 70.0:
        alert_level = "YELLOW"
    else:
        alert_level = "RED"
        
    # 9. Deduce critical segment (traditional code scanning for peak of most important feature)
    weather_features = ["max_temperatura_c", "precipitacion_acum_mm", "max_viento_ms"]
    max_feature = max(weather_features, key=lambda f: abs(shap_values.get(f, 0.0)))
    
    peak_idx = 0
    peak_val = -99999.0
    for idx, pt_weather in enumerate(point_weather_data):
        val = pt_weather.get(max_feature, 0.0)
        if val > peak_val:
            peak_val = val
            peak_idx = idx
            
    feature_labels = {
        "max_temperatura_c": "temperatura",
        "precipitacion_acum_mm": "lluvia",
        "max_viento_ms": "viento"
    }
    label = feature_labels.get(max_feature, max_feature)
    
    critical_segment = HeuristicSegment(
        segment_idx=peak_idx,
        coordinates=request.route_points[peak_idx],
        observation=f"Segmento heurístico crítico debido a pico de {label}: {peak_val:.1f}"
    )
    
    # 10. Populate reasons (using model's Top 3 SHAP)
    human_labels = {
        "max_temperatura_c": "Temperatura Extrema",
        "precipitacion_acum_mm": "Lluvias Intensas",
        "max_viento_ms": "Vientos Fuertes",
        "tipo_transporte": "Vulnerabilidad del Transporte",
        "tipo_producto": "Sensibilidad del Producto",
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
    
    message = "Evaluación de riesgo completada."
    if penalizacion > 0:
        message += f" Advertencia: Se aplicó penalización del {penalizacion*100:.0f}% por datos de baja confianza."
        
    return RiskResponse(
        shipment_id=request.shipment_id,
        composite_score_pct=composite_score_pct,
        alert_level=alert_level,
        message=message,
        main_reasons=main_reasons,
        critical_segment=critical_segment,
        metadata=metadata
    )

