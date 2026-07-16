import os
import sys
import asyncio
from datetime import date, timedelta
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

# Add parent directory to sys.path to find main and other modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from services.model_service import model_service
from middleware.auth import verify_jwt

# 1. Override JWT verify middleware to allow unauthenticated test requests
def mock_verify_jwt():
    return {"sub": "test-user", "role": "admin"}

app.dependency_overrides[verify_jwt] = mock_verify_jwt

# main.py's lifespan (which loads the real XGBoost model via model_service.load_model())
# only runs inside `with TestClient(app) as client:` — a bare `TestClient(app)` never
# triggers it, so model_service.model stays None and every request silently falls back
# to _predict_fallback() heuristics, never exercising the trained model these tests
# are meant to validate. Load it explicitly instead of running the full lifespan (which
# also spins up the IoT/spatial background workers we don't want in this test run).
model_service.load_model()

client = TestClient(app)

# Helper payload for requests. departure_date is computed as "tomorrow" (not hardcoded)
# so departure_dt >= today always holds in routers/risk.py's evaluate_risk, keeping tests
# on the mocked get_forecast() path. A hardcoded past date silently falls through to the
# unmocked get_historical_climate() path, which hits the real Open-Meteo API instead.
payload = {
    "shipment_id": "SH-999",
    "route_id": "RT-001",
    "route_points": [
        {"lat": -3.119, "lon": -60.021}, # point 0
        {"lat": -3.500, "lon": -60.500}  # point 1
    ],
    "transport_types": ["fluvial"],
    "product_types": ["perecedero_alto"],
    "departure_date": (date.today() + timedelta(days=1)).isoformat(),
    "iot_device_id": "iot-dev-123"
}

@patch("services.hydro_service.hydro_service.get_hydro_data", new_callable=AsyncMock)
@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_successful_evaluation(mock_forecast, mock_iot, mock_hydro):
    print("\n--- Running Scenario 1: Standard Successful Evaluation ---")
    mock_hydro.return_value = {"river_level_m": 20.0, "river_current_speed_ms": 1.5}
    mock_iot.return_value = {
        "found": True,
        "confianza_iot": 1.0,
        "data": {
            "temp_interna_carga_c": 22.0,
            "humedad_interna_carga_pct": 55.0
        }
    }
    mock_forecast.return_value = {
        "fuente": "open-meteo-forecast",
        "temperatura_max_c": [31.0, 32.0, 30.0],
        "temperatura_min_c": [21.0, 22.0, 20.0],
        "precipitacion_mm": [10.0, 15.0, 5.0],
        "velocidad_viento_ms": [12.0, 10.0, 11.0]
    }
    
    response = client.post("/api/v1/risk/evaluate", json=payload)
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Composite Score: {data.get('composite_score_pct')}%")
    print(f"Alert Level: {data.get('alert_level')}")
    print(f"Metadata: {data.get('metadata')}")
    print(f"Critical Segment: {data.get('critical_segment')}")
    
    assert response.status_code == 200
    assert data["metadata"]["confianza_clima"] == 1.0
    assert data["metadata"]["confianza_iot"] == 1.0
    assert data["metadata"]["penalizacion_aplicada"] == 0.0
    # Regression guard for the distance_km/estimated_duration_days placeholders:
    # route_points span ~53km (haversine), never the old hardcoded 100.0/5.0.
    assert data["metadata"]["distance_km"] != 100.0
    assert data["metadata"]["estimated_duration_days"] != 5.0
    print("[SUCCESS] Scenario 1 completed successfully.")

@patch("services.hydro_service.hydro_service.get_hydro_data", new_callable=AsyncMock)
@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_climate_failure_penalization(mock_forecast, mock_iot, mock_hydro):
    print("\n--- Running Scenario 2: Climate Failure (INPA Fallback & Penalization) ---")
    mock_hydro.return_value = {"river_level_m": 20.0, "river_current_speed_ms": 1.5}
    mock_iot.return_value = {
        "found": True,
        "confianza_iot": 1.0,
        "data": {
            "temp_interna_carga_c": 22.0,
            "humedad_interna_carga_pct": 55.0
        }
    }
    # Mocking weather API to return None (failed call)
    mock_forecast.return_value = None
    
    response = client.post("/api/v1/risk/evaluate", json=payload)
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Composite Score: {data.get('composite_score_pct')}%")
    print(f"Alert Level: {data.get('alert_level')}")
    print(f"Message: {data.get('message')}")
    print(f"Metadata: {data.get('metadata')}")
    
    assert response.status_code == 200
    assert data["metadata"]["confianza_clima"] == 0.5
    assert data["metadata"]["confianza_iot"] == 1.0
    # Penalty: (1 - 0.5)*0.3 + (1 - 1.0)*0.2 = 0.15 (15%)
    assert abs(data["metadata"]["penalizacion_aplicada"] - 0.15) < 1e-5
    assert "penalización" in data["message"].lower()
    print("[SUCCESS] Scenario 2 completed successfully.")

@patch("services.hydro_service.hydro_service.get_hydro_data", new_callable=AsyncMock)
@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_iot_failure_penalization(mock_forecast, mock_iot, mock_hydro):
    print("\n--- Running Scenario 3: IoT Failure (Redis Telemetry Missing & Penalization) ---")
    mock_hydro.return_value = {"river_level_m": 20.0, "river_current_speed_ms": 1.5}
    mock_iot.return_value = {
        "found": False,
        "confianza_iot": 0.5,
        "data": {}
    }
    mock_forecast.return_value = {
        "fuente": "open-meteo-forecast",
        "temperatura_max_c": [31.0, 32.0, 30.0],
        "temperatura_min_c": [21.0, 22.0, 20.0],
        "precipitacion_mm": [10.0, 15.0, 5.0],
        "velocidad_viento_ms": [12.0, 10.0, 11.0]
    }
    
    response = client.post("/api/v1/risk/evaluate", json=payload)
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Composite Score: {data.get('composite_score_pct')}%")
    print(f"Metadata: {data.get('metadata')}")
    
    assert response.status_code == 200
    assert data["metadata"]["confianza_clima"] == 1.0
    assert data["metadata"]["confianza_iot"] == 0.5
    # Penalty: (1 - 1.0)*0.3 + (1 - 0.5)*0.2 = 0.10 (10%)
    assert abs(data["metadata"]["penalizacion_aplicada"] - 0.10) < 1e-5
    print("[SUCCESS] Scenario 3 completed successfully.")

@patch("services.hydro_service.hydro_service.get_hydro_data", new_callable=AsyncMock)
@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_critical_segment_heuristics(mock_forecast, mock_iot, mock_hydro):
    print("\n--- Running Scenario 4: Critical Segment Heuristic Extraction ---")
    mock_hydro.return_value = {"river_level_m": 20.0, "river_current_speed_ms": 1.5}
    mock_iot.return_value = {
        "found": True,
        "confianza_iot": 1.0,
        "data": {"temp_interna_carga_c": 22.0}
    }
    
    # We setup mock weather forecasts where point 1 has a peak of rain (precipitacion_mm)
    # Point 0: max precip_sum is 15.0
    # Point 1: max precip_sum is 115.0
    def mock_weather_fetch(lat, lon, days=7):
        if lat == -3.119: # Point 0
            return {
                "fuente": "open-meteo-forecast",
                "temperatura_max_c": [30.0],
                "precipitacion_mm": [15.0],
                "velocidad_viento_ms": [10.0]
            }
        else: # Point 1
            return {
                "fuente": "open-meteo-forecast",
                "temperatura_max_c": [28.0],
                "precipitacion_mm": [115.0],
                "velocidad_viento_ms": [10.0]
            }
            
    mock_forecast.side_effect = mock_weather_fetch
    
    response = client.post("/api/v1/risk/evaluate", json=payload)
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Critical Segment Index: {data.get('critical_segment', {}).get('segment_idx')}")
    print(f"Critical Segment Coordinates: {data.get('critical_segment', {}).get('coordinates')}")
    print(f"Critical Segment Observation: {data.get('critical_segment', {}).get('observation')}")
    
    assert response.status_code == 200
    # The heuristic should find point 1 since its precipitation is 115.0 (which is the peak)
    assert data["critical_segment"]["segment_idx"] == 1
    assert data["critical_segment"]["coordinates"]["lat"] == -3.500
    assert "lluvia" in data["critical_segment"]["observation"].lower()
    print("[SUCCESS] Scenario 4 completed successfully.")

@patch("services.hydro_service.hydro_service.get_hydro_data", new_callable=AsyncMock)
@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_model_sensitivity_to_climate(mock_forecast, mock_iot, mock_hydro):
    """
    Regression guard for the feature-alias bug (schemas/features.py aliases not
    matching model_service.model_features): if the aliases drift out of sync
    again, max_temperatura_c/max_viento_ms/precipitacion_acum_mm silently arrive
    as None and the score stops reacting to real weather. A mild-vs-extreme
    comparison catches that even though the bug never raises an exception.

    hydro_service is also mocked to a neutral river level: it hits a real,
    unmocked network call (Open-Meteo flood API) whose live discharge value
    can saturate the risk score independently of climate, which would make
    this comparison meaningless regardless of the alias bug.

    Uses transport_type='terrestre' instead of the module payload's 'fluvial':
    the currently trained model outputs ~99.8% risk for tipo_transporte=='fluvial'
    regardless of climate/hydro inputs (verified by sweeping climate and
    regimen_hidrologico against the real model directly) — a model-quality/
    training-data issue, not a code bug, and it would make this comparison
    meaningless no matter how correct the alias wiring is. 'terrestre' responds
    to climate correctly (~0.05 mild vs ~0.95 extreme) so it isolates the thing
    this test is actually guarding: the alias wiring, not model quality.
    """
    print("\n--- Running Scenario 5: Model Sensitivity to Extreme Climate ---")
    sensitivity_payload = {**payload, "transport_types": ["terrestre"]}
    mock_hydro.return_value = {"river_level_m": 20.0, "river_current_speed_ms": 1.5}
    mock_iot.return_value = {
        "found": True,
        "confianza_iot": 1.0,
        "data": {"temp_interna_carga_c": 22.0, "humedad_interna_carga_pct": 55.0}
    }

    mock_forecast.return_value = {
        "fuente": "open-meteo-forecast",
        "temperatura_max_c": [20.0, 20.0, 20.0],
        "temperatura_min_c": [15.0, 15.0, 15.0],
        "precipitacion_mm": [0.0, 0.0, 0.0],
        "velocidad_viento_ms": [2.0, 2.0, 2.0]
    }
    mild_response = client.post("/api/v1/risk/evaluate", json=sensitivity_payload)
    mild_data = mild_response.json()
    print(f"Mild climate composite score: {mild_data.get('composite_score_pct')}%")

    mock_forecast.return_value = {
        "fuente": "open-meteo-forecast",
        "temperatura_max_c": [45.0, 45.0, 45.0],
        "temperatura_min_c": [35.0, 35.0, 35.0],
        "precipitacion_mm": [200.0, 200.0, 200.0],
        "velocidad_viento_ms": [40.0, 40.0, 40.0]
    }
    extreme_response = client.post("/api/v1/risk/evaluate", json=sensitivity_payload)
    extreme_data = extreme_response.json()
    print(f"Extreme climate composite score: {extreme_data.get('composite_score_pct')}%")
    print(f"Extreme climate metadata: {extreme_data.get('metadata')}")
    print(f"Extreme climate reasons: {extreme_data.get('main_reasons')}")

    assert mild_response.status_code == 200
    assert extreme_response.status_code == 200
    # The core regression assertion: if max_temperatura_c/max_viento_ms/
    # precipitacion_acum_mm silently arrive as None (the bug), the score would
    # barely move between mild and extreme climate. A working pipeline must
    # show a clearly higher risk score for the extreme scenario.
    assert extreme_data["composite_score_pct"] > mild_data["composite_score_pct"] + 10.0, (
        f"Score did not react to extreme climate as expected "
        f"(mild={mild_data['composite_score_pct']}, extreme={extreme_data['composite_score_pct']}) "
        f"- check schemas/features.py aliases against model_service.model_features."
    )
    # Human-readable SHAP reason labels must resolve to Spanish labels (not the
    # raw feature key), proving the human_labels dict keys in risk.py match too.
    reason_features = [r["feature"] for r in extreme_data.get("main_reasons", [])]
    assert not any(f in ("max_temperatura_c", "max_viento_ms", "precipitacion_acum_mm") for f in reason_features), (
        f"main_reasons leaked a raw feature key instead of a human label: {reason_features}"
    )
    print("[SUCCESS] Scenario 5 completed successfully.")

if __name__ == "__main__":
    print("Initializing test execution...")
    # Load fallback prediction to verify fallback mode
    test_successful_evaluation()
    test_climate_failure_penalization()
    test_iot_failure_penalization()
    test_critical_segment_heuristics()
    test_model_sensitivity_to_climate()
    print("\n[ALL TESTS PASSED SUCCESSFULLY]")
