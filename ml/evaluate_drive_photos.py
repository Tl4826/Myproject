"""Colab runner: evaluate labeled images from NutriVN own_photos on Google Drive.

Run in Google Colab after cloning the repository:
    !pip install -r requirements.txt google-api-python-client google-auth
    !python ml/evaluate_drive_photos.py

Google authentication requires your interactive approval in Colab.
Only downloads images into a temporary directory in Colab; Drive is read-only.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

# Verified folder IDs from the connected Drive.
SOURCE_FOLDERS = {
    "comtam": ("1hCMH7OQfRjzWQW-ptFpduVoHAQm1lG8R", "Com tam"),
    "phobo": ("1o7KDCyg0CXmXX04wWf5_PlqqXGNfvQ0f", "Pho"),
    "buncha": ("16JjBYyjMx_sNVLd3-4g8xyk8iXF1m1PG", None),
}
IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
ROOT = Path(__file__).resolve().parent


def main():
    try:
        from google.colab import auth
        import google.auth
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseDownload
    except ImportError as exc:
        raise SystemExit("This runner requires Google Colab and google-api-python-client: " + str(exc))

    auth.authenticate_user()
    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/drive.readonly"])
    service = build("drive", "v3", credentials=credentials, cache_discovery=False)
    with tempfile.TemporaryDirectory(prefix="nutrivn-drive-") as temp:
        photos = Path(temp) / "photos"
        manifest = {"sources": {}, "excluded_outside_50_classes": {}, "download_errors": []}
        for source, (folder_id, target_label) in SOURCE_FOLDERS.items():
            count = 0
            page_token = None
            while True:
                page = service.files().list(
                    q=f"'{folder_id}' in parents and trashed = false",
                    fields="nextPageToken,files(id,name,mimeType,size)",
                    page_size=1000,
                    page_token=page_token,
                ).execute()
                for file in page.get("files", []):
                    if file["mimeType"] not in IMAGE_MIMES:
                        continue
                    if target_label is None:
                        manifest["excluded_outside_50_classes"][source] = (
                            manifest["excluded_outside_50_classes"].get(source, 0) + 1
                        )
                        continue
                    destination = photos / target_label / (file["id"] + Path(file["name"]).suffix.lower())
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    try:
                        with destination.open("wb") as output:
                            downloader = MediaIoBaseDownload(output, service.files().get_media(fileId=file["id"]))
                            done = False
                            while not done:
                                _, done = downloader.next_chunk()
                        count += 1
                    except Exception as exc:
                        destination.unlink(missing_ok=True)
                        manifest["download_errors"].append({"file": file["name"], "error": str(exc)})
                page_token = page.get("nextPageToken")
                if not page_token:
                    break
            manifest["sources"][source] = {"model_label": target_label, "images_downloaded": count}

        output = ROOT.parent / "evaluation-results" / "own_photos"
        output.mkdir(parents=True, exist_ok=True)
        (output / "drive_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        print("Downloaded images:", manifest["sources"])
        print("Excluded (outside model labels):", manifest["excluded_outside_50_classes"])
        if not any(item["images_downloaded"] for item in manifest["sources"].values()):
            raise SystemExit("No labeled images downloaded. Check Drive access.")
        subprocess.run(
            [sys.executable, str(ROOT / "evaluate_real_photos.py"), "--photos", str(photos), "--out", str(output)],
            check=True,
        )
        print("Reports saved to:", output)
        print("No image files were saved to the report folder or uploaded to GitHub.")


if __name__ == "__main__":
    main()
