"""Sidebar: new chat, grouped history, rename/delete, search."""

from __future__ import annotations

import tkinter as tk
from collections.abc import Callable
from tkinter import simpledialog

import customtkinter as ctk

from app.theme import ACCENT, BORDER, ENTRY_BG_SOLID, MUTED, SIDEBAR_BG, TEXT, TEXT_SOLID
from app.theme import FontSize, label_font
from app.theme import patch_ctk_entry, patch_ctk_scrollable_canvas
from services import chat_storage


class Sidebar:
    def __init__(
        self,
        parent: ctk.CTkFrame,
        *,
        font_size: FontSize,
        chats_dir,
        on_select_chat: Callable[[str], None],
        on_new_chat: Callable[[], None],
        on_delete_chat: Callable[[str], None],
        on_rename_chat: Callable[[str, str], None],
        on_open_settings: Callable[[], None],
        on_export_chat: Callable[[str], None],
    ) -> None:
        self._font_size = font_size
        self._chats_dir = chats_dir
        self._on_select = on_select_chat
        self._on_new = on_new_chat
        self._on_delete = on_delete_chat
        self._on_rename = on_rename_chat
        self._on_settings = on_open_settings
        self._on_export = on_export_chat
        self._search_query = ""
        self._buttons: dict[str, ctk.CTkButton] = {}

        self._frame = ctk.CTkFrame(parent, fg_color=SIDEBAR_BG, width=220, corner_radius=0)

        title_row = ctk.CTkFrame(self._frame, fg_color=SIDEBAR_BG)
        title_row.pack(fill="x", padx=12, pady=(14, 8))
        ctk.CTkLabel(
            title_row,
            text="≡  Orion",
            text_color=TEXT,
            font=ctk.CTkFont(size=16, weight="bold"),
        ).pack(side="left")

        self._new_btn = ctk.CTkButton(
            self._frame,
            text="+ New Chat",
            fg_color=ACCENT,
            hover_color="#4f46e5",
            font=label_font(font_size, "bold"),
            command=self._on_new,
        )
        self._new_btn.pack(fill="x", padx=12, pady=(0, 8))

        self._search = ctk.CTkEntry(
            self._frame,
            placeholder_text="Search chats…",
            fg_color=ENTRY_BG_SOLID,
            border_color=BORDER,
            text_color=TEXT_SOLID,
            font=label_font(font_size),
        )
        patch_ctk_entry(self._search)
        self._search.pack(fill="x", padx=12, pady=(0, 8))
        self._search.pack_forget()
        self._search.bind("<KeyRelease>", self._on_search)

        self._list = ctk.CTkScrollableFrame(self._frame, fg_color=SIDEBAR_BG, corner_radius=0)
        self._list.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        patch_ctk_scrollable_canvas(self._list, bg=SIDEBAR_BG)

        bottom = ctk.CTkFrame(self._frame, fg_color=SIDEBAR_BG)
        bottom.pack(fill="x", padx=8, pady=(0, 12))
        ctk.CTkButton(
            bottom,
            text="⚙ Settings",
            fg_color="#252525",
            hover_color="#333333",
            font=label_font(font_size),
            command=self._on_settings,
        ).pack(fill="x")

        self._ctx_menu = tk.Menu(self._frame, tearoff=0)
        self._ctx_menu.add_command(label="Rename", command=self._ctx_rename)
        self._ctx_menu.add_command(label="Delete", command=self._ctx_delete)
        self._ctx_menu.add_command(label="Export Markdown…", command=self._ctx_export)
        self._ctx_chat_id: str | None = None

    def pack(self, **kwargs: object) -> None:
        self._frame.pack(**kwargs)

    def grid(self, **kwargs: object) -> None:
        self._frame.grid(**kwargs)

    def set_font_size(self, size: FontSize) -> None:
        self._font_size = size

    def set_font_size(self, size: FontSize, current_id: str | None = None) -> None:
        self._font_size = size
        self.refresh(current_id)

    def set_search_visible(self, visible: bool) -> None:
        if visible:
            self._search.pack(fill="x", padx=12, pady=(0, 8), after=self._new_btn)
            self._search.focus_set()
        elif self._search.winfo_ismapped():
            self._search.pack_forget()

    def _on_search(self, _e: tk.Event) -> None:
        self._search_query = self._search.get().strip().lower()
        self.refresh()

    def refresh(self, current_id: str | None = None) -> None:
        for w in self._list.winfo_children():
            w.destroy()
        self._buttons.clear()
        chats = chat_storage.list_chats(self._chats_dir)
        if self._search_query:
            chats = [
                c
                for c in chats
                if self._search_query in (c.get("title") or "").lower()
                or self._search_query in chat_storage.preview_title(c).lower()
            ]
        grouped = chat_storage.group_by_section(chats)
        for section in ("Today", "Yesterday", "This Week", "Older"):
            items = grouped.get(section, [])
            if not items:
                continue
            ctk.CTkLabel(
                self._list,
                text=section,
                text_color=MUTED,
                font=label_font(self._font_size),
            ).pack(anchor="w", pady=(8, 4))
            for c in items:
                cid = c["id"]
                label = chat_storage.preview_title(c)
                btn = ctk.CTkButton(
                    self._list,
                    text=f"  › {label}",
                    anchor="w",
                    fg_color="#252525" if cid != current_id else "#2d2d44",
                    hover_color="#333333",
                    text_color=TEXT,
                    font=label_font(self._font_size),
                    command=lambda i=cid: self._on_select(i),
                )
                btn.pack(fill="x", pady=2)
                btn.bind("<Button-2>", lambda e, i=cid: self._show_ctx(e, i))
                btn.bind("<Button-3>", lambda e, i=cid: self._show_ctx(e, i))
                btn.bind("<Control-Button-1>", lambda e, i=cid: self._show_ctx(e, i))
                self._buttons[cid] = btn

    def _show_ctx(self, event: tk.Event, chat_id: str) -> None:
        self._ctx_chat_id = chat_id
        try:
            self._ctx_menu.tk_popup(event.x_root, event.y_root)
        finally:
            self._ctx_menu.grab_release()

    def _ctx_rename(self) -> None:
        if not self._ctx_chat_id:
            return
        cid = self._ctx_chat_id
        data = next(
            (c for c in chat_storage.list_chats(self._chats_dir) if c.get("id") == cid),
            None,
        )
        initial = (data or {}).get("title") or ""
        new_title = simpledialog.askstring("Rename chat", "Title:", initialvalue=initial)
        if new_title is None:
            return
        new_title = new_title.strip() or "Untitled"
        self._on_rename(cid, new_title)
        self.refresh(cid)

    def _ctx_delete(self) -> None:
        if self._ctx_chat_id:
            self._on_delete(self._ctx_chat_id)

    def _ctx_export(self) -> None:
        if self._ctx_chat_id:
            self._on_export(self._ctx_chat_id)
