"""Scrollable chat message list with streaming support."""

from __future__ import annotations

import tkinter as tk

import customtkinter as ctk

from app.theme import AI_BUBBLE, chat_font
from app.theme import CHAT_BG, TEXT_SOLID, FontSize
from app.theme import patch_ctk_scrollable_canvas, patch_ctk_textbox
from components.message_bubble import MessageBubble, format_timestamp


class ChatView:
    def __init__(self, parent: ctk.CTkFrame, font_size: FontSize) -> None:
        self._parent = parent
        self._font_size = font_size
        self._frame = ctk.CTkScrollableFrame(
            parent,
            fg_color=CHAT_BG,
            corner_radius=0,
        )
        self._frame.grid(row=0, column=0, sticky="nsew")
        patch_ctk_scrollable_canvas(self._frame)
        self._stream_outer: ctk.CTkFrame | None = None
        self._stream_bubble: ctk.CTkFrame | None = None
        self._stream_text: ctk.CTkTextbox | None = None
        self._typing_label: ctk.CTkLabel | None = None
        self._typing_after: str | None = None
        self._typing_phase = 0
        self._buffered = ""

    def widget(self) -> ctk.CTkScrollableFrame:
        return self._frame

    def set_font_size(self, size: FontSize) -> None:
        self._font_size = size

    def clear(self) -> None:
        self._stop_typing_anim()
        for w in self._frame.winfo_children():
            w.destroy()
        self._stream_outer = None
        self._stream_bubble = None
        self._stream_text = None
        self._typing_label = None
        self._buffered = ""

    def add_user(self, content: str, ts: str) -> None:
        MessageBubble.build_user(
            self._frame, content, format_timestamp(ts) or ts, self._font_size
        )
        self.scroll_to_end()

    def add_assistant(self, content: str, ts: str) -> None:
        MessageBubble.build_assistant_static(
            self._frame, content, format_timestamp(ts) or ts, self._font_size
        )
        self.scroll_to_end()

    def start_assistant_stream(self, ts: str) -> None:
        self._stop_typing_anim()
        self._buffered = ""
        outer, _tb, typing_l = MessageBubble.build_assistant_streaming_shell(
            self._frame,
            format_timestamp(ts) or ts,
            self._font_size,
            typing=True,
        )
        self._stream_outer = outer
        kids = outer.winfo_children()
        self._stream_bubble = kids[-1] if kids else None
        self._stream_text = None
        self._typing_label = typing_l
        self._typing_phase = 0
        if typing_l is not None:
            self._animate_typing()
        self.scroll_to_end()

    def _animate_typing(self) -> None:
        if self._typing_label is None:
            return
        try:
            if not self._typing_label.winfo_exists():
                return
        except tk.TclError:
            return
        patterns = ("● ○ ○", "○ ● ○", "○ ○ ●", "● ● ●")
        self._typing_label.configure(text=patterns[self._typing_phase % len(patterns)])
        self._typing_phase += 1
        self._typing_after = self._frame.after(350, self._animate_typing)

    def _stop_typing_anim(self) -> None:
        if self._typing_after:
            try:
                self._frame.after_cancel(self._typing_after)
            except (ValueError, tk.TclError):
                pass
        self._typing_after = None

    def append_stream(self, token: str) -> None:
        if not token:
            return
        self._buffered += token
        if self._typing_label is not None and self._stream_bubble is not None:
            self._stop_typing_anim()
            self._typing_label.destroy()
            self._typing_label = None
            self._stream_text = ctk.CTkTextbox(
                self._stream_bubble,
                fg_color=AI_BUBBLE,
                text_color=TEXT_SOLID,
                font=chat_font(self._font_size),
                corner_radius=8,
                border_width=0,
                wrap="word",
            )
            self._stream_text.pack(fill="both", expand=True, padx=10, pady=10)
            patch_ctk_textbox(self._stream_text, fg=TEXT_SOLID, bg=AI_BUBBLE)
        if self._stream_text is not None:
            self._stream_text.configure(state="normal")
            self._stream_text.insert("end", token)
            self._stream_text.configure(state="disabled")
            self._stream_text.see("end")
        self.scroll_to_end()

    def finalize_stream_replace(self, full_text: str, ts_display: str) -> None:
        """Remove streaming row and add parsed static assistant message."""
        self._stop_typing_anim()
        if self._stream_outer is not None:
            self._stream_outer.destroy()
        self._stream_outer = None
        self._stream_bubble = None
        self._stream_text = None
        self._typing_label = None
        self._buffered = ""
        MessageBubble.build_assistant_static(self._frame, full_text, ts_display, self._font_size)
        self.scroll_to_end()

    def scroll_to_end(self) -> None:
        try:
            self._frame._parent_canvas.yview_moveto(1.0)
        except Exception:
            pass
