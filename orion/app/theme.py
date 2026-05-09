"""Color, typography, and spacing tokens for Orion."""

from __future__ import annotations

from typing import Literal

import customtkinter as ctk

BG = "#0f0f0f"
SIDEBAR_BG = "#161616"
CHAT_BG = "#0f0f0f"
USER_BUBBLE = "#1e3a5f"
AI_BUBBLE = "#1a1a1a"
ACCENT = "#6366f1"
TEXT = "#e5e5e5"
MUTED = "#6b7280"
BORDER = "#2a2a2a"
CODE_BG = "#1e1e1e"

# CustomTkinter expects (dark_mode, light_mode) for fg/text when appearance toggles.
# Using the same dark palette for both avoids "blank white" UI on macOS light/system.
SHELL_BG = (BG, BG)
CHAT_SURFACE = (CHAT_BG, CHAT_BG)
SIDEBAR_SURFACE = (SIDEBAR_BG, SIDEBAR_BG)
CODE_SURFACE = (CODE_BG, CODE_BG)
TEXT_PRIMARY = (TEXT, TEXT)
TEXT_MUTED = (MUTED, MUTED)

CORNER_RADIUS = 12
BORDER_WIDTH = 1

FontSize = Literal["small", "medium", "large"]

_FONT_SCALE = {"small": 12, "medium": 14, "large": 16}


def chat_font(size_key: FontSize) -> ctk.CTkFont:
    return ctk.CTkFont(size=_FONT_SCALE.get(size_key, 14))


def code_font(size_key: FontSize) -> ctk.CTkFont:
    return ctk.CTkFont(family="Menlo", size=_FONT_SCALE.get(size_key, 14) - 1)


def label_font(size_key: FontSize, weight: str = "normal") -> ctk.CTkFont:
    return ctk.CTkFont(size=max(11, _FONT_SCALE.get(size_key, 14) - 2), weight=weight)


DEFAULT_SYSTEM_PROMPT = (
    "You are Orion, a helpful and concise AI assistant. Respond clearly and directly."
)

# Plain hex for Tk.Text / Tk.Entry — avoids macOS CustomTkinter light-mode painting bugs.
TEXT_SOLID = "#f3f4f6"
INPUT_BG_SOLID = "#141414"
ENTRY_BG_SOLID = "#1a1a1a"


def patch_ctk_textbox(
    widget: ctk.CTkTextbox,
    *,
    fg: str = TEXT_SOLID,
    bg: str = INPUT_BG_SOLID,
) -> None:
    """Force underlying Tk.Text colors (fixes invisible text on white canvas)."""
    inner = getattr(widget, "_textbox", None)
    if inner is None:
        return
    inner.configure(
        fg=fg,
        bg=bg,
        insertbackground=fg,
        selectbackground="#374151",
        selectforeground="#ffffff",
        highlightthickness=0,
        bd=0,
    )


def patch_ctk_entry(
    widget: ctk.CTkEntry,
    *,
    fg: str = TEXT_SOLID,
    bg: str = ENTRY_BG_SOLID,
) -> None:
    inner = getattr(widget, "_entry", None)
    if inner is None:
        return
    inner.configure(
        fg=fg,
        bg=bg,
        insertbackground=fg,
        selectbackground="#374151",
        highlightthickness=0,
    )


def patch_ctk_scrollable_canvas(widget: ctk.CTkScrollableFrame, *, bg: str = CHAT_BG) -> None:
    canvas = getattr(widget, "_parent_canvas", None)
    if canvas is not None:
        canvas.configure(bg=bg, highlightthickness=0)
