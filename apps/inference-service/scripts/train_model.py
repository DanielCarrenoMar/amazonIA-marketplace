import os
import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

def train():
    print("Training SOTA predictive logistics risk model...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "enriched_dataset.csv")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please run enrich_dataset.py first.")
        
    df = pd.read_csv(data_path)
    print(f"Dataset loaded: {len(df)} samples")
    
    feature_cols = [
        "max_temperatura_c",
        "precipitacion_acum_mm",
        "max_viento_ms",
        "tipo_transporte",
        "tipo_producto",
        "nivel_rio_m",
        "regimen_hidrologico",
        "velocidad_corriente_rio_ms"
    ]
    
    X = df[feature_cols].copy()
    y = df["fracaso_logistico"].copy()
    
    # Cast strings to pandas category dtype for native XGBoost support
    categorias = ["tipo_transporte", "tipo_producto", "regimen_hidrologico"]
    for cat in categorias:
        X[cat] = X[cat].astype("category")
    
    # Split 60% Train, 20% Val, 20% Test
    # 1. First split to get 60% train and 40% temp
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.4, random_state=42, stratify=y)
    
    # 2. Second split to divide the 40% temp into 20% Val and 20% Test (which is 50% of the temp)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)
    
    print(f"Data Split -> Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    
    # 3. Calcular scale_pos_weight para balancear las clases (mayor peso a fracasos)
    # scale_pos_weight = count(negative examples) / count(positive examples)
    neg_count = len(y_train[y_train == 0])
    pos_count = len(y_train[y_train == 1])
    spw = neg_count / pos_count
    print(f"Calculated scale_pos_weight: {spw:.2f} (to penalize false negatives)")
    
    # 4. Configurar modelo con parámetros optimizados
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.03,
        enable_categorical=True,
        early_stopping_rounds=15,
        random_state=42,
        base_score=0.5,
        scale_pos_weight=spw
    )
    
    print("Fitting model...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    print("\n--- MODEL EVALUATION ON TEST SET (20%) ---")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    auc = roc_auc_score(y_test, y_prob)
    print(f"ROC-AUC Score: {auc:.4f}\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("------------------------------------------\n")
    
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
