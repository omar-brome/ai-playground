"""Application state — passed by reference, no globals."""

from __future__ import annotations

import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.theme import FontSize


@dataclass
class AppState:
    """Holds session state and cancellation handles."""

    orion_dir: Path = field(default_factory=lambda: Path.home() / ".orion")
    current_chat_id: str | None = None
    selected_model: str = ""
    messages: list[dict[str, Any]] = field(default_factory=list)
    system_prompt: str = ""
    is_generating: bool = False
    cancel_event: threading.Event = field(default_factory=threading.Event)
    last_assistant_text: str = ""
    font_size: FontSize = "medium"
    search_query: str = ""
    temperature: float = 0.7

    def chats_dir(self) -> Path:
        d = self.orion_dir / "chats"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def settings_path(self) -> Path:
        self.orion_dir.mkdir(parents=True, exist_ok=True)
        return self.orion_dir / "settings.json"

    def reset_cancel(self) -> None:
        self.cancel_event = threading.Event()

    def request_stop(self) -> None:
        self.cancel_event.set()
