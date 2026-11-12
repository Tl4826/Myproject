"""Staging regression tests against the verified 100-class ONNX model."""
import io
import unittest

from fastapi.testclient import TestClient
from PIL import Image

from app import app, CLASSES


def encoded_image(color="white", fmt="PNG"):
    output = io.BytesIO()
    Image.new("RGB", (321, 223), color).save(output, format=fmt)
    return output.getvalue()


class Food100ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_contains_100_unique_classes(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["class_count"], 100)
        self.assertEqual(len(payload["classes"]), len(set(payload["classes"])), 100)
        self.assertIn("Banh beo", payload["classes"])
        self.assertIn("Banh khot", payload["classes"])

    def test_predict_returns_compatible_top3(self):
        response = self.client.post("/predict", files={
            "file": ("food.png", encoded_image(), "image/png")
        })
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertIn(data["mon"], CLASSES)
        self.assertEqual(data["top3"][0]["mon"], data["mon"])
        self.assertEqual(len(data["top3"]), 3)
        self.assertTrue(all(p["mon"] in CLASSES for p in data["top3"]))
        self.assertTrue(0 <= data["do_tin_cay"] <= 1)
        self.assertFalse(data["has_nutrition_data"])  # Image classifier does not measure portions.

    def test_invalid_image_is_400(self):
        response = self.client.post("/predict", files={
            "file": ("broken.png", b"not an image", "image/png")
        })
        self.assertEqual(response.status_code, 400)

    def test_wrong_mime_is_415(self):
        response = self.client.post("/predict", files={
            "file": ("broken.txt", b"hello", "text/plain")
        })
        self.assertEqual(response.status_code, 415)

    def test_oversized_image_is_413(self):
        response = self.client.post("/predict", files={
            "file": ("huge.png", b"x" * (8 * 1024 * 1024 + 1), "image/png")
        })
        self.assertEqual(response.status_code, 413)


if __name__ == "__main__":
    unittest.main()
