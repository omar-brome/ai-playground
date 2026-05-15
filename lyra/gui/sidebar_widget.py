"""Sidebar: chat list, search, new chat, settings."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from PySide6.QtCore import QPoint, Qt
from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMenu,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from app.theme import ACCENT, MUTED, SIDEBAR_BG, TEXT, label_font_point
from app.theme import FontSize
from services import chat_storage


class LyraSidebar(QWidget):
    def __init__(
        self,
        *,
        chats_dir: Callable[[], Path],
        font_size: FontSize,
        on_select: Callable[[str], None],
        on_new: Callable[[], None],
        on_delete: Callable[[str], None],
        on_rename: Callable[[str, str], None],
        on_export: Callable[[str], None],
        on_open_settings: Callable[[], None],
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        self._chats_dir = chats_dir
        self._font_size = font_size
        self._on_select = on_select
        self._on_new = on_new
        self._on_delete = on_delete
        self._on_rename = on_rename
        self._on_export = on_export
        self._on_open_settings = on_open_settings
        self._search_query = ""
        self._highlight_id: str | None = None
        self.setMinimumWidth(220)
        self.setStyleSheet(f"LyraSidebar {{ background-color: {SIDEBAR_BG}; }}")

        root = QVBoxLayout(self)
        root.setContentsMargins(12, 14, 12, 12)
        root.setSpacing(8)

        title = QLabel("Lyra")
        tpt = label_font_point(font_size) + 4
        title.setStyleSheet(f"color: {TEXT}; font-size: {tpt}px; font-weight: bold;")
        root.addWidget(title)

        self._new_btn = QPushButton("+ New Chat")
        self._new_btn.clicked.connect(self._on_new)
        self._style_button(self._new_btn, accent=True)
        root.addWidget(self._new_btn)

        self._search = QLineEdit()
        self._search.setPlaceholderText("Search chats…")
        self._search.textChanged.connect(self._on_search_changed)
        self._style_line_edit(self._search)
        root.addWidget(self._search)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self._list_host = QWidget()
        self._list_layout = QVBoxLayout(self._list_host)
        self._list_layout.setContentsMargins(0, 0, 0, 0)
        self._list_layout.setSpacing(4)
        scroll.setWidget(self._list_host)
        root.addWidget(scroll, 1)

        settings_btn = QPushButton("Settings")
        settings_btn.clicked.connect(self._on_open_settings)
        self._style_button(settings_btn, accent=False)
        root.addWidget(settings_btn)

    def set_font_size(self, size: FontSize) -> None:
        self._font_size = size

    def refresh(self, current_id: str | None = None) -> None:
        if current_id is not None:
            self._highlight_id = current_id
        while self._list_layout.count():
            item = self._list_layout.takeAt(0)
            w = item.widget()
            if w is not None:
                w.deleteLater()
        chats_dir = self._chats_dir()
        chats = chat_storage.list_chats(chats_dir)
        q = self._search_query.strip().lower()
        if q:
            chats = [
                c
                for c in chats
                if q in (c.get("title") or "").lower()
                or q in chat_storage.preview_title(c).lower()
            ]
        grouped = chat_storage.group_by_section(chats)
        for section in ("Today", "Yesterday", "This Week", "Older"):
            items = grouped.get(section, [])
            if not items:
                continue
            sec_lbl = QLabel(section)
            sec_lbl.setStyleSheet(
                f"color: {MUTED}; font-size: {label_font_point(self._font_size)}px;"
            )
            self._list_layout.addWidget(sec_lbl)
            for c in items:
                cid = c["id"]
                label = chat_storage.preview_title(c)
                btn = QPushButton(f"  › {label}")
                btn.setObjectName(f"chat_{cid}")
                btn.setProperty("chat_id", cid)
                is_current = cid == self._highlight_id
                self._style_chat_button(btn, selected=is_current)
                btn.clicked.connect(lambda checked=False, i=cid: self._on_select(i))
                btn.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
                btn.customContextMenuRequested.connect(
                    lambda pos, i=cid, b=btn: self._open_context_menu(b, i, pos)
                )
                self._list_layout.addWidget(btn)
        self._list_layout.addStretch(1)

    def focus_search(self) -> None:
        self._search.setFocus()

    def _on_search_changed(self, text: str) -> None:
        self._search_query = text
        self.refresh(self._highlight_id)

    def _open_context_menu(self, btn: QPushButton, chat_id: str, pos: QPoint) -> None:
        menu = QMenu(self)
        menu.addAction("Rename", lambda: self._do_rename(chat_id))
        menu.addAction("Export Markdown…", lambda: self._on_export(chat_id))
        menu.addAction("Delete", lambda: self._confirm_delete(chat_id))
        menu.exec(btn.mapToGlobal(pos))

    def _do_rename(self, chat_id: str) -> None:
        from PySide6.QtWidgets import QInputDialog

        data = next(
            (c for c in chat_storage.list_chats(self._chats_dir()) if c.get("id") == chat_id),
            None,
        )
        initial = (data or {}).get("title") or ""
        text, ok = QInputDialog.getText(self, "Rename chat", "Title:", text=initial)
        if ok and text.strip():
            self._on_rename(chat_id, text.strip())

    def _confirm_delete(self, chat_id: str) -> None:
        r = QMessageBox.question(
            self,
            "Delete chat",
            "Delete this conversation?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if r == QMessageBox.StandardButton.Yes:
            self._on_delete(chat_id)

    def _style_button(self, btn: QPushButton, *, accent: bool) -> None:
        pt = label_font_point(self._font_size)
        if accent:
            btn.setStyleSheet(
                f"""
                QPushButton {{
                    background-color: {ACCENT};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px;
                    font-size: {pt}px;
                    font-weight: bold;
                }}
                QPushButton:hover {{ background-color: #4f46e5; }}
                """
            )
        else:
            btn.setStyleSheet(
                f"""
                QPushButton {{
                    background-color: #252525;
                    color: {TEXT};
                    border: none;
                    border-radius: 6px;
                    padding: 8px;
                    font-size: {pt}px;
                }}
                QPushButton:hover {{ background-color: #333333; }}
                """
            )

    def _style_line_edit(self, w: QLineEdit) -> None:
        pt = label_font_point(self._font_size)
        w.setStyleSheet(
            f"""
            QLineEdit {{
                background-color: #1a1a1a;
                color: #f3f4f6;
                border: 1px solid #2a2a2a;
                border-radius: 6px;
                padding: 6px;
                font-size: {pt}px;
            }}
            """
        )

    def _style_chat_button(self, btn: QPushButton, *, selected: bool) -> None:
        pt = label_font_point(self._font_size)
        bg = "#2d2d44" if selected else "#252525"
        btn.setStyleSheet(
            f"""
            QPushButton {{
                background-color: {bg};
                color: {TEXT};
                border: none;
                border-radius: 6px;
                padding: 6px;
                text-align: left;
                font-size: {pt}px;
            }}
            QPushButton:hover {{ background-color: #333333; }}
            """
        )
