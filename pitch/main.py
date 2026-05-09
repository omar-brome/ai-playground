#!/usr/bin/env python3
"""Pitch — football match video analysis (YOLOv8 + OpenCV + CustomTkinter)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    parser = argparse.ArgumentParser(description="Pitch desktop analyzer")
    parser.add_argument(
        "--model",
        default="yolov8s.pt",
        help="YOLOv8 weights filename or path (default: yolov8s.pt)",
    )
    parser.add_argument(
        "--source",
        default=None,
        help="Optional video file to open on startup",
    )
    args = parser.parse_args()

    from app.window import PitchWindow

    print("Pitch: starting UI (YOLO loads when you open a video or webcam).", flush=True)
    app = PitchWindow(model_path=args.model, source=args.source)
    app.mainloop()


if __name__ == "__main__":
    main()
