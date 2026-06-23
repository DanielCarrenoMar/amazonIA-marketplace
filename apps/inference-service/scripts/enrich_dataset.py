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
        if month in [8, 9]: return "aguas_altas" # En la lógica anterior pusimos aguas altas en sep, aunque depende de la zona exacta.
        elif month in [10, 11, 12]: return "descenso"
        elif month in [1, 2, 3, 4]: return "aguas_bajas"
        else: return "ascenso"
        
    df["regimen_hidrologico"] = df["mes"].apply(get_regime)
    
    # 2. Nivel del río (Simulado con base en el mes + ruido para realismo)
    niveles_medios = {
        1: 20.0, 2: 22.5, 3: 25.0, 4: 27.0,
        5: 28.5, 6: 29.0, 7: 28.0, 8: 25.0,
        9: 20.0, 10: 16.5, 11: 15.0, 12: 17.5
    }
    
    # Generamos la columna nivel_rio_m
    np.random.seed(42)
    def simulate_river_level(month):
        base = niveles_medios.get(month, 20.0)
        # Añadir ruido aleatorio normal entre -1.5m y +1.5m
        noise = np.random.normal(0, 1.5)
        return round(max(0.0, base + noise), 2)
        
    df["nivel_rio_m"] = df["mes"].apply(simulate_river_level)
    
    # 3. Recalcular 'fracaso_logistico' con la nueva heurística SOTA
    # Sequía extrema en fluviales
    sequia_fluvial = (df["tipo_transporte"] == "fluvial") & (df["nivel_rio_m"] < 16.0)
    df.loc[sequia_fluvial, "fracaso_logistico"] = 1
    
    df.drop(columns=["mes"], inplace=True)
    
    df.to_csv(out_path, index=False)
    print(f"Enriched dataset saved to {out_path} with {len(df)} records.")
    print(f"Nuevo ratio de fracaso logístico: {df['fracaso_logistico'].mean() * 100:.2f}%")

if __name__ == "__main__":
    enrich_data()
