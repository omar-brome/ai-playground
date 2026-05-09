"""Background video capture, inference, and overlay composition."""

from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Callable

import cv2
import numpy as np

from services.annotator import Annotator
from services.detector import FootballDetector
from services.heatmap import HeatmapGenerator
from services.stats import StatsEngine
from services.team_classifier import TeamClassifier
from services.tracker import PlayerTracker


class VideoProcessor:
    def __init__(
        self,
        frame_callback: Callable[[np.ndarray, dict[str, Any], float], None],
        stats_callback: Callable[[dict[str, Any]], None] | None = None,
        model_path: str = "yolov8s.pt",
    ) -> None:
        self.frame_callback = frame_callback
        self.stats_callback = stats_callback or (lambda _s: None)

        self.running = False
        self.paused = False
        self.cap: cv2.VideoCapture | None = None
        self.speed = 1.0
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()

        self.detector = FootballDetector(model_path=model_path)
        self.tracker = PlayerTracker(trail_length=30)
        self.team_clf = TeamClassifier()
        self.heatmap: HeatmapGenerator | None = None
        self.annotator = Annotator()
        self.stats_engine = StatsEngine()

        self.show_players = True
        self.show_ball = True
        self.show_referee = True
        self.show_trails = True
        self.show_heatmap = False
        self.show_offside = False
        self.show_possession = True

        self.pending_seek_frame: int | None = None
        self.current_frame_index = 0
        self.total_frames = 0
        self.source_fps = 30.0
        self.source_path: str | None = None
        self._fps_ema: deque[float] = deque(maxlen=30)

    def set_model(self, model_path: str) -> None:
        self.detector.set_model(model_path)

    def set_confidence(self, value: float) -> None:
        self.detector.set_confidence(value)

    def load_video(self, path: str) -> bool:
        self.stop()
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            return False
        self.source_path = path
        self._init_capture(cap)
        return True

    def load_webcam(self, index: int = 0) -> bool:
        self.stop()
        cap = cv2.VideoCapture(index)
        if not cap.isOpened():
            return False
        self.source_path = f"webcam:{index}"
        self._init_capture(cap)
        return True

    def _init_capture(self, cap: cv2.VideoCapture) -> None:
        self.cap = cap
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        self.source_fps = float(cap.get(cv2.CAP_PROP_FPS)) or 30.0
        self.heatmap = HeatmapGenerator((h, w))
        self.total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        self.current_frame_index = 0
        self.tracker = PlayerTracker(trail_length=30)
        self.team_clf = TeamClassifier()
        self.stats_engine.reset_session()
        self.stats_engine.goal_zones = None

    def seek_to_frame(self, frame_index: int) -> None:
        with self._lock:
            self.pending_seek_frame = max(0, int(frame_index))

    def process_frame(self, frame: np.ndarray) -> tuple[np.ndarray, dict[str, Any]]:
        detections = self.detector.detect(frame)
        players = detections["players"]
        ball = detections["ball"]

        players = self.team_clf.fit_and_classify(
            frame,
            players,
            detect_referee=self.show_referee,
        )
        players = self.tracker.update(players)

        if self.heatmap is not None:
            self.heatmap.reshape_if_needed(frame.shape)
            self.heatmap.update(players)

        stats = self.stats_engine.update(players, ball, frame.shape)
        stats["player_count"] = len(players)
        stats["ball_seen"] = ball is not None
        stats["team_a_count"] = sum(
            1 for p in players if p.get("team") == 0 and p.get("role") != "referee"
        )
        stats["team_b_count"] = sum(
            1 for p in players if p.get("team") == 1 and p.get("role") != "referee"
        )

        annotated = frame.copy()

        if self.show_heatmap and self.heatmap is not None:
            overlay, alpha = self.heatmap.get_overlay(frame.shape)
            if overlay.shape[:2] != annotated.shape[:2]:
                overlay = cv2.resize(
                    overlay,
                    (annotated.shape[1], annotated.shape[0]),
                    interpolation=cv2.INTER_LINEAR,
                )
            annotated = cv2.addWeighted(annotated, 1.0, overlay, alpha, 0)

        if self.show_players or self.show_referee:
            for player in players:
                role = player.get("role", "player")
                if role == "referee":
                    if self.show_referee:
                        self.annotator.draw_player(annotated, player)
                        if self.show_trails:
                            self.annotator.draw_trails(annotated, player, self.tracker)
                elif self.show_players:
                    self.annotator.draw_player(annotated, player)
                    if self.show_trails:
                        self.annotator.draw_trails(annotated, player, self.tracker)

        if self.show_ball:
            self.annotator.draw_ball(annotated, ball)

        if self.show_offside:
            self.annotator.draw_offside_line(annotated, players)

        if self.show_possession:
            team_a = sum(
                1 for p in players if p.get("team") == 0 and p.get("role") != "referee"
            )
            team_b = sum(
                1 for p in players if p.get("team") == 1 and p.get("role") != "referee"
            )
            self.annotator.draw_possession_bar(annotated, team_a, team_b)

        fps_val = self._fps_smooth()
        self.annotator.draw_fps(annotated, fps_val)

        return annotated, stats

    def _fps_smooth(self) -> float:
        if not self._fps_ema:
            return 0.0
        return float(sum(self._fps_ema) / len(self._fps_ema))

    def run(self) -> None:
        if self.cap is None or not self.cap.isOpened():
            self.running = False
            return

        self.running = True
        fps_src = float(self.cap.get(cv2.CAP_PROP_FPS)) or self.source_fps
        base_delay = 1.0 / max(fps_src, 1e-6)

        while self.running and self.cap is not None and self.cap.isOpened():
            if self.paused:
                time.sleep(0.05)
                continue

            with self._lock:
                if self.pending_seek_frame is not None:
                    idx = self.pending_seek_frame
                    self.pending_seek_frame = None
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                    self.current_frame_index = idx

            t0 = time.perf_counter()
            ret, frame = self.cap.read()
            if not ret:
                break

            pos = int(self.cap.get(cv2.CAP_PROP_POS_FRAMES))
            if pos > 0:
                self.current_frame_index = pos
            else:
                self.current_frame_index += 1

            annotated, stats = self.process_frame(frame)

            dt = time.perf_counter() - t0
            if dt > 1e-6:
                self._fps_ema.append(1.0 / dt)

            rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
            fps_val = self._fps_smooth()

            self.frame_callback(rgb, stats, fps_val)
            self.stats_callback(stats)

            delay = base_delay / max(self.speed, 0.25)
            elapsed = time.perf_counter() - t0
            sleep_t = max(0.0, delay - elapsed)
            if sleep_t > 0:
                time.sleep(sleep_t)

        if self.cap is not None:
            self.cap.release()
            self.cap = None
        self.running = False

    def start(self) -> None:
        if self.cap is None or not self.cap.isOpened():
            return
        if self._thread is not None and self._thread.is_alive():
            return
        self.running = True
        self._thread = threading.Thread(target=self.run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self.running = False
        if self.cap is not None:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None

    def toggle_pause(self) -> None:
        self.paused = not self.paused

    def set_paused(self, value: bool) -> None:
        self.paused = value
