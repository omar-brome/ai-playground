"""Chat message rows with markdown-style code fences."""

from __future__ import annotations

from datetime import datetime

import customtkinter as ctk

from app.theme import (
    ACCENT,
    AI_BUBBLE,
    BORDER,
    CHAT_BG,
    CORNER_RADIUS,
    TEXT_SOLID,
    USER_BUBBLE,
    chat_font,
    label_font,
    patch_ctk_textbox,
)
from app.theme import MUTED, FontSize
from components.code_block import CodeBlock


def parse_fenced_segments(text: str) -> list[tuple[str, str | None, str]]:
    """Split into ('prose', None, s) and ('code', lang_or_empty, code)."""
    if not text:
        return []
    segments: list[tuple[str, str | None, str]] = []
    i = 0
    n = len(text)
    while i < n:
        start = text.find("```", i)
        if start == -1:
            segments.append(("prose", None, text[i:]))
            break
        if start > i:
            segments.append(("prose", None, text[i:start]))
        nl = text.find("\n", start)
        if nl == -1:
            segments.append(("prose", None, text[start:]))
            break
        lang_line = text[start + 3 : nl].strip()
        body_start = nl + 1
        close = text.find("```", body_start)
        if close == -1:
            segments.append(("code", lang_line or None, text[body_start:]))
            break
        code = text[body_start:close]
        segments.append(("code", lang_line or None, code))
        i = close + 3
    return [s for s in segments if s[2] != "" or s[0] == "code"]


def format_timestamp(iso_or_dt: str | datetime | None) -> str:
    if isinstance(iso_or_dt, datetime):
        dt = iso_or_dt
    elif isinstance(iso_or_dt, str) and iso_or_dt:
        try:
            dt = datetime.fromisoformat(iso_or_dt)
        except ValueError:
            return ""
    else:
        return ""
    s = dt.strftime("%I:%M %p")
    if len(s) >= 2 and s[0] == "0" and s[1].isdigit():
        s = s[1:]
    return s


class MessageBubble:
    """Factory for message rows placed inside a scrollable parent."""

    @staticmethod
    def build_user(
        parent: ctk.CTkScrollableFrame,
        content: str,
        ts_label: str,
        font_size: FontSize,
    ) -> ctk.CTkFrame:
        outer = ctk.CTkFrame(parent, fg_color=CHAT_BG)
        outer.pack(fill="x", pady=(0, 12), padx=8)

        header = ctk.CTkFrame(outer, fg_color=CHAT_BG)
        header.pack(fill="x")
        ctk.CTkLabel(
            header,
            text="You",
            text_color=ACCENT,
            font=label_font(font_size, "bold"),
        ).pack(side="right")
        ctk.CTkLabel(header, text=ts_label, text_color=MUTED, font=label_font(font_size)).pack(
            side="right", padx=(0, 8)
        )

        bubble = ctk.CTkFrame(
            outer,
            fg_color=USER_BUBBLE,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=BORDER,
        )
        bubble.pack(fill="x", anchor="e")
        tb = ctk.CTkTextbox(
            bubble,
            fg_color=USER_BUBBLE,
            text_color=TEXT_SOLID,
            font=chat_font(font_size),
            corner_radius=CORNER_RADIUS - 2,
            border_width=0,
            wrap="word",
        )
        tb.pack(fill="both", expand=True, padx=12, pady=10)
        tb.insert("1.0", content)
        tb.configure(state="disabled")
        patch_ctk_textbox(tb, fg=TEXT_SOLID, bg=USER_BUBBLE)
        return outer

    @staticmethod
    def build_assistant_static(
        parent: ctk.CTkScrollableFrame,
        content: str,
        ts_label: str,
        font_size: FontSize,
    ) -> ctk.CTkFrame:
        outer = ctk.CTkFrame(parent, fg_color=CHAT_BG)
        outer.pack(fill="x", pady=(0, 12), padx=8)

        header = ctk.CTkFrame(outer, fg_color=CHAT_BG)
        header.pack(fill="x")
        ctk.CTkLabel(
            header,
            text="Orion",
            text_color=ACCENT,
            font=label_font(font_size, "bold"),
        ).pack(side="left")
        ctk.CTkLabel(header, text=ts_label, text_color=MUTED, font=label_font(font_size)).pack(
            side="left", padx=(8, 0)
        )

        bubble = ctk.CTkFrame(
            outer,
            fg_color=AI_BUBBLE,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=BORDER,
        )
        bubble.pack(fill="x", anchor="w")

        segments = parse_fenced_segments(content)
        if not segments:
            segments = [("prose", None, content)]
        for kind, lang, chunk in segments:
            if kind == "prose":
                tb = ctk.CTkTextbox(
                    bubble,
                    fg_color=AI_BUBBLE,
                    text_color=TEXT_SOLID,
                    font=chat_font(font_size),
                    corner_radius=8,
                    border_width=0,
                    wrap="word",
                )
                tb.pack(fill="x", padx=10, pady=6)
                tb.insert("1.0", chunk)
                tb.configure(state="disabled")
                patch_ctk_textbox(tb, fg=TEXT_SOLID, bg=AI_BUBBLE)
            else:
                CodeBlock(bubble, language=lang, code=chunk, font_size=font_size).pack(
                    fill="x", padx=8, pady=6
                )
        return outer

    @staticmethod
    def build_assistant_streaming_shell(
        parent: ctk.CTkScrollableFrame,
        ts_label: str,
        font_size: FontSize,
        *,
        typing: bool = True,
    ) -> tuple[ctk.CTkFrame, ctk.CTkTextbox | None, ctk.CTkLabel | None]:
        """Returns outer frame, stream textbox (or None until swap), typing label."""
        outer = ctk.CTkFrame(parent, fg_color=CHAT_BG)
        outer.pack(fill="x", pady=(0, 12), padx=8)

        header = ctk.CTkFrame(outer, fg_color=CHAT_BG)
        header.pack(fill="x")
        ctk.CTkLabel(
            header,
            text="Orion",
            text_color=ACCENT,
            font=label_font(font_size, "bold"),
        ).pack(side="left")
        ctk.CTkLabel(header, text=ts_label, text_color=MUTED, font=label_font(font_size)).pack(
            side="left", padx=(8, 0)
        )

        bubble = ctk.CTkFrame(
            outer,
            fg_color=AI_BUBBLE,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=BORDER,
        )
        bubble.pack(fill="x", anchor="w")

        typing_lbl: ctk.CTkLabel | None = None
        stream_tb: ctk.CTkTextbox | None = None
        if typing:
            typing_lbl = ctk.CTkLabel(
                bubble,
                text="● ● ●",
                text_color=MUTED,
                font=label_font(font_size),
            )
            typing_lbl.pack(anchor="w", padx=14, pady=12)
        else:
            stream_tb = ctk.CTkTextbox(
                bubble,
                fg_color=AI_BUBBLE,
                text_color=TEXT_SOLID,
                font=chat_font(font_size),
                corner_radius=8,
                border_width=0,
                wrap="word",
            )
            stream_tb.pack(fill="both", expand=True, padx=10, pady=10)
        return outer, stream_tb, typing_lbl
