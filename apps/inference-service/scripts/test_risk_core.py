import unittest
import sys
import os

# Ensure the parent directory is in the path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.spatial import calculate_haversine_distance
from services.calculations import estimate_duration_days
from schemas.request import EvaluationRequest
from pydantic import ValidationError


def build_payload(route_points):
    return {
        "shipment_id": "SH-TEST",
        "route_id": "RT-TEST",
        "route_points": route_points,
        "transport_types": ["fluvial"],
        "product_types": ["perecedero_alto"],
        "departure_date": "2026-06-25",
    }


class TestTwoPointDistance(unittest.TestCase):
    """Core MVP guarantee: given two points, distance/duration must be real, not placeholders."""

    def test_manaos_to_iranduba_distance(self):
        dist = calculate_haversine_distance(-3.119, -60.021, -3.500, -60.500)
        self.assertAlmostEqual(dist, 68.0, delta=1.0)

    def test_same_point_is_zero_distance(self):
        dist = calculate_haversine_distance(-3.119, -60.021, -3.119, -60.021)
        self.assertEqual(dist, 0.0)

    def test_never_equals_old_hardcoded_placeholder(self):
        dist = calculate_haversine_distance(-3.119, -60.021, -3.500, -60.500)
        self.assertNotEqual(dist, 100.0)


class TestEstimateDurationDays(unittest.TestCase):

    def test_known_transport_speed(self):
        # 60 km at 60 km/h => 1h => 1/24 day
        self.assertAlmostEqual(estimate_duration_days(60.0, "terrestre"), round(1 / 24, 2))

    def test_unknown_transport_falls_back_to_default_speed(self):
        self.assertAlmostEqual(estimate_duration_days(40.0, "desconocido"), round(1 / 24, 2))

    def test_zero_distance_is_zero_days(self):
        self.assertEqual(estimate_duration_days(0.0, "fluvial"), 0.0)

    def test_never_equals_old_hardcoded_placeholder(self):
        self.assertNotEqual(estimate_duration_days(68.0, "fluvial"), 5.0)


class TestRoutePointsValidation(unittest.TestCase):
    """Robustness guard: malformed route_points must fail fast with a clear error,
    not silently reach the model with garbage coordinates."""

    def test_valid_two_points_accepted(self):
        req = EvaluationRequest(**build_payload([
            {"lat": -3.119, "lon": -60.021},
            {"lat": -3.500, "lon": -60.500},
        ]))
        self.assertEqual(len(req.route_points), 2)

    def test_single_point_rejected(self):
        with self.assertRaises(ValidationError):
            EvaluationRequest(**build_payload([{"lat": -3.119, "lon": -60.021}]))

    def test_empty_points_rejected(self):
        with self.assertRaises(ValidationError):
            EvaluationRequest(**build_payload([]))

    def test_missing_lat_rejected(self):
        with self.assertRaises(ValidationError):
            EvaluationRequest(**build_payload([
                {"lon": -60.021}, {"lat": -3.5, "lon": -60.5},
            ]))

    def test_out_of_range_latitude_rejected(self):
        with self.assertRaises(ValidationError):
            EvaluationRequest(**build_payload([
                {"lat": 95.0, "lon": -60.021}, {"lat": -3.5, "lon": -60.5},
            ]))

    def test_out_of_range_longitude_rejected(self):
        with self.assertRaises(ValidationError):
            EvaluationRequest(**build_payload([
                {"lat": -3.119, "lon": -200.0}, {"lat": -3.5, "lon": -60.5},
            ]))


if __name__ == '__main__':
    unittest.main()
