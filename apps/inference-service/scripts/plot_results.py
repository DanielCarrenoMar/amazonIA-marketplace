import os
import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, roc_curve, auc

def plot_results():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "enriched_dataset.csv")
    model_path = os.path.join(base_dir, "models", "modelo.pkl")
    
    # Directorio de artefactos de Gemini para guardar la imagen
    out_img = r"C:\Users\Labam-05\.gemini\antigravity\brain\f257e81f-5b24-4df8-97b7-007d6437eba3\model_evaluation.png"
    
    # 1. Cargar datos
    df = pd.read_csv(data_path)
    feature_cols = [
        "max_temperatura_c", "precipitacion_acum_mm", "max_viento_ms",
        "tipo_transporte", "tipo_producto", "nivel_rio_m", "regimen_hidrologico"
    ]
    
    X = df[feature_cols].copy()
    y = df["fracaso_logistico"].copy()
    
    categorias = ["tipo_transporte", "tipo_producto", "regimen_hidrologico"]
    for cat in categorias:
        X[cat] = X[cat].astype("category")
        
    # Replicar el exacto mismo split del entrenamiento (Random state 42)
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.4, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)
    
    # 2. Cargar Modelo
    with open(model_path, "rb") as f:
        model = pickle.load(f)
        
    # 3. Predicciones
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # 4. Configurar el gráfico de matplotlib
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle('Evaluación de Riesgo Logístico: Comportamiento Real vs Predicción', fontsize=16)
    
    # Gráfico 1: Matriz de Confusión
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0],
                xticklabels=['Éxito (0)', 'Fracaso (1)'],
                yticklabels=['Éxito (0)', 'Fracaso (1)'])
    axes[0].set_xlabel('Predicción del Modelo')
    axes[0].set_ylabel('Comportamiento Real')
    axes[0].set_title('Matriz de Confusión')
    
    # Gráfico 2: Distribución de Probabilidades (Real vs Predicción)
    # Muestra cómo el modelo asigna probabilidades a los casos que realmente fallaron vs los que no.
    sns.kdeplot(y_prob[y_test == 0], label='Real: Éxito (0)', fill=True, color='green', ax=axes[1])
    sns.kdeplot(y_prob[y_test == 1], label='Real: Fracaso (1)', fill=True, color='red', ax=axes[1])
    axes[1].axvline(0.5, color='black', linestyle='--', label='Umbral de Decisión (50%)')
    axes[1].set_xlabel('Probabilidad Predicha de Fracaso')
    axes[1].set_ylabel('Densidad de Casos')
    axes[1].set_title('Distribución de Riesgo: Real vs Predicho')
    axes[1].legend()
    
    plt.tight_layout()
    
    # 5. Guardar la imagen
    plt.savefig(out_img, dpi=300, bbox_inches='tight')
    print(f"Plot saved to: {out_img}")

if __name__ == "__main__":
    plot_results()
