import requests
import json

url = "http://localhost:8000/api/v1/risk/evaluate"
payload = {
  "shipment_id": "TEST-SHIPMENT-001",
  "route_points": [
    {"lat": -3.1190, "lon": -60.0210},
    {"lat": -3.1000, "lon": -60.0100},
    {"lat": -3.0500, "lon": -59.9500}
  ],
  "departure_date": "2026-07-20",
  "transport_types": ["fluvial"],
  "product_types": ["perecedero_bajo"]
}

headers = {
  'Content-Type': 'application/json'
}

try:
    print(f"Enviando petición a {url}...")
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n=== RESPUESTA DE INFERENCIA ===")
        print(f"Shipment ID: {data.get('shipment_id')}")
        print(f"Riesgo (Score %): {data.get('composite_score_pct'):.2f}%")
        print(f"Nivel de Alerta: {data.get('alert_level')}")
        print(f"Mensaje: {data.get('message')}")
        
        print("\nRazones Principales (SHAP):")
        for reason in data.get('main_reasons', []):
            print(f"- {reason['feature']}: Impacto {reason['impact']:.4f}")
            
        print("\nSegmento Crítico:")
        critical = data.get('critical_segment', {})
        print(f"- Observación: {critical.get('observation')}")
        
        meta = data.get('metadata', {})
        print("\nMetadata:")
        for k, v in meta.items():
            print(f"- {k}: {v}")
    else:
        print("Error en la respuesta:")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("Error: No se pudo conectar al servidor. Asegúrate de que el contenedor esté corriendo (puerto 8000).")
except Exception as e:
    print(f"Ocurrió un error inesperado: {e}")
