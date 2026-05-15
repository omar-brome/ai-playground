"""Application settings JSON."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.theme import DEFAULT_SYSTEM_PROMPT, FontSize


DEFAULT_SETTINGS: dict[str, Any] = {
    "appearance_mode": "dark",
    "font_size": "medium",
    "send_on_enter": True,
    "default_system_prompt": DEFAULT_SYSTEM_PROMPT,
    "auto_title_chats": True,
    "save_chat_history": True,
    "window_geometry": "1200x800+100+100",
    "temperature": 0.7,
}


def load_settings(path: Path) -> dict[str, Any]:
    if not path.exists():
        return dict(DEFAULT_SETTINGS)
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_SETTINGS)
    merged = dict(DEFAULT_SETTINGS)
    merged.update(data)
    return merged


def save_settings(path: Path, settings: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


def validate_font_size(v: Any) -> FontSize:
    if v in ("small", "medium", "large"):
        return v  # type: ignore[return-value]
    return "medium"
