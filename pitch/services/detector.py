"""YOLOv8 football-oriented detection (COCO person + sports ball)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np

from services.device import get_device


def resolve_model_path(model_path: str) -> str:
    """Prefer weights under pitch/models/ when only a filename is given."""
    p = Path(model_path)
    if p.is_file():
        return str(p.resolve())
    candidate = Path(__file__).resolve().parent.parent / "models" / p.name
    if candidate.is_file():
        return str(candidate)
    return model_path


class FootballDetector:
    def __init__(self, model_path: str = "yolov8s.pt", confidence: float = 0.5) -> None:
        from ultralytics import YOLO

        self.device = get_device()
        path = resolve_model_path(model_path)
        print(
            f"Pitch: loading YOLO ({path}) — first run may download weights; UI may pause briefly.",
            flush=True,
        )
        self.model = YOLO(path)
        self.model.to(self.device)
        self.confidence = confidence

        self.PERSON_CLASS = 0
        self.BALL_CLASS = 32

    def set_confidence(self, value: float) -> None:
        self.confidence = float(max(0.05, min(0.99, value)))

    def set_model(self, model_path: str) -> None:
        from ultralytics import YOLO

        path = resolve_model_path(model_path)
        self.model = YOLO(path)
        self.model.to(self.device)

    def detect(self, frame: np.ndarray) -> dict[str, Any]:
        results = self.model(
            frame,
            conf=self.confidence,
            device=self.device,
            verbose=False,
        )[0]

        players: list[dict[str, Any]] = []
        ball: dict[str, Any] | None = None

        for box in results.boxes:
            cls = int(box.cls)
            conf = float(box.conf)
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

            if cls == self.PERSON_CLASS:
                players.append(
                    {
                        "bbox": (x1, y1, x2, y2),
                        "center": (cx, cy),
                        "confidence": conf,
                        "team": None,
                        "role": "player",
                    }
                )
            elif cls == self.BALL_CLASS:
                ball = {
                    "bbox": (x1, y1, x2, y2),
                    "center": (cx, cy),
                    "confidence": conf,
                }

        return {"players": players, "ball": ball, "raw": results}
