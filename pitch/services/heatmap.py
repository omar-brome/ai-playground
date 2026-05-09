"""Movement heatmap accumulation and colorized overlay."""

from __future__ import annotations

import cv2
import numpy as np


class HeatmapGenerator:
    def __init__(self, frame_shape: tuple[int, ...]) -> None:
        h, w = int(frame_shape[0]), int(frame_shape[1])
        self._shape = (h, w)
        self.accumulator = np.zeros((h, w), dtype=np.float32)

    def reshape_if_needed(self, frame_shape: tuple[int, ...]) -> None:
        h, w = int(frame_shape[0]), int(frame_shape[1])
        if (h, w) != self._shape:
            self._shape = (h, w)
            self.accumulator = np.zeros((h, w), dtype=np.float32)

    def update(self, players: list[dict]) -> None:
        for player in players:
            cx, cy = player["center"]
            if 0 <= cy < self.accumulator.shape[0] and 0 <= cx < self.accumulator.shape[1]:
                cv2.circle(self.accumulator, (cx, cy), 30, 1.0, thickness=-1)

    def get_overlay(self, frame_shape: tuple[int, ...], alpha: float = 0.4) -> tuple[np.ndarray, float]:
        h, w = int(frame_shape[0]), int(frame_shape[1])
        acc = self.accumulator
        if acc.shape[0] != h or acc.shape[1] != w:
            acc = cv2.resize(acc, (w, h), interpolation=cv2.INTER_LINEAR)

        norm = cv2.normalize(acc, None, 0, 255, cv2.NORM_MINMAX)
        norm_u8 = norm.astype(np.uint8)
        colormap = cv2.applyColorMap(norm_u8, cv2.COLORMAP_JET)
        return colormap, alpha

    def reset(self) -> None:
        self.accumulator.fill(0)
