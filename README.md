# High-Accuracy Face Detection and Recognition

A local browser and command-line AI application for detecting and recognizing faces in images, camera frames, and videos.

The upgraded pipeline uses:

- InsightFace `buffalo_l`, which combines RetinaFace-style detection and ArcFace embeddings.
- 512-dimensional face embeddings stored in `models/arcface_embeddings.json`.
- Cosine similarity matching with an adjustable threshold.
- CLAHE lighting normalization and simple training-time augmentation.
- PIL-based labels for cleaner annotated output.
- JSON metadata for bounding boxes, identities, detection confidence, and similarity scores.

The app runs locally. The first InsightFace run may download model files, then inference is local.

## Setup

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

If your machine does not support the full InsightFace install, you can still use the Haar fallback from the CLI or UI, but ArcFace recognition requires InsightFace.

## Run In Browser

```powershell
.\venv\Scripts\python.exe web_app.py
```

Open:

```text
http://127.0.0.1:5000
```

The web app supports:

- image upload
- face detection
- face recognition after training
- browser camera frame capture
- detection and recognition threshold sliders
- confidence bars and structured face metadata
- model evaluation report

## Dataset Format

Create folders like this:

```text
dataset/
  person_1/
    image1.jpg
    image2.jpg
  person_2/
    image1.jpg
    image2.jpg
```

Use 15-30 varied images per person: different lighting, angles, expressions, and distances.

## Train ArcFace Embeddings

```powershell
.\venv\Scripts\python.exe app.py train --dataset dataset --embeddings models/arcface_embeddings.json
```

Training stores embeddings and mean identity vectors. Adding new people only requires rebuilding the embedding JSON.

## Detect Faces In An Image

```powershell
.\venv\Scripts\python.exe app.py detect --input samples/group.jpg --output outputs/detected.jpg
```

## Recognize Faces In An Image

```powershell
.\venv\Scripts\python.exe app.py recognize --input samples/group.jpg --output outputs/recognized.jpg --recognition-threshold 0.45
```

## Process A Video

```powershell
.\venv\Scripts\python.exe app.py video --input samples/video.mp4 --output outputs/recognized_video.mp4
```

## Evaluate Accuracy

```powershell
.\venv\Scripts\python.exe app.py evaluate --dataset dataset --recognition-threshold 0.45
```

The evaluation command reports precision, recall, and F1 per identity using an 80/20 dataset split.

## Useful Options

```powershell
--detector insightface
--detector haar
--recognizer arcface
--detection-threshold 0.5
--recognition-threshold 0.45
```

Start with recognition thresholds around `0.4` to `0.5`. Raise the threshold to reduce false positives; lower it if known people are often marked unknown.
