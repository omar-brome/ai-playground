"""OpenCV drawing helpers for detections, trails, and HUD overlays."""

from __future__ import annotations

from typing import TYPE_CHECKING

import cv2
import numpy as np

if TYPE_CHECKING:
    from services.tracker import PlayerTracker

TEAM_COLORS = {
    0: (0, 255, 135),
    1: (59, 130, 246),
    None: (200, 200, 200),
}
BALL_COLOR = (255, 255, 255)
REFEREE_COLOR = (255, 200, 0)


class Annotator:
    def draw_player(self, frame: np.ndarray, player: dict, *, show_id: bool = True) -> np.ndarray:
        x1, y1, x2, y2 = player["bbox"]
        role = player.get("role", "player")
        team = player.get("team")
        if role == "referee":
            color = REFEREE_COLOR
        else:
            color = TEAM_COLORS.get(team, TEAM_COLORS[None])
        pid = player.get("id", "?")

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label = f"P{pid}" if show_id else "Player"
        if role == "referee":
            label = f"Ref {pid}" if show_id else "Ref"
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - lh - 8), (x1 + lw + 4, y1), color, -1)
        cv2.putText(frame, label, (x1 + 2, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        return frame

    def draw_ball(self, frame: np.ndarray, ball: dict | None) -> np.ndarray:
        if ball is None:
            return frame
        x1, y1, x2, y2 = ball["bbox"]
        cx, cy = ball["center"]
        cv2.rectangle(frame, (x1, y1), (x2, y2), BALL_COLOR, 2)
        cv2.circle(frame, (cx, cy), 5, BALL_COLOR, -1)
        cv2.putText(frame, "Ball", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, BALL_COLOR, 1)
        return frame

    def draw_trails(self, frame: np.ndarray, player: dict, tracker: PlayerTracker) -> np.ndarray:
        pid = player.get("id", -1)
        trail = tracker.get_trail(pid)
        if len(trail) < 2:
            return frame
        role = player.get("role", "player")
        team = player.get("team")
        if role == "referee":
            color = REFEREE_COLOR
        else:
            color = TEAM_COLORS.get(team, TEAM_COLORS[None])
        for i in range(1, len(trail)):
            alpha = i / len(trail)
            faded = tuple(int(c * alpha) for c in color)
            cv2.line(frame, trail[i - 1], trail[i], faded, 2)
        return frame

    def draw_offside_line(self, frame: np.ndarray, players: list[dict]) -> np.ndarray:
        team_a = [p for p in players if p.get("team") == 0 and p.get("role") != "referee"]
        if len(team_a) < 2:
            return frame
        sorted_x = sorted(p["center"][0] for p in team_a)
        offside_x = sorted_x[-2]
        h = frame.shape[0]
        cv2.line(frame, (offside_x, 0), (offside_x, h), (0, 255, 255), 2)
        cv2.putText(
            frame,
            "Offside Line",
            (min(offside_x + 5, frame.shape[1] - 120), 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 255),
            2,
        )
        return frame

    def draw_possession_bar(
        self,
        frame: np.ndarray,
        team_a_count: int,
        team_b_count: int,
    ) -> np.ndarray:
        total = team_a_count + team_b_count
        if total == 0:
            return frame
        pct_a = team_a_count / total
        w = frame.shape[1]
        bar_y, bar_h = 20, 8
        cv2.rectangle(frame, (0, bar_y), (w, bar_y + bar_h), (50, 50, 50), -1)
        cv2.rectangle(frame, (0, bar_y), (int(w * pct_a), bar_y + bar_h), TEAM_COLORS[0], -1)
        cv2.rectangle(frame, (int(w * pct_a), bar_y), (w, bar_y + bar_h), TEAM_COLORS[1], -1)
        cv2.putText(frame, f"A {pct_a * 100:.0f}%", (5, bar_y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.5, TEAM_COLORS[0], 1)
        cv2.putText(
            frame,
            f"{(1 - pct_a) * 100:.0f}% B",
            (w - 70, bar_y - 3),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            TEAM_COLORS[1],
            1,
        )
        return frame

    def draw_fps(self, frame: np.ndarray, fps: float) -> np.ndarray:
        text = f"{fps:.1f} FPS"
        tw, th = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
        x = frame.shape[1] - tw - 12
        y = 28
        cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        return frame
