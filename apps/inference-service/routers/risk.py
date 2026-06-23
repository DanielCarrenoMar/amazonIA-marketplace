from fastapi import APIRouter, Depends
import asyncio
from datetime import datetime, date, timedelta
from schemas.request import EvaluationRequest
from schemas.response import RiskResponse, RiskReason, HeuristicSegment
from middleware.auth import verify_jwt
from services.iot_service import iot_service
from services.climate_service import climate_service
from services.model_service import model_service
from schemas.features import ClimateData, TelemetryData, ShipmentData
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
            
    # 3. Gather in parallel to minimize latency
    results = await asyncio.gather(iot_task, *climate_tasks)
    iot_res = results[0]
    climate_res_list = results[1:]
    
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
        temperature=iot_res.get("temperature") if iot_res else None,
        humidity=iot_res.get("humidity") if iot_res else None,
        vibration=iot_res.get("vibration") if iot_res else None
    )
    
    shipment = ShipmentData(
        shipment_id=request.shipment_id,
        transport_types=request.transport_types,
        product_types=request.product_types,
        route_points=request.route_points,
        departure_date=request.departure_date
    )
    
    # 5. Feature Pipeline
    xgboost_features = construir_features_globales(
        shipment=shipment,
        climate_data_list=climate_data_list,
        telemetry=telemetry,
        is_inpa_fallback=is_inpa
    )
    features_dict = xgboost_features.model_dump(by_alias=True)
    
    # 6. Run XGBoost / Heuristic prediction
    prediction = model_service.predict_risk(features_dict)
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
    
    # Reconstruct point data for heuristic scan
    point_weather_data = []
    for c in climate_data_list:
        pt_temp = max(c.temperatura_max_c) if c.temperatura_max_c else 30.0
        pt_precip = sum(c.precipitacion_mm) if c.precipitacion_mm else 0.0
        pt_wind = max(c.velocidad_viento_ms) if c.velocidad_viento_ms else 5.0
        point_weather_data.append({
            "max_temperatura_c": pt_temp,
            "precipitacion_acum_mm": pt_precip,
            "max_viento_ms": pt_wind
        })
        
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

