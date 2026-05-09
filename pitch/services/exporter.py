"""Export analysis summary as JSON."""

from __future__ import annotations

import json
from datetime import datetime


def export_report(stats: dict, output_path: str) -> None:
    goals = stats.get("goals", {0: 0, 1: 0})
    pa = float(stats.get("possession_a", 50.0))
    pb = float(stats.get("possession_b", 50.0))
    report = {
        "generated_at": datetime.now().isoformat(),
        "app": "Pitch v1.0",
        "summary": {
            "total_frames_analyzed": int(stats.get("frame_count", 0)),
            "possession": {
                "team_a": f"{pa:.1f}%",
                "team_b": f"{pb:.1f}%",
            },
            "goals": goals,
            "avg_ball_speed_kmh": round(float(stats.get("ball_speed", 0)), 1),
        },
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
