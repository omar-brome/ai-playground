"""Ollama HTTP + Python client helpers."""

from __future__ import annotations

import re
import subprocess
import threading
from collections.abc import Callable, Generator
from typing import Any

import ollama
import requests

OLLAMA_BASE = "http://localhost:11434"

_client = ollama.Client(host=OLLAMA_BASE)


def is_ollama_running(timeout: float = 2.0) -> bool:
    try:
        requests.get(f"{OLLAMA_BASE}/api/tags", timeout=timeout)
        return True
    except requests.RequestException:
        return False


def get_installed_models() -> list[dict[str, Any]]:
    response = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=10)
    response.raise_for_status()
    data = response.json()
    return list(data.get("models") or [])


def get_ollama_version() -> str:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/version", timeout=5)
        r.raise_for_status()
        j = r.json()
        return str(j.get("version", "unknown"))
    except requests.RequestException:
        return "unavailable"


def model_display_meta(model: dict[str, Any]) -> str:
    name = model.get("name", "")
    size = model.get("size")
    family = model.get("details", {}).get("family") if isinstance(model.get("details"), dict) else None
    parts = [name]
    if size is not None:
        gb = size / (1024**3)
        parts.append(f"{gb:.1f} GB")
    if family:
        parts.append(str(family))
    return " · ".join(parts)


def stream_chat(
    model: str,
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.7,
    cancel_event: threading.Event | None = None,
) -> Generator[str, None, None]:
    stream = _client.chat(
        model=model,
        messages=messages,
        stream=True,
        options={"temperature": temperature},
    )
    for chunk in stream:
        if cancel_event and cancel_event.is_set():
            break
        msg = chunk.get("message") or {}
        token = msg.get("content") or ""
        if token:
            yield token


def delete_model_remote(model_name: str) -> None:
    requests.delete(f"{OLLAMA_BASE}/api/delete", json={"name": model_name}, timeout=120)


def pull_model(
    model_name: str,
    line_callback: Callable[[str], None],
    percent_callback: Callable[[float | None], None],
) -> int:
    """Run `ollama pull` and parse progress. Returns process exit code."""
    process = subprocess.Popen(
        ["ollama", "pull", model_name],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert process.stdout is not None
    pct_pattern = re.compile(r"(\d{1,3})\s*%")
    for line in process.stdout:
        line_callback(line.rstrip())
        m = pct_pattern.search(line)
        if m:
            try:
                percent_callback(float(m.group(1)))
            except ValueError:
                percent_callback(None)
        else:
            percent_callback(None)
    process.wait()
    return process.returncode or 0
