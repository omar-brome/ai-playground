"""Application state — session and cancellation handles."""

from __future__ import annotations

import os
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.theme import FontSize


def default_data_root() -> Path:
    env = os.environ.get("LYRA_DATA_DIR", "").strip()
    if env:
        return Path(env).expanduser()
    return Path.home() / ".orion"


@dataclass
class AppState:
    """Holds session state and cancellation handles."""

    data_root: Path = field(default_factory=default_data_root)
    current_chat_id: str | None = None
    selected_model: str = ""
    messages: list[dict[str, Any]] = field(default_factory=list)
    system_prompt: str = ""
    is_generating: bool = False
    cancel_event: threading.Event = field(default_factory=threading.Event)
    last_assistant_text: str = ""
    font_size: FontSize = "medium"
    temperature: float = 0.7

    def chats_dir(self) -> Path:
        d = self.data_root / "chats"
        d.mkdir(parents=True, exist_ok=True)
        return d

    def settings_path(self) -> Path:
        self.data_root.mkdir(parents=True, exist_ok=True)
        return self.data_root / "settings.json"

    def reset_cancel(self) -> None:
        self.cancel_event = threading.Event()

    def request_stop(self) -> None:
        self.cancel_event.set()
