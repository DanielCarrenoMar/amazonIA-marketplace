import sys
import os

# Add apps/inference-service to python path
sys.path.append(os.path.join(os.getcwd(), 'apps', 'inference-service'))

from services.model_service import model_service
model_service.load_model()

features = {
    "max_temperatura_c": 32.0,
    "precipitacion_acum_mm": 10.0,
    "max_viento_ms": 5.0,
    "tipo_producto": "perecedero_bajo",
    "nivel_rio_m": 18.0,
    "regimen_hidrologico": "ascenso",
    "velocidad_corriente_rio_ms": 1.0,
    "tipo_transporte": "terrestre"
}

res = model_service.predict_risk(features)
print(f"Base Score from Model: {res['risk_score']}")
print(f"Source: {res['source']}")
print(f"Top Reasons: {res['top_reasons']}")
