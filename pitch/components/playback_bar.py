"""Playback controls: prev, play/pause, next, scrubber, speed presets."""

from __future__ import annotations

from typing import Callable

import customtkinter as ctk

from app.theme import ACCENT, CORNER_RADIUS, MUTED, PANEL, TEXT


class PlaybackBar(ctk.CTkFrame):
    def __init__(
        self,
        master: ctk.CTkFrame,
        *,
        on_play_pause: Callable[[], None],
        on_seek: Callable[[float], None],
        on_speed: Callable[[float], None],
        **kwargs,
    ) -> None:
        super().__init__(master, fg_color=PANEL, corner_radius=CORNER_RADIUS, **kwargs)
        self._on_seek = on_seek

        row = ctk.CTkFrame(self, fg_color="transparent")
        row.pack(fill="x", padx=8, pady=8)

        ctk.CTkButton(
            row,
            text="|◀",
            width=44,
            command=lambda: self._step(-30),
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
        ).pack(side="left", padx=2)

        self._play_btn = ctk.CTkButton(
            row,
            text="⏯",
            width=52,
            command=on_play_pause,
            fg_color=ACCENT,
            hover_color=MUTED,
            text_color="#0a0a0a",
            font=ctk.CTkFont(size=16),
        )
        self._play_btn.pack(side="left", padx=6)

        ctk.CTkButton(
            row,
            text="▶|",
            width=44,
            command=lambda: self._step(30),
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
        ).pack(side="left", padx=2)

        self._time_var = ctk.StringVar(value="00:00")
        ctk.CTkLabel(row, textvariable=self._time_var, text_color=TEXT, width=56).pack(
            side="left", padx=8
        )

        self._slider = ctk.CTkSlider(
            row,
            from_=0,
            to=1,
            number_of_steps=1000,
            command=lambda v: self._on_seek(float(v)),
            progress_color=ACCENT,
            button_color=ACCENT,
        )
        self._slider.pack(side="left", fill="x", expand=True, padx=8)
        self._slider.set(0)

        speed_row = ctk.CTkFrame(self, fg_color="transparent")
        speed_row.pack(fill="x", padx=8, pady=(0, 8))
        ctk.CTkLabel(speed_row, text="Speed:", text_color=MUTED).pack(side="left")
        for label, spd in [("0.5x", 0.5), ("1x", 1.0), ("1.5x", 1.5), ("2x", 2.0)]:
            ctk.CTkButton(
                speed_row,
                text=label,
                width=48,
                command=lambda s=spd: on_speed(s),
                fg_color=PANEL,
                hover_color=ACCENT,
                text_color=TEXT,
            ).pack(side="left", padx=4)

        self._total_frames = 1
        self._fps = 30.0

    def _step(self, delta_frames: int) -> None:
        cur = self._slider.get()
        tf = max(self._total_frames, 1)
        frame = int(round(cur * (tf - 1))) + delta_frames
        frame = max(0, min(tf - 1, frame))
        pos = frame / max(tf - 1, 1)
        self._slider.set(pos)
        self._on_seek(pos)

    def set_timeline(self, *, current_frame: int, total_frames: int, fps: float) -> None:
        self._fps = max(fps, 1e-6)
        self._total_frames = max(total_frames, 1)
        pos = current_frame / max(self._total_frames - 1, 1)
        self._slider.set(min(1.0, max(0.0, pos)))

        secs = current_frame / self._fps
        m = int(secs // 60)
        s = int(secs % 60)
        self._time_var.set(f"{m:02d}:{s:02d}")

    def set_playing(self, playing: bool) -> None:
        self._play_btn.configure(text="⏸" if playing else "▶")
