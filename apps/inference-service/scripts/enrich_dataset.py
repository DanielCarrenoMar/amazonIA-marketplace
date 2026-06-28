import os
import pandas as pd
import numpy as np

def enrich_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "bootstrap_dataset.csv")
    out_path = os.path.join(base_dir, "data", "enriched_dataset.csv")
    
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records.")
    
    # Extraer el mes
    df["fecha_despacho"] = pd.to_datetime(df["fecha_despacho"])
    df["mes"] = df["fecha_despacho"].dt.month
    
    # 1. Régimen Hidrológico
    def get_regime(month):
        if month in [8, 9]: return "aguas_altas"
        elif month in [10, 11, 12]: return "descenso"
        elif month in [1, 2, 3, 4]: return "aguas_bajas"
        else: return "ascenso"
        
    df["regimen_hidrologico"] = df["mes"].apply(get_regime)
    
    # 2. Recalcular 'fracaso_logistico' con la nueva heurística SOTA usando datos REALES
    # Sequía extrema en fluviales
    sequia_fluvial = (df["tipo_transporte"] == "fluvial") & (df["nivel_rio_m"] < 16.0)
    df.loc[sequia_fluvial, "fracaso_logistico"] = 1
    
    # Corrientes peligrosas
    # Si es fluvial y la corriente supera los 2.3 m/s (muy rápida para barcazas pesadas), aumenta riesgo
    corriente_peligrosa = (df["tipo_transporte"] == "fluvial") & (df["velocidad_corriente_rio_ms"] > 2.3)
    df.loc[corriente_peligrosa, "fracaso_logistico"] = 1
    
    df.drop(columns=["mes"], inplace=True)
    
    df.to_csv(out_path, index=False)
    print(f"Enriched dataset saved to {out_path} with {len(df)} records.")
    print(f"Nuevo ratio de fracaso logístico: {df['fracaso_logistico'].mean() * 100:.2f}%")

if __name__ == "__main__":
    enrich_data()
