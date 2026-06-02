import json
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, render_template, request

from face_engine import encode_image_to_data_url, evaluate_dataset, process_image, train_embeddings


BASE_DIR = Path(__file__).resolve().parent
EMBEDDINGS_PATH = BASE_DIR / "models" / "arcface_embeddings.json"
DATASET_DIR = BASE_DIR / "dataset"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024


def model_is_ready():
    return EMBEDDINGS_PATH.exists()


def dataset_people():
    if not DATASET_DIR.exists():
        return []
    return sorted(path.name for path in DATASET_DIR.iterdir() if path.is_dir())


def decode_image(file_storage):
    data = np.frombuffer(file_storage.read(), dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Upload a valid image file.")
    return image


def parse_threshold(name, default):
    try:
        return float(request.form.get(name, default))
    except ValueError:
        return default


def run_processing(uploaded, mode):
    suffix = Path(uploaded.filename or "camera.jpg").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS and uploaded.filename:
        raise ValueError("Use JPG, PNG, BMP, or WEBP images.")

    image = decode_image(uploaded)
    detection_threshold = parse_threshold("detection_threshold", 0.5)
    recognition_threshold = parse_threshold("recognition_threshold", 0.45)
    detector = request.form.get("detector", "insightface")

    annotated, faces = process_image(
        image,
        mode=mode,
        store_path=EMBEDDINGS_PATH,
        detector=detector,
        detection_threshold=detection_threshold,
        recognition_threshold=recognition_threshold,
    )
    return {
        "image": encode_image_to_data_url(annotated),
        "faces": faces,
        "face_count": len(faces),
        "detection_threshold": detection_threshold,
        "recognition_threshold": recognition_threshold,
        "detector": detector,
    }


@app.get("/")
def index():
    return render_template(
        "index.html",
        model_ready=model_is_ready(),
        people=dataset_people(),
        detection_threshold=0.5,
        recognition_threshold=0.45,
        detector="insightface",
    )


@app.post("/process")
def process_upload():
    uploaded = request.files.get("image")
    mode = request.form.get("mode", "detect")
    if uploaded is None or uploaded.filename == "":
        return render_template(
            "index.html",
            error="Choose an image first.",
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    try:
        result = run_processing(uploaded, mode)
    except Exception as exc:
        return render_template(
            "index.html",
            error=str(exc),
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    return render_template(
        "index.html",
        image_url=result["image"],
        faces=result["faces"],
        face_count=result["face_count"],
        selected_mode=mode,
        message="Processing complete.",
        model_ready=model_is_ready(),
        people=dataset_people(),
        detection_threshold=result["detection_threshold"],
        recognition_threshold=result["recognition_threshold"],
        detector=result["detector"],
    )


@app.post("/api/process")
def process_api():
    uploaded = request.files.get("image")
    mode = request.form.get("mode", "recognize")
    if uploaded is None:
        return jsonify({"error": "No image received."}), 400

    try:
        result = run_processing(uploaded, mode)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(
        {
            "imageUrl": result["image"],
            "faces": result["faces"],
            "faceCount": result["face_count"],
            "modelReady": model_is_ready(),
        }
    )


@app.post("/train")
def train_model():
    if not DATASET_DIR.exists():
        return render_template(
            "index.html",
            error="Create dataset/person_name/image.jpg folders before training.",
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    detection_threshold = parse_threshold("detection_threshold", 0.5)
    detector = request.form.get("detector", "insightface")
    try:
        summary = train_embeddings(
            dataset=DATASET_DIR,
            output=EMBEDDINGS_PATH,
            detector=detector,
            detection_threshold=detection_threshold,
            augment=True,
        )
    except Exception as exc:
        return render_template(
            "index.html",
            error=str(exc),
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    return render_template(
        "index.html",
        message=f"Model trained: {json.dumps(summary)}",
        model_ready=model_is_ready(),
        people=dataset_people(),
        detection_threshold=detection_threshold,
        recognition_threshold=0.45,
        detector=detector,
    )


@app.post("/evaluate")
def evaluate_model():
    if not DATASET_DIR.exists() or not model_is_ready():
        return render_template(
            "index.html",
            error="Train the model and keep dataset folders available before evaluation.",
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    detection_threshold = parse_threshold("detection_threshold", 0.5)
    recognition_threshold = parse_threshold("recognition_threshold", 0.45)
    detector = request.form.get("detector", "insightface")
    try:
        report = evaluate_dataset(
            dataset=DATASET_DIR,
            store_path=EMBEDDINGS_PATH,
            detector=detector,
            detection_threshold=detection_threshold,
            recognition_threshold=recognition_threshold,
        )
    except Exception as exc:
        return render_template(
            "index.html",
            error=str(exc),
            model_ready=model_is_ready(),
            people=dataset_people(),
        )

    return render_template(
        "index.html",
        message="Evaluation complete.",
        report=report,
        model_ready=model_is_ready(),
        people=dataset_people(),
        detection_threshold=detection_threshold,
        recognition_threshold=recognition_threshold,
        detector=detector,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
