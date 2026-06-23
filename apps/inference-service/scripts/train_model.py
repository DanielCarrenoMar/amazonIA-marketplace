import os
import pandas as pd
import xgboost as xgb
import pickle
import shap
from sklearn.model_selection import train_test_split

def train():
    print("Training predictive logistics risk model...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "bootstrap_dataset.csv")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Bootstrap dataset not found at {data_path}. Please run generate_bootstrap_data.py first.")
        
    df = pd.read_csv(data_path)
    
    feature_cols = [
        "max_temperatura_c",
        "precipitacion_acum_mm",
        "max_viento_ms",
        "tipo_transporte",
        "tipo_producto"
    ]
    
    X = df[feature_cols].copy()
    y = df["fracaso_logistico"].copy()
    
    # Cast strings to pandas category dtype for native XGBoost support
    X["tipo_transporte"] = X["tipo_transporte"].astype("category")
    X["tipo_producto"] = X["tipo_producto"].astype("category")
    
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        enable_categorical=True,
        random_state=42
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "modelo.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Model successfully saved to: {model_path}")
    
    # Build SHAP TreeExplainer
    print("Building SHAP explainer...")
    explainer = shap.TreeExplainer(model)
    explainer_path = os.path.join(models_dir, "explainer.pkl")
    with open(explainer_path, "wb") as f:
        pickle.dump(explainer, f)
    print(f"SHAP explainer successfully saved to: {explainer_path}")

if __name__ == "__main__":
    train()
