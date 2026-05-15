"""Color and typography tokens for Lyra (Qt)."""

from __future__ import annotations

from typing import Literal

BG = "#0f0f0f"
SIDEBAR_BG = "#161616"
CHAT_BG = "#0f0f0f"
ACCENT = "#6366f1"
TEXT = "#e5e5e5"
MUTED = "#6b7280"
BORDER = "#2a2a2a"
BANNER_BG = "#292524"
BANNER_FG = "#fbbf24"

FontSize = Literal["small", "medium", "large"]

_FONT_PT: dict[FontSize, int] = {"small": 12, "medium": 14, "large": 16}


def chat_font_point(size_key: FontSize) -> int:
    return _FONT_PT.get(size_key, 14)


def label_font_point(size_key: FontSize) -> int:
    return max(11, _FONT_PT.get(size_key, 14) - 2)


DEFAULT_SYSTEM_PROMPT = (
    "You are Lyra, a helpful and concise AI assistant. Respond clearly and directly."
)
