"""Read-only transcript with streaming assistant updates."""

from __future__ import annotations

from datetime import datetime

from PySide6.QtGui import QFont, QTextCursor
from PySide6.QtWidgets import QPlainTextEdit


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


class ChatTranscript(QPlainTextEdit):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setReadOnly(True)
        self.setUndoRedoEnabled(False)
        self._content_start: int | None = None

    def set_chat_font_points(self, pt: int) -> None:
        f = self.font()
        f.setPointSize(pt)
        self.setFont(f)

    def add_user(self, text: str, ts_iso: str) -> None:
        ts = format_timestamp(ts_iso)
        label = f"User ({ts})\n" if ts else "User\n"
        self.move_cursor_end()
        self.insertPlainText(label + text + "\n\n")

    def begin_assistant(self, ts_iso: str) -> None:
        self.move_cursor_end()
        ts = format_timestamp(ts_iso)
        label = f"Assistant ({ts})\n" if ts else "Assistant\n"
        self.insertPlainText(label)
        self._content_start = self.textCursor().position()

    def append_token(self, token: str) -> None:
        self.move_cursor_end()
        self.insertPlainText(token)
        self.ensureCursorVisible()

    def finalize_assistant(self, final_text: str) -> None:
        if self._content_start is None:
            self.move_cursor_end()
            self.insertPlainText(final_text + "\n\n")
            return
        c = self.textCursor()
        c.setPosition(self._content_start)
        c.movePosition(QTextCursor.MoveOperation.End, QTextCursor.MoveMode.KeepAnchor)
        c.removeSelectedText()
        c.insertText(final_text)
        self.move_cursor_end()
        self.insertPlainText("\n\n")
        self._content_start = None

    def move_cursor_end(self) -> None:
        c = self.textCursor()
        c.movePosition(QTextCursor.MoveOperation.End)
        self.setTextCursor(c)
