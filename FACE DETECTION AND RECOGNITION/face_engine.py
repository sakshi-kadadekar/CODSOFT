import base64
import json
import math
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass
class FaceMatch:
    box: tuple[int, int, int, int]
    detection_score: float
    name: str
    similarity: float | None


def normalize_vector(vector):
    vector = np.asarray(vector, dtype=np.float32)
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def cosine_similarity(first, second):
    first = normalize_vector(first)
    second = normalize_vector(second)
    return float(np.dot(first, second))


def encode_image_to_data_url(image):
    ok, buffer = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 94])
    if not ok:
        raise RuntimeError("Could not encode result image.")
    payload = base64.b64encode(buffer).decode("ascii")
    return f"data:image/jpeg;base64,{payload}"


def read_image(path):
    image = cv2.imread(str(path))
    if image is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return image


def preprocess_lighting(image):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    lightness, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lightness = clahe.apply(lightness)
    return cv2.cvtColor(cv2.merge((lightness, a_channel, b_channel)), cv2.COLOR_LAB2BGR)


def augment_images(image):
    yield image
    yield cv2.flip(image, 1)

    for alpha, beta in ((1.08, 8), (0.92, -8)):
        yield cv2.convertScaleAbs(image, alpha=alpha, beta=beta)

    height, width = image.shape[:2]
    center = (width / 2, height / 2)
    for angle in (-5, 5):
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        yield cv2.warpAffine(image, matrix, (width, height), borderMode=cv2.BORDER_REFLECT)


class HaarDetector:
    def __init__(self, scale_factor=1.1, min_neighbors=5, min_size=(40, 40)):
        cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        self.detector = cv2.CascadeClassifier(str(cascade_path))
        if self.detector.empty():
            raise RuntimeError(f"Could not load Haar cascade at {cascade_path}")
        self.scale_factor = scale_factor
        self.min_neighbors = min_neighbors
        self.min_size = min_size

    def detect(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.detector.detectMultiScale(
            gray,
            scaleFactor=self.scale_factor,
            minNeighbors=self.min_neighbors,
            minSize=self.min_size,
        )
        return [
            {
                "bbox": [int(x), int(y), int(x + w), int(y + h)],
                "det_score": 1.0,
                "embedding": None,
            }
            for x, y, w, h in faces
        ]


class InsightFaceEngine:
    def __init__(self, detector="insightface", ctx_id=-1, det_size=(640, 640)):
        self.detector_name = detector
        self.ctx_id = ctx_id
        self.det_size = det_size
        self._app = None
        self._fallback = HaarDetector()

    def _load_app(self):
        if self.detector_name != "insightface":
            return None
        if self._app is not None:
            return self._app
        try:
            from insightface.app import FaceAnalysis
        except ImportError as exc:
            raise RuntimeError(
                "InsightFace is not installed. Run: python -m pip install -r requirements.txt"
            ) from exc

        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=self.ctx_id, det_size=self.det_size)
        self._app = app
        return self._app

    def detect(self, image, detection_threshold=0.5):
        if self.detector_name == "haar":
            return self._fallback.detect(image)

        app = self._load_app()
        faces = []
        for face in app.get(image):
            score = float(getattr(face, "det_score", 0.0))
            if score < detection_threshold:
                continue
            embedding = getattr(face, "normed_embedding", None)
            if embedding is None:
                embedding = getattr(face, "embedding", None)
            faces.append(
                {
                    "bbox": [int(v) for v in face.bbox],
                    "det_score": score,
                    "embedding": normalize_vector(embedding) if embedding is not None else None,
                    "landmarks": getattr(face, "kps", None),
                }
            )
        return faces


class EmbeddingStore:
    def __init__(self, path):
        self.path = Path(path)
        self.identities = {}

    def load(self):
        if not self.path.exists():
            return self
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        self.identities = payload.get("identities", {})
        return self

    def save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 2,
            "recognizer": "arcface",
            "metric": "cosine_similarity",
            "identities": self.identities,
        }
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def add_identity(self, name, embeddings):
        embeddings = [normalize_vector(item) for item in embeddings]
        mean_embedding = normalize_vector(np.mean(embeddings, axis=0))
        self.identities[name] = {
            "count": len(embeddings),
            "mean_embedding": mean_embedding.tolist(),
            "embeddings": [item.tolist() for item in embeddings],
        }

    def match(self, embedding, threshold=0.45):
        if embedding is None or not self.identities:
            return "Unknown", None

        best_name = "Unknown"
        best_score = -1.0
        for name, record in self.identities.items():
            score = cosine_similarity(embedding, record["mean_embedding"])
            if score > best_score:
                best_name = name
                best_score = score

        if best_score < threshold:
            return "Unknown", best_score
        return best_name, best_score


def draw_annotations(image, matches):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return draw_annotations_cv2(image, matches)

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    canvas = Image.fromarray(rgb)
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    for match in matches:
        x1, y1, x2, y2 = match.box
        color = (12, 122, 107) if match.name != "Unknown" else (194, 65, 12)
        draw.rectangle((x1, y1, x2, y2), outline=color, width=4)

        label = match.name
        if match.similarity is not None:
            label = f"{match.name}  {match.similarity:.2f}"
        text_box = draw.textbbox((0, 0), label, font=font)
        text_width = text_box[2] - text_box[0]
        text_height = text_box[3] - text_box[1]
        label_y = max(0, y1 - text_height - 12)
        draw.rounded_rectangle(
            (x1, label_y, x1 + text_width + 16, label_y + text_height + 10),
            radius=6,
            fill=color,
        )
        draw.text((x1 + 8, label_y + 4), label, font=font, fill=(255, 255, 255))

        score_text = f"det {match.detection_score:.2f}"
        draw.text((x1, min(y2 + 4, image.shape[0] - 18)), score_text, font=small_font, fill=color)

    return cv2.cvtColor(np.array(canvas), cv2.COLOR_RGB2BGR)


def draw_annotations_cv2(image, matches):
    for match in matches:
        x1, y1, x2, y2 = match.box
        color = (0, 150, 110) if match.name != "Unknown" else (0, 110, 220)
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        label = match.name if match.similarity is None else f"{match.name} {match.similarity:.2f}"
        cv2.putText(image, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    return image


def process_image(
    image,
    mode="detect",
    store_path="models/arcface_embeddings.json",
    detector="insightface",
    detection_threshold=0.5,
    recognition_threshold=0.45,
):
    engine = InsightFaceEngine(detector=detector)
    image = preprocess_lighting(image)
    faces = engine.detect(image, detection_threshold=detection_threshold)
    store = EmbeddingStore(store_path).load()

    matches = []
    for face in faces:
        embedding = face.get("embedding")
        name = "Face"
        similarity = None
        if mode == "recognize":
            name, similarity = store.match(embedding, recognition_threshold)
        x1, y1, x2, y2 = face["bbox"]
        matches.append(
            FaceMatch(
                box=(x1, y1, x2, y2),
                detection_score=float(face.get("det_score", 0.0)),
                name=name,
                similarity=similarity,
            )
        )

    annotated = draw_annotations(image.copy(), matches)
    return annotated, [match_to_dict(item) for item in matches]


def match_to_dict(match):
    x1, y1, x2, y2 = match.box
    return {
        "box": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1},
        "identity": match.name,
        "detection_score": round(match.detection_score, 4),
        "similarity": None if match.similarity is None else round(match.similarity, 4),
    }


def train_embeddings(
    dataset,
    output="models/arcface_embeddings.json",
    detector="insightface",
    detection_threshold=0.5,
    augment=True,
):
    dataset = Path(dataset)
    if not dataset.exists():
        raise FileNotFoundError(f"Dataset folder does not exist: {dataset}")

    engine = InsightFaceEngine(detector=detector)
    store = EmbeddingStore(output)
    summary = {}

    for person_dir in sorted(path for path in dataset.iterdir() if path.is_dir()):
        embeddings = []
        for image_path in sorted(person_dir.rglob("*")):
            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            image = preprocess_lighting(read_image(image_path))
            variants = augment_images(image) if augment else (image,)
            for variant in variants:
                faces = engine.detect(variant, detection_threshold=detection_threshold)
                faces = [face for face in faces if face.get("embedding") is not None]
                if not faces:
                    continue
                largest = max(
                    faces,
                    key=lambda face: (face["bbox"][2] - face["bbox"][0]) * (face["bbox"][3] - face["bbox"][1]),
                )
                embeddings.append(largest["embedding"])

        if embeddings:
            store.add_identity(person_dir.name, embeddings)
        summary[person_dir.name] = len(embeddings)

    if not store.identities:
        raise ValueError("No face embeddings were found. Use clearer face images in dataset/person_name/.")

    store.save()
    return summary


def evaluate_dataset(
    dataset,
    store_path="models/arcface_embeddings.json",
    detector="insightface",
    detection_threshold=0.5,
    recognition_threshold=0.45,
):
    dataset = Path(dataset)
    engine = InsightFaceEngine(detector=detector)
    store = EmbeddingStore(store_path).load()

    labels = sorted(path.name for path in dataset.iterdir() if path.is_dir())
    stats = {label: {"tp": 0, "fp": 0, "fn": 0} for label in labels}
    errors = []

    for person_dir in sorted(path for path in dataset.iterdir() if path.is_dir()):
        files = [path for path in sorted(person_dir.rglob("*")) if path.suffix.lower() in IMAGE_EXTENSIONS]
        split_at = max(1, math.floor(len(files) * 0.8))
        validation_files = files[split_at:] or files[-1:]

        for image_path in validation_files:
            image = preprocess_lighting(read_image(image_path))
            faces = [face for face in engine.detect(image, detection_threshold=detection_threshold) if face.get("embedding") is not None]
            if not faces:
                stats[person_dir.name]["fn"] += 1
                errors.append({"file": str(image_path), "expected": person_dir.name, "predicted": "No face"})
                continue
            largest = max(
                faces,
                key=lambda face: (face["bbox"][2] - face["bbox"][0]) * (face["bbox"][3] - face["bbox"][1]),
            )
            predicted, score = store.match(largest["embedding"], recognition_threshold)
            if predicted == person_dir.name:
                stats[person_dir.name]["tp"] += 1
            else:
                stats[person_dir.name]["fn"] += 1
                if predicted in stats:
                    stats[predicted]["fp"] += 1
                errors.append({"file": str(image_path), "expected": person_dir.name, "predicted": predicted, "score": score})

    report = {}
    for label, values in stats.items():
        tp = values["tp"]
        fp = values["fp"]
        fn = values["fn"]
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        report[label] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "tp": tp,
            "fp": fp,
            "fn": fn,
        }

    return {"per_identity": report, "errors": errors}
