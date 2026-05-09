"""Simple centroid-based player tracking with motion trails."""

from __future__ import annotations

from collections import defaultdict, deque

import numpy as np


class PlayerTracker:
    def __init__(self, trail_length: int = 30) -> None:
        self.trails: dict[int, deque] = defaultdict(lambda: deque(maxlen=trail_length))
        self.next_id = 0
        self.active_ids: dict[int, tuple[int, int]] = {}

    def update(self, players: list[dict]) -> list[dict]:
        if not players:
            return players

        current_centers = [p["center"] for p in players]

        if not self.active_ids:
            for i, player in enumerate(players):
                pid = self.next_id
                self.next_id += 1
                self.active_ids[pid] = player["center"]
                player["id"] = pid
                self.trails[pid].append(player["center"])
            return players

        max_jump = 80.0
        pairs: list[tuple[float, int, int]] = []
        pids = list(self.active_ids.keys())
        for i, (cx, cy) in enumerate(current_centers):
            for pid in pids:
                px, py = self.active_ids[pid]
                dist = float(np.hypot(cx - px, cy - py))
                if dist < max_jump:
                    pairs.append((dist, i, pid))

        pairs.sort(key=lambda t: t[0])
        assigned_players: set[int] = set()
        assigned_pids: set[int] = set()

        for dist, i, pid in pairs:
            if i in assigned_players or pid in assigned_pids:
                continue
            assigned_players.add(i)
            assigned_pids.add(pid)
            player = players[i]
            player["id"] = pid
            self.trails[pid].append(player["center"])
            self.active_ids[pid] = player["center"]

        for i, player in enumerate(players):
            if i in assigned_players:
                continue
            pid = self.next_id
            self.next_id += 1
            player["id"] = pid
            self.active_ids[pid] = player["center"]
            self.trails[pid].append(player["center"])

        return players

    def get_trail(self, player_id: int) -> list[tuple[int, int]]:
        return list(self.trails.get(player_id, ()))
