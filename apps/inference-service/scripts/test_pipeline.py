import unittest
import sys
import os

# Ensure the parent directory is in the path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schemas.features import ClimateData, TelemetryData, ShipmentData, MissingClimateDataError
from services.feature_pipeline import construir_features_globales

class TestFeaturePipeline(unittest.TestCase):

    def setUp(self):
        self.telemetry = TelemetryData(
            internal_cargo_temp_c=12.0,
            internal_cargo_humidity_pct=85.0
        )
        self.shipment = ShipmentData(
            transport_type="fluvial",
            product_type="perecedero_alto",
            distance_km=450.5,
            estimated_duration_days=5.0,
            month_of_year=9  # aguas_altas
        )

    def test_pipeline_perfect_data(self):
        """Test the pipeline with contiguous, perfect data without gaps."""
        climate = ClimateData(
            daily_precip=[0.0, 15.0, 5.0, 0.0],
            daily_max_temp=[32.0, 31.0, 34.0, 33.0],
            daily_min_temp=[22.0, 23.0, 22.0, 24.0],
            daily_humidity=[80.0, 85.0, 90.0, 88.0],
            daily_wind=[1.5, 2.0, 1.8, 1.2],
            daily_radiation=[350.0, 400.0, 380.0, 390.0]
        )
        
        features = construir_features_globales(climate, self.telemetry, self.shipment)
        
        # Validate output
        self.assertEqual(features.route_precip_mm, 15.0)
        self.assertEqual(features.max_temp_c, 34.0)
        self.assertEqual(features.min_temp_c, 22.0)
        self.assertEqual(features.precip_7d_accum, 20.0)
        # Delta = max(34.0) - 12.0 = 22.0
        self.assertEqual(features.thermal_delta, 22.0)
        
        # Test encoders (Fluvial -> 0, Perecedero alto -> 0, Aguas altas -> 0)
        self.assertEqual(features.transport_type_enc, 0)
        self.assertEqual(features.product_type_enc, 0)
        self.assertEqual(features.hydrological_regime_enc, 0)

    def test_pipeline_with_gaps(self):
        """Test the pipeline when NASA API returns None for certain days."""
        climate_with_gaps = ClimateData(
            daily_precip=[10.0, None, 10.0, None],  # 2 valid out of 4 (avg 10) -> sum extrapolated to 40.0
            daily_max_temp=[32.0, None, 34.0, None],
            daily_min_temp=[22.0, 23.0, None, None],
            daily_humidity=[80.0, 90.0, None, None],
            daily_wind=[1.5, None, 1.8, None],
            daily_radiation=[350.0, None, None, 390.0]
        )
        
        features = construir_features_globales(climate_with_gaps, self.telemetry, self.shipment)
        
        # The sum should extrapolate 10 + 10 = 20 for 2 days -> Avg = 10 -> Total 4 days = 40.0
        self.assertEqual(features.precip_7d_accum, 40.0)
        self.assertEqual(features.max_temp_c, 34.0)
        self.assertEqual(features.min_temp_c, 22.0)
        # Delta = 34.0 - 12.0 = 22.0
        self.assertEqual(features.thermal_delta, 22.0)

    def test_pipeline_fail_fast_all_gaps(self):
        """Test that the pipeline raises an exception if critical arrays are completely missing."""
        climate_empty = ClimateData(
            daily_precip=[None, None, None, None],  # All missing
            daily_max_temp=[32.0, 31.0, 34.0, 33.0],
            daily_min_temp=[],
            daily_humidity=[],
            daily_wind=[],
            daily_radiation=[]
        )
        
        with self.assertRaises(MissingClimateDataError):
            construir_features_globales(climate_empty, self.telemetry, self.shipment)

if __name__ == '__main__':
    unittest.main()
