"""Read-only code block with copy action."""

from __future__ import annotations

import customtkinter as ctk

from app.theme import BORDER, CODE_BG, CORNER_RADIUS, TEXT, TEXT_SOLID
from app.theme import code_font, label_font
from app.theme import patch_ctk_textbox
from app.theme import FontSize


class CodeBlock(ctk.CTkFrame):
    def __init__(
        self,
        master: ctk.CTkFrame,
        *,
        language: str | None,
        code: str,
        font_size: FontSize,
    ) -> None:
        super().__init__(
            master,
            fg_color=CODE_BG,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=BORDER,
        )
        top = ctk.CTkFrame(self, fg_color=CODE_BG)
        top.pack(fill="x", padx=8, pady=(6, 0))
        lang = language or "code"
        ctk.CTkLabel(top, text=lang, text_color=TEXT, font=label_font(font_size)).pack(
            side="left"
        )
        ctk.CTkButton(
            top,
            text="Copy",
            width=56,
            height=28,
            corner_radius=8,
            command=self._copy,
            font=label_font(font_size),
        ).pack(side="right")

        self._code = code
        self._text = ctk.CTkTextbox(
            self,
            fg_color=CODE_BG,
            text_color=TEXT,
            font=code_font(font_size),
            corner_radius=8,
            border_width=0,
            wrap="none",
        )
        self._text.pack(fill="both", expand=True, padx=8, pady=(4, 8))
        self._text.insert("1.0", code)
        self._text.configure(state="disabled")
        patch_ctk_textbox(self._text, fg=TEXT_SOLID, bg=CODE_BG)

        lines = max(3, min(24, code.count("\n") + 2))
        self._text.configure(height=lines * 18)

    def _copy(self) -> None:
        self.clipboard_clear()
        self.clipboard_append(self._code)
        self.update()
