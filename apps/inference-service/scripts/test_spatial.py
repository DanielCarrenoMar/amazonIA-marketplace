import unittest
import sys
import os

# Ensure the parent directory is in the path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.spatial import calculate_haversine_distance, interpolate_climate_idw

class TestSpatialLogic(unittest.TestCase):

    def test_haversine_distance_manaos_belem(self):
        """Test Haversine distance between Manaos and Belem."""
        # Manaos: -3.1190, -60.0175
        # Belem: -1.4558, -48.5044
        # Known distance is approx 1290 km
        dist = calculate_haversine_distance(-3.1190, -60.0175, -1.4558, -48.5044)
        
        # We check if it is within a reasonable margin of error for a sphere approximation
        self.assertTrue(1250 < dist < 1350, f"Distance {dist} is not within expected bounds")

    def test_haversine_distance_zero(self):
        """Distance between the exact same points should be 0."""
        dist = calculate_haversine_distance(-3.1190, -60.0175, -3.1190, -60.0175)
        self.assertEqual(dist, 0.0)

    def test_idw_equidistant(self):
        """Test IDW interpolation with two equidistant points (should return exact average)."""
        target_lat, target_lon = -2.0, -50.0
        known_points = [
            {"lat": -2.0, "lon": -49.0, "temp": 30.0},  # 1 degree away
            {"lat": -2.0, "lon": -51.0, "temp": 20.0}   # 1 degree away
        ]
        
        interpolated = interpolate_climate_idw(target_lat, target_lon, known_points, "temp")
        self.assertAlmostEqual(interpolated, 25.0, places=2)

    def test_idw_division_by_zero_safeguard(self):
        """Test IDW when a known point is exactly on the target coordinate."""
        target_lat, target_lon = -2.0, -50.0
        known_points = [
            {"lat": -2.0, "lon": -50.0, "temp": 33.0},  # Exact match
            {"lat": -5.0, "lon": -60.0, "temp": 20.0}   # Far away
        ]
        
        interpolated = interpolate_climate_idw(target_lat, target_lon, known_points, "temp")
        self.assertEqual(interpolated, 33.0)

    def test_idw_one_point(self):
        """Test IDW when only one point exists (should just copy the value)."""
        target_lat, target_lon = -2.0, -50.0
        known_points = [
            {"lat": -5.0, "lon": -60.0, "temp": 42.0}
        ]
        
        interpolated = interpolate_climate_idw(target_lat, target_lon, known_points, "temp")
        self.assertEqual(interpolated, 42.0)

if __name__ == '__main__':
    unittest.main()
