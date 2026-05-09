"""Team assignment via jersey-color K-means (HSV features)."""

from __future__ import annotations

from collections import Counter

import cv2
import numpy as np
from sklearn.cluster import KMeans


class TeamClassifier:
    def __init__(self) -> None:
        self.kmeans: KMeans | None = None
        self.fitted = False

    def extract_jersey_color(self, frame: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray:
        x1, y1, x2, y2 = bbox
        upper_y2 = y1 + (y2 - y1) // 2
        crop = frame[y1:upper_y2, x1:x2]
        if crop.size == 0:
            return np.array([0.0, 0.0, 0.0], dtype=np.float64)
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        return hsv.mean(axis=(0, 1)).astype(np.float64)

    def fit_and_classify(
        self,
        frame: np.ndarray,
        players: list[dict],
        *,
        detect_referee: bool = False,
    ) -> list[dict]:
        if len(players) < 2:
            for p in players:
                p["team"] = None
                p["role"] = "player"
            return players

        n_clusters = 3 if detect_referee and len(players) >= 3 else 2
        if len(players) < n_clusters:
            n_clusters = len(players)

        colors = [self.extract_jersey_color(frame, p["bbox"]) for p in players]
        colors_array = np.array(colors)
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = self.kmeans.fit_predict(colors_array)
        self.fitted = True

        if n_clusters == 3:
            counts = Counter(int(x) for x in labels)
            ref_label = min(counts, key=lambda k: counts[k])
            team_labels = sorted(k for k in counts if k != ref_label)
            mapping: dict[int, int] = {}
            if len(team_labels) >= 2:
                mapping = {team_labels[0]: 0, team_labels[1]: 1}
            elif len(team_labels) == 1:
                mapping = {team_labels[0]: 0}
            for i, player in enumerate(players):
                lab = int(labels[i])
                if lab == ref_label:
                    player["team"] = None
                    player["role"] = "referee"
                else:
                    player["role"] = "player"
                    player["team"] = mapping.get(lab, 0)
        else:
            for i, player in enumerate(players):
                player["team"] = int(labels[i])
                player["role"] = "player"

        return players
