"""Multiline input, attachments, send/stop, character counter."""

from __future__ import annotations

import tkinter as tk
from collections.abc import Callable
from pathlib import Path
from tkinter import filedialog

import customtkinter as ctk

from app.theme import ACCENT, BG, BORDER, CORNER_RADIUS, INPUT_BG_SOLID, MUTED, TEXT, TEXT_SOLID
from app.theme import patch_ctk_textbox
from app.theme import FontSize, chat_font, label_font


ATTACH_EXT = {".txt", ".md", ".py", ".js", ".swift", ".cpp", ".json", ".yaml", ".yml", ".rs", ".go"}
MAX_CHARS = 4096
SOFT_WARN = 3500


class InputBar:
    def __init__(
        self,
        parent: ctk.CTkFrame,
        *,
        font_size: FontSize,
        on_send: Callable[[str], None],
        on_stop: Callable[[], None],
    ) -> None:
        self._font_size = font_size
        self._on_send = on_send
        self._on_stop = on_stop
        self._send_on_enter = True
        self._attachments: list[tuple[str, str]] = []

        self._frame = ctk.CTkFrame(parent, fg_color=BG, corner_radius=0)

        self._chips = ctk.CTkFrame(self._frame, fg_color=BG)
        self._chips.pack(fill="x", padx=12, pady=(8, 0))

        row = ctk.CTkFrame(self._frame, fg_color=BG)
        row.pack(fill="both", expand=True, padx=12, pady=(6, 4))
        row.grid_columnconfigure(1, weight=1)

        self._attach_btn = ctk.CTkButton(
            row,
            text="📎",
            width=40,
            command=self._pick_file,
            fg_color="#252525",
            hover_color="#333333",
            font=chat_font(font_size),
        )
        self._attach_btn.grid(row=0, column=0, padx=(0, 8), sticky="nw", pady=(4, 0))

        self._entry = ctk.CTkTextbox(
            row,
            height=88,
            fg_color=INPUT_BG_SOLID,
            text_color=TEXT_SOLID,
            font=chat_font(font_size),
            border_width=1,
            border_color=BORDER,
            corner_radius=CORNER_RADIUS,
            wrap="word",
        )
        self._entry.grid(row=0, column=1, sticky="ew")
        patch_ctk_textbox(self._entry, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)
        self._entry.bind("<KeyRelease>", self._on_key_release)
        self._entry.bind("<Return>", self._on_return)

        btns = ctk.CTkFrame(row, fg_color=BG)
        btns.grid(row=0, column=2, padx=(8, 0), sticky="ne")

        self._stop_btn = ctk.CTkButton(
            btns,
            text="🟥",
            width=44,
            height=36,
            command=self._on_stop,
            fg_color="#7f1d1d",
            hover_color="#991b1b",
            font=chat_font(font_size),
        )
        self._stop_btn.pack(side="left", padx=(0, 6))

        self._send_btn = ctk.CTkButton(
            btns,
            text="→",
            width=48,
            height=36,
            command=self._submit,
            fg_color=ACCENT,
            hover_color="#4f46e5",
            font=ctk.CTkFont(size=18),
        )
        self._send_btn.pack(side="left")
        self._stop_btn.pack_forget()

        self._counter = ctk.CTkLabel(
            self._frame,
            text=f"0 / {MAX_CHARS}",
            text_color=MUTED,
            font=label_font(font_size),
        )
        self._counter.pack(anchor="e", padx=14, pady=(0, 10))

    def pack(self, **kwargs: object) -> None:
        self._frame.pack(**kwargs)

    def grid(self, **kwargs: object) -> None:
        self._frame.grid(**kwargs)

    def set_send_on_enter(self, val: bool) -> None:
        self._send_on_enter = val

    def focus_input(self) -> None:
        self._entry.focus_set()

    def set_font_size(self, size: FontSize) -> None:
        self._font_size = size
        self._entry.configure(font=chat_font(size))
        patch_ctk_textbox(self._entry, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)
        self._counter.configure(font=label_font(size))

    def set_generating(self, generating: bool) -> None:
        if generating:
            self._entry.configure(state="disabled")
            self._send_btn.configure(state="disabled")
            self._attach_btn.configure(state="disabled")
            self._stop_btn.pack(side="left", padx=(0, 6), before=self._send_btn)
        else:
            self._entry.configure(state="normal")
            self._send_btn.configure(state="normal")
            self._attach_btn.configure(state="normal")
            self._stop_btn.pack_forget()
            patch_ctk_textbox(self._entry, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)

    def clear(self) -> None:
        self._entry.configure(state="normal")
        self._entry.delete("1.0", "end")
        self._attachments.clear()
        self._refresh_chips()
        self._update_counter()
        patch_ctk_textbox(self._entry, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)

    def get_message_text(self) -> str:
        base = self._entry.get("1.0", "end-1c").strip()
        extra_parts: list[str] = []
        for name, content in self._attachments:
            extra_parts.append(f"\n\n[File: {name}]\n```\n{content}\n```")
        if extra_parts:
            return (base + "".join(extra_parts)).strip()
        return base

    def _pick_file(self) -> None:
        path = filedialog.askopenfilename(
            title="Attach file",
            filetypes=[
                ("Supported", "*.txt *.md *.py *.js *.swift *.cpp *.json *.yaml *.yml *.rs *.go"),
                ("All", "*.*"),
            ],
        )
        if not path:
            return
        p = Path(path)
        if p.suffix.lower() not in ATTACH_EXT:
            return
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return
        self._attachments.append((p.name, text))
        self._refresh_chips()

    def _refresh_chips(self) -> None:
        for w in self._chips.winfo_children():
            w.destroy()
        if not self._attachments:
            return
        for i, (name, _) in enumerate(self._attachments):
            chip = ctk.CTkFrame(self._chips, fg_color="#252525", corner_radius=8)
            chip.pack(side="left", padx=(0, 6), pady=4)
            ctk.CTkLabel(chip, text=name, text_color=TEXT, font=label_font(self._font_size)).pack(
                side="left", padx=(8, 4), pady=4
            )
            ctk.CTkButton(
                chip,
                text="×",
                width=22,
                height=22,
                command=lambda idx=i: self._remove_attachment(idx),
                fg_color=("#252525", "#252525"),
                hover_color="#333",
                font=label_font(self._font_size),
            ).pack(side="right", padx=(0, 6))

    def _remove_attachment(self, idx: int) -> None:
        if 0 <= idx < len(self._attachments):
            self._attachments.pop(idx)
            self._refresh_chips()

    def _on_key_release(self, _event: tk.Event) -> None:
        self._update_counter()

    def _update_counter(self) -> None:
        n = len(self._entry.get("1.0", "end-1c"))
        col = MUTED if n < SOFT_WARN else ("#f59e0b" if n < MAX_CHARS else "#ef4444")
        self._counter.configure(text=f"{n} / {MAX_CHARS}", text_color=col)

    def _on_return(self, event: tk.Event) -> str | None:
        if not self._send_on_enter:
            return None
        # Shift+Return → newline; plain Return → send
        if getattr(event, "state", 0) & 0x0001:
            return None
        self._submit()
        return "break"

    def _submit(self) -> None:
        text = self.get_message_text()
        if not text:
            return
        if len(text) > MAX_CHARS:
            return
        self._on_send(text)
        self.clear()
