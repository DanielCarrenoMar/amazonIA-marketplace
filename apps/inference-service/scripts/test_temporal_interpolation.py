import unittest
import sys
import os

# Ensure the parent directory is in the path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.temporal_interpolation import interpolate_small_gaps

class TestTemporalInterpolation(unittest.TestCase):

    def test_interpolate_single_gap(self):
        """Test filling a single gap of length 1."""
        data = [30.0, None, 34.0]
        result = interpolate_small_gaps(data, max_gap=2)
        self.assertEqual(result, [30.0, 32.0, 34.0])

    def test_interpolate_double_gap(self):
        """Test filling a gap of length 2."""
        data = [30.0, None, None, 36.0]
        result = interpolate_small_gaps(data, max_gap=2)
        self.assertEqual(result, [30.0, 32.0, 34.0, 36.0])

    def test_reject_large_gap(self):
        """Test that gaps larger than max_gap (3 in this case) are left as None."""
        data = [30.0, None, None, None, 38.0]
        result = interpolate_small_gaps(data, max_gap=2)
        # Should remain exactly the same
        self.assertEqual(result, [30.0, None, None, None, 38.0])
        
    def test_edges_extrapolation(self):
        """Test extrapolation if the gap is at the edges (and length <= max_gap)."""
        data = [None, 32.0, 34.0]
        result = interpolate_small_gaps(data, max_gap=2)
        self.assertEqual(result, [30.0, 32.0, 34.0])

    def test_no_valid_data(self):
        """Test handling of completely empty arrays or arrays with less than 2 valid points."""
        data_all_none = [None, None, None]
        self.assertEqual(interpolate_small_gaps(data_all_none, max_gap=2), [None, None, None])
        
        data_one_val = [None, 30.0, None]
        self.assertEqual(interpolate_small_gaps(data_one_val, max_gap=2), [None, 30.0, None])

if __name__ == '__main__':
    unittest.main()
