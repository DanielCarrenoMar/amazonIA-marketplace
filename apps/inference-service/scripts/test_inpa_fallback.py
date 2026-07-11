import unittest
import sys
import os

# Ensure the parent directory is in the path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.inpa_fallback import get_inpa_fallback_climate

class TestInpaFallback(unittest.TestCase):

    def test_inpa_wet_season(self):
        """Test retrieving data for a high precipitation month (April / 4)."""
        climate = get_inpa_fallback_climate(4)
        
        # April has precip of 16.0 based on our dictionary
        self.assertEqual(climate.daily_precip[0], 16.0)
        self.assertEqual(climate.daily_max_temp[0], 31.0)
        self.assertEqual(climate.daily_humidity[0], 89.0)

    def test_inpa_dry_season(self):
        """Test retrieving data for a low precipitation month (September / 9)."""
        climate = get_inpa_fallback_climate(9)
        
        # Sept has precip of 2.0 based on our dictionary
        self.assertEqual(climate.daily_precip[0], 2.0)
        self.assertEqual(climate.daily_max_temp[0], 34.0)
        self.assertEqual(climate.daily_humidity[0], 78.0)

    def test_inpa_invalid_month(self):
        """Test retrieving data with an invalid month defaults to January."""
        climate = get_inpa_fallback_climate(15)
        # Should default to month 1
        self.assertEqual(climate.daily_precip[0], 10.0)
        
        climate_neg = get_inpa_fallback_climate(-2)
        # Should default to month 1
        self.assertEqual(climate_neg.daily_precip[0], 10.0)

if __name__ == '__main__':
    unittest.main()
