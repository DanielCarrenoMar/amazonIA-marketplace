import os
import pandas as pd
import xgboost as xgb
import optuna
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score

def tune():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "enriched_dataset.csv")
    
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    feature_cols = [
        "mes_del_anio", "regimen_hidrologico", "tipo_transporte", 
        "tipo_producto", "max_temperatura_c", "precipitacion_acum_mm", 
        "max_viento_ms", "nivel_rio_m", "velocidad_corriente_rio_ms",
        "es_fallback_inpa"
    ]
    target_col = "fracaso_logistico"
    
    df["mes_del_anio"] = pd.to_datetime(df["fecha_despacho"]).dt.month
    df["es_fallback_inpa"] = False
    
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    categorias = ["tipo_transporte", "tipo_producto", "regimen_hidrologico"]
    for col in categorias:
        X[col] = X[col].astype("category")
        
    def objective(trial):
        params = {
            "objective": "binary:logistic",
            "eval_metric": "auc",
            "enable_categorical": True,
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.1, log=True),
            "n_estimators": trial.suggest_int("n_estimators", 50, 300),
            "subsample": trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "scale_pos_weight": trial.suggest_float("scale_pos_weight", 0.1, 5.0)
        }
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        auc_scores = []
        
        for train_idx, val_idx in cv.split(X, y):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            model = xgb.XGBClassifier(**params, random_state=42, use_label_encoder=False)
            model.fit(X_train, y_train, verbose=False)
            preds = model.predict_proba(X_val)[:, 1]
            auc_scores.append(roc_auc_score(y_val, preds))
            
        return sum(auc_scores) / len(auc_scores)
        
    print("Iniciando laboratorio de Optuna. Buscando la red perfecta...")
    study = optuna.create_study(direction="maximize")
    # Set a low number of trials for the demonstration to avoid taking too much time
    study.optimize(objective, n_trials=10) 
    
    print("\n--- ¡Entrenamiento SOTA completado! ---")
    print("Mejor ROC-AUC cruzado:", study.best_value)
    print("Mejores hiperparámetros:")
    for key, value in study.best_params.items():
        print(f"  {key}: {value}")
        
    print("\n(Nota: Si deseas aplicar esto a train_model.py, copia estos parámetros).")

if __name__ == "__main__":
    tune()
