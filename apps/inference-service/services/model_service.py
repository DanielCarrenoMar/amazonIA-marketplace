import os
import pickle
from typing import Dict, Any
import base64
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

class ModelService:
      def __init__(self):
          self.model = None
          self.explainer = None
          # Models are expected to be placed here by the training pipeline
          self.model_path = os.path.join(os.path.dirname(__file__), "..", "models", "modelo.pkl")
          self.explainer_path = os.path.join(os.path.dirname(__file__), "..", "models", "explainer.pkl")

      def load_model(self):
          """
          Loads the XGBoost model and SHAP explainer into memory.
          Should be called during the FastAPI lifespan startup event.
          """
          try:
              if os.path.exists(self.model_path):
                  with open(self.model_path, "rb") as f:
                      self.model = pickle.load(f)
                  print("Model loaded successfully.")
              else:
                  print(f"Warning: Model not found at {self.model_path}. Predict engine will be disabled until a model is trained.")

              if os.path.exists(self.explainer_path):
                  with open(self.explainer_path, "rb") as f:
                      self.explainer = pickle.load(f)
                  print("SHAP explainer loaded successfully.")
              else:
                  print(f"Warning: SHAP explainer not found at {self.explainer_path}. Interpretability will be disabled.")
          except Exception as e:
              print(f"Error loading model artifacts: {e}")

      def is_ready(self) -> bool:
          return self.model is not None

      def predict_risk(self, features: dict) -> dict:
          """
          Predicts logistics risk using XGBoost if available, else falls back to heuristics.
          Returns dict containing risk_score, shap_values, and source.
          """
          if not self.is_ready():
              return self._predict_fallback(features)

          try:
              import pandas as pd
              # Ensure DataFrame matches exactly the features and categorical types of the trained model
              model_features = [
                  "max_temperatura_c",
                  "precipitacion_acum_mm",
                  "max_viento_ms",
                  "tipo_transporte",
                  "tipo_producto",
                  "nivel_rio_m",
                  "regimen_hidrologico",
                  "velocidad_corriente_rio_ms"
              ]
              
              # Extract only needed features and preserve order
              filtered_features = {k: features.get(k) for k in model_features}
              df = pd.DataFrame([filtered_features])
              
              # Set categorical dtypes for XGBoost 2.x enable_categorical=True
              categorias = ['tipo_transporte', 'tipo_producto', 'regimen_hidrologico']
              for col in categorias:
                  if col in df.columns:
                      df[col] = df[col].astype('category')
              
              # Predict probability of class 1 (failure)
              prob = float(self.model.predict_proba(df)[0][1])
              
              shap_values_dict = {}
              if self.explainer is not None:
                  shap_vals = self.explainer(df)
                  vals = shap_vals.values[0]
                  # Handle binary/multiclass output shape
                  if hasattr(vals, "ndim") and vals.ndim == 2:
                      vals = vals[:, 1]
                      
                  for idx, col in enumerate(df.columns):
                      shap_values_dict[col] = float(vals[idx])
              else:
                  shap_values_dict = self._get_fallback_shap_values(features)

              top_reasons = self.get_top_risk_reasons(shap_values_dict)

              return {
                  "risk_score": prob,
                  "shap_values": shap_values_dict,
                  "top_reasons": top_reasons,
                  "shap_plot_base64": self.generate_shap_plot_base64(shap_values_dict),
                  "source": "ml_model"
              }
          except Exception as e:
              print(f"Error running ML model inference: {e}. Falling back to heuristics.")
              return self._predict_fallback(features)

      def _predict_fallback(self, features: dict) -> dict:
          """
          Rule-based risk calculation matching training heuristics.
          Updated to include hydrological logic (river level).
          """
          temp = features.get("max_temperatura_c", 30.0)
          precip = features.get("precipitacion_acum_mm", 0.0)
          wind = features.get("max_viento_ms", 0.0)
          transport = features.get("tipo_transporte", "terrestre")
          product = features.get("tipo_producto", "general")
          river_level = features.get("nivel_rio_m", 20.0)
          
          base_risk = 0.05
          reasons = {}
          
          # 1. Fluvial routes with extreme low river levels (drought)
          if transport == "fluvial" and river_level < 16.0:
              base_risk = max(base_risk, 0.95)
              reasons["nivel_rio_m"] = 0.95
              
          # 2. Fluvial routes with extreme rain
          if transport == "fluvial" and precip > 100.0:
              base_risk = max(base_risk, 0.85)
              reasons["precipitacion_acum_mm"] = 0.8
              
          # 3. Perishables in extreme heat
          if product == "perecedero_alto" and temp > 35.0:
              base_risk = max(base_risk, 0.90)
              reasons["max_temperatura_c"] = 0.9
              
          # 4. Strong winds on vessels
          if transport == "fluvial" and wind > 25.0:
              base_risk = max(base_risk, 0.80)
              reasons["max_viento_ms"] = 0.7
              
          shap_vals = self._get_fallback_shap_values(features)
          # Overlay reasons to make them highly significant
          for k, v in reasons.items():
              shap_vals[k] = v
              
          top_reasons = self.get_top_risk_reasons(shap_vals)
              
          return {
              "risk_score": base_risk,
              "shap_values": shap_vals,
              "top_reasons": top_reasons,
              "shap_plot_base64": self.generate_shap_plot_base64(shap_vals),
              "source": "fallback_heuristics"
          }

      def _get_fallback_shap_values(self, features: dict) -> dict:
          """
          Returns heuristic weights based on deviation from safety thresholds.
          """
          temp = features.get("max_temperatura_c", 30.0)
          precip = features.get("precipitacion_acum_mm", 0.0)
          wind = features.get("max_viento_ms", 0.0)
          river_level = features.get("nivel_rio_m", 20.0)
          
          # Normalize by typical thresholds (temp/35, precip/100, wind/25, drought below 16)
          return {
              "max_temperatura_c": max(0.0, (temp - 25.0) / 10.0 * 0.1),
              "precipitacion_acum_mm": max(0.0, precip / 100.0 * 0.2),
              "max_viento_ms": max(0.0, wind / 25.0 * 0.1),
              "nivel_rio_m": max(0.0, (20.0 - river_level) / 5.0 * 0.3) if river_level < 20.0 else 0.0,
              "tipo_transporte": 0.0,
              "tipo_producto": 0.0
          }

      def generate_shap_plot_base64(self, shap_values: dict) -> str:
          """
          Generates a horizontal bar chart of SHAP values and returns it as a base64 string.
          """
          features = list(shap_values.keys())
          impacts = list(shap_values.values())
          
          # Sort by absolute impact
          sorted_indices = sorted(range(len(impacts)), key=lambda k: abs(impacts[k]))
          sorted_features = [features[i] for i in sorted_indices]
          sorted_impacts = [impacts[i] for i in sorted_indices]
          
          # Colors: Red for pushing risk up, Blue for pushing risk down
          colors = ['#ff4b4b' if x > 0 else '#4b4bff' for x in sorted_impacts]
          
          plt.figure(figsize=(8, 5))
          plt.barh(sorted_features, sorted_impacts, color=colors)
          plt.xlabel('Impact on Logistics Risk (SHAP Value)')
          plt.title('Explainable AI: Why did the model make this prediction?')
          plt.tight_layout()
          
          buf = io.BytesIO()
          plt.savefig(buf, format='png', dpi=100)
          plt.close()
          
          buf.seek(0)
          return base64.b64encode(buf.read()).decode('utf-8')

      def get_top_risk_reasons(self, shap_values: dict, top_n: int = 3) -> list:
          """
          Extracts the top N features that have a POSITIVE SHAP value (pushing risk towards RED).
          Returns a list of dicts: [{"feature": "...", "impact": 0.8}, ...]
          """
          positive_reasons = []
          for feature, impact in shap_values.items():
              if impact > 0.001:
                  positive_reasons.append({"feature": feature, "impact": float(impact)})
                  
          positive_reasons = sorted(positive_reasons, key=lambda x: x["impact"], reverse=True)
          return positive_reasons[:top_n]

model_service = ModelService()
