"""Live possession, ball speed, and heuristic goal detection."""

from __future__ import annotations

from collections import deque

import numpy as np


class StatsEngine:
    def __init__(self, goal_cooldown_frames: int = 75) -> None:
        self.frame_count = 0
        self.team_possession = {0: 0, 1: 0}
        self.ball_positions: deque[tuple[int, int]] = deque(maxlen=10)
        self.goals = {0: 0, 1: 0}
        self.goal_zones: dict[str, tuple[int, int, int, int]] | None = None
        self._goal_cooldown_frames = goal_cooldown_frames
        self._cooldown = 0
        self._inside_goal: str | None = None

    def reset_session(self) -> None:
        self.frame_count = 0
        self.team_possession = {0: 0, 1: 0}
        self.ball_positions.clear()
        self.goals = {0: 0, 1: 0}
        self.goal_zones = None
        self._cooldown = 0
        self._inside_goal = None

    def update(self, players: list[dict], ball: dict | None, frame_shape: tuple[int, ...]) -> dict:
        self.frame_count += 1
        h, w = int(frame_shape[0]), int(frame_shape[1])

        if self.goal_zones is None:
            band = max(8, int(h * 0.1))
            self.goal_zones = {
                "top": (0, 0, w, band),
                "bottom": (0, h - band, w, h),
            }

        if ball and players:
            ball_cx, ball_cy = ball["center"]
            min_dist = float("inf")
            closest_team: int | None = None
            for player in players:
                if player.get("role") == "referee":
                    continue
                if player.get("team") is None:
                    continue
                px, py = player["center"]
                dist = float(np.hypot(ball_cx - px, ball_cy - py))
                if dist < min_dist:
                    min_dist = dist
                    closest_team = int(player["team"])
            if closest_team is not None and min_dist < 100:
                self.team_possession[closest_team] += 1

        if ball:
            self.ball_positions.append(ball["center"])
            self._maybe_score_goal(ball["center"])
        else:
            self._inside_goal = None

        if self._cooldown > 0:
            self._cooldown -= 1

        return self.get_stats()

    def _point_in_rect(
        self,
        x: int,
        y: int,
        rect: tuple[int, int, int, int],
    ) -> bool:
        x1, y1, x2, y2 = rect
        return x1 <= x < x2 and y1 <= y < y2

    def _maybe_score_goal(self, center: tuple[int, int]) -> None:
        if self.goal_zones is None or self._cooldown > 0:
            return
        cx, cy = center
        in_top = self._point_in_rect(cx, cy, self.goal_zones["top"])
        in_bottom = self._point_in_rect(cx, cy, self.goal_zones["bottom"])
        zone: str | None = None
        if in_top:
            zone = "top"
        elif in_bottom:
            zone = "bottom"

        if zone is None:
            self._inside_goal = None
            return

        if self._inside_goal == zone:
            return

        self._inside_goal = zone
        if zone == "top":
            self.goals[1] += 1
        else:
            self.goals[0] += 1
        self._cooldown = self._goal_cooldown_frames

    def get_stats(self) -> dict:
        total_poss = sum(self.team_possession.values())
        if total_poss > 0:
            poss_a = self.team_possession[0] / total_poss * 100
        else:
            poss_a = 50.0

        ball_speed = 0.0
        if len(self.ball_positions) >= 2:
            p1 = self.ball_positions[-2]
            p2 = self.ball_positions[-1]
            pixel_dist = float(np.hypot(p2[0] - p1[0], p2[1] - p1[1]))
            ball_speed = pixel_dist * 1.5

        return {
            "frame_count": self.frame_count,
            "possession_a": poss_a,
            "possession_b": 100 - poss_a,
            "goals": dict(self.goals),
            "ball_speed": ball_speed,
        }
