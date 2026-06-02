import argparse
import json
from pathlib import Path

import cv2

from face_engine import evaluate_dataset, process_image, read_image, train_embeddings


def save_image(path, image):
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(output), image):
        raise RuntimeError(f"Could not write image: {output}")


def detect_image(args):
    image = read_image(args.input)
    annotated, results = process_image(
        image,
        mode="detect",
        store_path=args.embeddings,
        detector=args.detector,
        detection_threshold=args.detection_threshold,
        recognition_threshold=args.recognition_threshold,
    )
    save_image(args.output, annotated)
    print(json.dumps({"faces": results, "output": args.output}, indent=2))


def recognize_image(args):
    image = read_image(args.input)
    annotated, results = process_image(
        image,
        mode="recognize",
        store_path=args.embeddings,
        detector=args.detector,
        detection_threshold=args.detection_threshold,
        recognition_threshold=args.recognition_threshold,
    )
    save_image(args.output, annotated)
    print(json.dumps({"faces": results, "output": args.output}, indent=2))


def train_model(args):
    summary = train_embeddings(
        dataset=args.dataset,
        output=args.embeddings,
        detector=args.detector,
        detection_threshold=args.detection_threshold,
        augment=not args.no_augment,
    )
    print(json.dumps({"saved": args.embeddings, "embeddings_per_identity": summary}, indent=2))


def evaluate(args):
    report = evaluate_dataset(
        dataset=args.dataset,
        store_path=args.embeddings,
        detector=args.detector,
        detection_threshold=args.detection_threshold,
        recognition_threshold=args.recognition_threshold,
    )
    print(json.dumps(report, indent=2))


def process_video(args):
    capture = cv2.VideoCapture(str(args.input))
    if not capture.isOpened():
        raise FileNotFoundError(f"Could not open video: {args.input}")

    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = capture.get(cv2.CAP_PROP_FPS) or 25
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(output), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    frame_count = 0
    all_results = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        annotated, results = process_image(
            frame,
            mode="recognize",
            store_path=args.embeddings,
            detector=args.detector,
            detection_threshold=args.detection_threshold,
            recognition_threshold=args.recognition_threshold,
        )
        writer.write(annotated)
        all_results.append({"frame": frame_count, "faces": results})
        frame_count += 1

    capture.release()
    writer.release()
    print(json.dumps({"frames": frame_count, "output": args.output, "results": all_results}, indent=2))


def add_common_model_args(parser):
    parser.add_argument("--detector", choices=["insightface", "haar"], default="insightface")
    parser.add_argument("--recognizer", choices=["arcface"], default="arcface")
    parser.add_argument("--embeddings", default="models/arcface_embeddings.json")
    parser.add_argument("--detection-threshold", type=float, default=0.5)
    parser.add_argument("--recognition-threshold", type=float, default=0.45)


def build_parser():
    parser = argparse.ArgumentParser(description="High-accuracy face detection and recognition.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    train_parser = subparsers.add_parser("train", help="Build ArcFace embeddings from dataset folders.")
    train_parser.add_argument("--dataset", default="dataset")
    train_parser.add_argument("--no-augment", action="store_true")
    add_common_model_args(train_parser)
    train_parser.set_defaults(func=train_model)

    detect_parser = subparsers.add_parser("detect", help="Detect faces in an image.")
    detect_parser.add_argument("--input", required=True)
    detect_parser.add_argument("--output", default="outputs/detected.jpg")
    add_common_model_args(detect_parser)
    detect_parser.set_defaults(func=detect_image)

    recognize_parser = subparsers.add_parser("recognize", help="Recognize faces in an image.")
    recognize_parser.add_argument("--input", required=True)
    recognize_parser.add_argument("--output", default="outputs/recognized.jpg")
    add_common_model_args(recognize_parser)
    recognize_parser.set_defaults(func=recognize_image)

    video_parser = subparsers.add_parser("video", help="Recognize faces in a video.")
    video_parser.add_argument("--input", required=True)
    video_parser.add_argument("--output", default="outputs/recognized_video.mp4")
    add_common_model_args(video_parser)
    video_parser.set_defaults(func=process_video)

    evaluate_parser = subparsers.add_parser("evaluate", help="Report validation precision, recall, and F1.")
    evaluate_parser.add_argument("--dataset", default="dataset")
    add_common_model_args(evaluate_parser)
    evaluate_parser.set_defaults(func=evaluate)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
