"""Local regression tests for the Food50 API (no live deployment required)."""
import io
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app import app, CLASSES  # noqa: E402


class Food50ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_and_labels(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["ok"])
        self.assertEqual(len(data["classes"]), 50)
        self.assertEqual(len(set(data["classes"])), 50)

    def test_invalid_image(self):
        response = self.client.post(
            "/predict", files={"file": ("bad.png", b"not an image", "image/png")}
        )
        self.assertEqual(response.status_code, 400)

    def test_oversized_image(self):
        response = self.client.post(
            "/predict", files={"file": ("large.png", b"x" * (8 * 1024 * 1024 + 1), "image/png")}
        )
        self.assertEqual(response.status_code, 413)

    def test_prediction_shape(self):
        image = Image.new("RGB", (224, 224), color=(100, 150, 200))
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        response = self.client.post(
            "/predict", files={"file": ("test.png", buf.getvalue(), "image/png")}
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertIn(data["mon"], CLASSES)
        self.assertGreaterEqual(data["do_tin_cay"], 0)
        self.assertLessEqual(data["do_tin_cay"], 1)
        self.assertEqual(len(data["top3"]), 3)
        self.assertEqual(data["top3"][0]["mon"], data["mon"])
        self.assertTrue(all(item["mon"] in CLASSES for item in data["top3"]))


if __name__ == "__main__":
    unittest.main()
