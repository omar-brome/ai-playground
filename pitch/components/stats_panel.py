"""Right column: live stats with accent styling."""

from __future__ import annotations

from typing import Any

import customtkinter as ctk

from app.theme import ACCENT, ACCENT_BLUE, ALERT, CORNER_RADIUS, MUTED, PANEL, TEXT


class StatsPanel(ctk.CTkFrame):
    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color=PANEL, corner_radius=CORNER_RADIUS, width=220, **kwargs)

        ctk.CTkLabel(
            self,
            text="LIVE STATS",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=ACCENT,
        ).pack(anchor="w", padx=12, pady=(12, 8))

        self._players_lbl = self._value_row("Players:", "—")
        self._ball_lbl = self._value_row("Ball:", "—")
        self._poss_a_bar = self._bar_only("Team A", ACCENT)
        self._poss_b_bar = self._bar_only("Team B", ACCENT_BLUE)
        self._team_a_lbl = self._value_row("Team A count:", "—")
        self._team_b_lbl = self._value_row("Team B count:", "—")
        self._speed_lbl = self._value_row("Ball speed (~km/h):", "0")
        self._frames_lbl = self._value_row("Frames analyzed:", "0")
        self._goals_a_lbl = self._value_row("Goals Team A:", "0")
        self._goals_b_lbl = self._value_row("Goals Team B:", "0")

    def _value_row(self, title: str, initial: str) -> ctk.CTkLabel:
        wrap = ctk.CTkFrame(self, fg_color="transparent")
        wrap.pack(fill="x", padx=12, pady=2)
        ctk.CTkLabel(wrap, text=title, text_color=MUTED, font=ctk.CTkFont(size=11)).pack(
            anchor="w"
        )
        val = ctk.CTkLabel(
            wrap,
            text=initial,
            text_color=TEXT,
            font=ctk.CTkFont(size=13, weight="bold"),
        )
        val.pack(anchor="w")
        return val

    def _bar_only(self, label: str, color: str) -> ctk.CTkLabel:
        wrap = ctk.CTkFrame(self, fg_color="transparent")
        wrap.pack(fill="x", padx=12, pady=2)
        ctk.CTkLabel(wrap, text=label, text_color=color, font=ctk.CTkFont(size=11)).pack(
            anchor="w"
        )
        bar = ctk.CTkLabel(
            wrap,
            text="░░░░░░░░░░",
            text_color=color,
            font=ctk.CTkFont(size=14),
        )
        bar.pack(anchor="w")
        return bar

    def update_stats(
        self,
        stats: dict[str, Any],
        *,
        player_count: int,
        ball_seen: bool,
        team_a_count: int,
        team_b_count: int,
    ) -> None:
        poss_a = float(stats.get("possession_a", 50.0))
        poss_b = float(stats.get("possession_b", 50.0))

        filled_a = int(round(poss_a / 10))
        filled_a = max(0, min(10, filled_a))
        filled_b = 10 - filled_a
        bar_a = "█" * filled_a + "░" * filled_b
        bar_b = "░" * filled_a + "█" * filled_b

        self._players_lbl.configure(text=str(player_count))
        self._ball_lbl.configure(text="✓" if ball_seen else "✗")
        self._poss_a_bar.configure(text=f"{bar_a}  {poss_a:.0f}%")
        self._poss_b_bar.configure(text=f"{bar_b}  {poss_b:.0f}%")
        self._team_a_lbl.configure(text=str(team_a_count))
        self._team_b_lbl.configure(text=str(team_b_count))
        self._speed_lbl.configure(text=f"{float(stats.get('ball_speed', 0)):.1f}")
        self._frames_lbl.configure(text=str(int(stats.get("frame_count", 0))))

        g = stats.get("goals", {0: 0, 1: 0})
        self._goals_a_lbl.configure(text=str(int(g.get(0, 0))), text_color=ALERT)
        self._goals_b_lbl.configure(text=str(int(g.get(1, 0))), text_color=ACCENT_BLUE)
