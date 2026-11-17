"""Regression tests for the additive near-tie warning in /predict.

Runs against the real 50-class ONNX artifact, but replaces inference outputs
with deterministic logits. No changes to the production model are made.
"""
import io
import unittest
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app import app, CLASSES


def sample_image():
    buffer = io.BytesIO()
    Image.new("RGB", (224, 224), "white").save(buffer, format="PNG")
    return buffer.getvalue()


class TestAmbiguityWarning(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.assertGreaterEqual(len(CLASSES), 3)

    def predict_with_logits(self, first, second):
        logits = np.full((1, len(CLASSES)), -20.0, dtype=np.float32)
        logits[0, 0], logits[0, 1] = first, second
        with patch("app.sess.run", return_value=[logits]):
            response = self.client.post(
                "/predict", files={"file": ("sample.png", sample_image(), "image/png")}
            )
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_near_tie_requests_confirmation(self):
        result = self.predict_with_logits(2.0, 1.96)
        self.assertTrue(result["can_xac_nhan"])
        self.assertEqual(result["ly_do_xac_nhan"], "top_two_close")
        self.assertLess(result["chenh_lech_top2"], 0.10)
        self.assertEqual(len(result["top3"]), 3)
        self.assertIn("chac_chan", result)  # backwards-compatible field

    def test_clear_winner_does_not_request_confirmation(self):
        result = self.predict_with_logits(4.0, 1.0)
        self.assertFalse(result["can_xac_nhan"])
        self.assertIsNone(result["ly_do_xac_nhan"])
        self.assertGreater(result["chenh_lech_top2"], 0.10)


if __name__ == "__main__":
    unittest.main()
