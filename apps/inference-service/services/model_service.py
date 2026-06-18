import os
import pickle
import xgboost as xgb
import shap
from typing import Dict, Any

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

model_service = ModelService()
