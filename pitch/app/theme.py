"""Dark sports analytics theme (CustomTkinter)."""

from __future__ import annotations

import customtkinter as ctk

BG = "#0a0a0a"
PANEL = "#111111"
ACCENT = "#00ff87"
ACCENT_BLUE = "#3b82f6"
ALERT = "#ef4444"
TEXT = "#f0f0f0"
MUTED = "#6b7280"
CORNER_RADIUS = 10


def apply_global_theme() -> None:
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("dark-blue")
