"""Smoke-test the deployed NutriVN AI API without modifying production data.

Usage:
    python ml/service/smoke_test.py https://YOUR-PREVIEW.vercel.app
"""
import io
import json
import sys
import urllib.error
import urllib.request


def request(url, data=None, content_type=None):
    headers = {}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def multipart_image(image_bytes, filename="test.png"):
    boundary = "nutrivn-smoke-test-boundary"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


def main(base_url):
    base_url = base_url.rstrip("/")
    status, payload = request(base_url + "/api/health")
    health = json.loads(payload)
    assert status == 200 and health.get("ok") is True, f"Health failed: {status}: {health}"
    classes = health.get("classes", [])
    assert len(classes) == 50 and len(set(classes)) == 50, "Expected 50 unique labels"
    print("PASS: health and 50 unique labels")

    body, mime = multipart_image(b"this is not an image", "fake.png")
    status, _ = request(base_url + "/api/predict", body, mime)
    assert status == 400, f"Invalid image should return HTTP 400, got {status}"
    print("PASS: invalid image rejected (400)")

    try:
        from PIL import Image
    except ImportError:
        print("SKIP: image prediction (install Pillow: pip install pillow)")
        return

    buf = io.BytesIO()
    Image.new("RGB", (224, 224), (120, 170, 80)).save(buf, format="PNG")
    body, mime = multipart_image(buf.getvalue())
    status, payload = request(base_url + "/api/predict", body, mime)
    result = json.loads(payload)
    assert status == 200, f"Prediction failed: {status}: {result}"
    assert result.get("mon") in classes, "Unknown predicted class"
    assert 0 <= result.get("do_tin_cay", -1) <= 1, "Invalid confidence"
    top3 = result.get("top3", [])
    assert len(top3) == 3, f"Expected top3, got {top3}"
    assert all(item.get("mon") in classes for item in top3), "Unknown top3 label"
    assert top3[0]["mon"] == result["mon"], "Top1 does not match prediction"
    print("PASS: image inference and Top 3 response shape")
    print("Note: synthetic image checks API behavior, not classification accuracy.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python ml/service/smoke_test.py https://YOUR-PREVIEW.vercel.app")
    main(sys.argv[1])
