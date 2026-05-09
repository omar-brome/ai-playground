"""Persistent chat history as JSON files under ~/.orion/chats/."""

from __future__ import annotations

import json
import os
import re
import tempfile
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Literal

Section = Literal["Today", "Yesterday", "This Week", "Older"]


def _iso_now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def iso_now() -> str:
    return _iso_now()


def new_chat_id() -> str:
    return f"chat_{uuid.uuid4().hex[:12]}"


def title_from_first_message(text: str, max_words: int = 5) -> str:
    words = text.strip().split()
    if not words:
        return "New chat"
    chunk = words[:max_words]
    t = " ".join(chunk)
    if len(words) > max_words:
        t += "..."
    return t[:80]


def chat_path(chats_dir: Path, chat_id: str) -> Path:
    safe = re.sub(r"[^\w\-]", "_", chat_id)
    return chats_dir / f"{safe}.json"


def atomic_write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", closefd=True) as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        Path(tmp).replace(path)
    except Exception:
        Path(tmp).unlink(missing_ok=True)
        raise


def load_chat(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_chat(chats_dir: Path, payload: dict[str, Any]) -> Path:
    cid = payload["id"]
    p = chat_path(chats_dir, cid)
    atomic_write_json(p, payload)
    return p


def delete_chat(chats_dir: Path, chat_id: str) -> None:
    p = chat_path(chats_dir, chat_id)
    p.unlink(missing_ok=True)


def list_chats(chats_dir: Path) -> list[dict[str, Any]]:
    if not chats_dir.is_dir():
        return []
    out: list[dict[str, Any]] = []
    for p in chats_dir.glob("*.json"):
        try:
            data = load_chat(p)
            if "id" in data:
                out.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return out


def _parse_created(d: dict[str, Any]) -> datetime | None:
    raw = d.get("created_at") or ""
    try:
        return datetime.fromisoformat(raw)
    except (ValueError, TypeError):
        return None


def group_by_section(chats: list[dict[str, Any]]) -> dict[Section, list[dict[str, Any]]]:
    today = date.today()
    yesterday = today - timedelta(days=1)
    week_start = today - timedelta(days=7)

    grouped: dict[Section, list[dict[str, Any]]] = {
        "Today": [],
        "Yesterday": [],
        "This Week": [],
        "Older": [],
    }

    for c in chats:
        dt = _parse_created(c)
        if dt is None:
            grouped["Older"].append(c)
            continue
        d = dt.date()
        if d == today:
            grouped["Today"].append(c)
        elif d == yesterday:
            grouped["Yesterday"].append(c)
        elif d >= week_start:
            grouped["This Week"].append(c)
        else:
            grouped["Older"].append(c)

    key_time = lambda x: _parse_created(x) or datetime.min
    for sec in grouped:
        grouped[sec].sort(key=key_time, reverse=True)

    return grouped


def preview_title(chat: dict[str, Any], max_len: int = 30) -> str:
    title = chat.get("title") or "Untitled"
    if len(title) <= max_len:
        return title
    return title[: max_len - 1] + "…"


def clear_all_chats(chats_dir: Path) -> None:
    if not chats_dir.is_dir():
        return
    for p in chats_dir.glob("*.json"):
        p.unlink(missing_ok=True)
