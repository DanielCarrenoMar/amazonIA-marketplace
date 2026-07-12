import os
import sys
import asyncio
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

client = TestClient(app)

# Helper payload for requests
payload = {
    "shipment_id": "SH-999",
    "route_id": "RT-001",
    "route_points": [
        {"lat": -3.119, "lon": -60.021}, # point 0
        {"lat": -3.500, "lon": -60.500}  # point 1
    ],
    "transport_types": ["fluvial"],
    "product_types": ["perecedero_alto"],
    "departure_date": "2026-06-25",
    "iot_device_id": "iot-dev-123"
}

@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_successful_evaluation(mock_forecast, mock_iot):
    print("\n--- Running Scenario 1: Standard Successful Evaluation ---")
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
    print("[SUCCESS] Scenario 1 completed successfully.")

@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_climate_failure_penalization(mock_forecast, mock_iot):
    print("\n--- Running Scenario 2: Climate Failure (INPA Fallback & Penalization) ---")
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

@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_iot_failure_penalization(mock_forecast, mock_iot):
    print("\n--- Running Scenario 3: IoT Failure (Redis Telemetry Missing & Penalization) ---")
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

@patch("services.iot_service.iot_service.get_iot_telemetry", new_callable=AsyncMock)
@patch("services.climate_service.climate_service.get_forecast", new_callable=AsyncMock)
def test_critical_segment_heuristics(mock_forecast, mock_iot):
    print("\n--- Running Scenario 4: Critical Segment Heuristic Extraction ---")
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

if __name__ == "__main__":
    print("Initializing test execution...")
    # Load fallback prediction to verify fallback mode
    test_successful_evaluation()
    test_climate_failure_penalization()
    test_iot_failure_penalization()
    test_critical_segment_heuristics()
    print("\n[ALL TESTS PASSED SUCCESSFULLY]")
