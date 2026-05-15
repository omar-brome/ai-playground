"""Background Ollama streaming worker (runs on a QThread)."""

from __future__ import annotations

import threading

from ollama import ResponseError
from PySide6.QtCore import QObject, Signal

from services import ollama_service


class OllamaStreamWorker(QObject):
    token_received = Signal(str)
    finished_ok = Signal(str)
    finished_error = Signal(str)
    done = Signal()

    def __init__(
        self,
        *,
        model: str,
        messages: list[dict[str, str]],
        temperature: float,
        cancel_event: threading.Event,
    ) -> None:
        super().__init__()
        self._model = model
        self._messages = messages
        self._temperature = temperature
        self._cancel_event = cancel_event

    def run_stream(self) -> None:
        try:
            parts: list[str] = []
            stream = ollama_service.stream_chat(
                self._model,
                self._messages,
                temperature=self._temperature,
                cancel_event=self._cancel_event,
            )
            for token in stream:
                parts.append(token)
                self.token_received.emit(token)
            self.finished_ok.emit("".join(parts))
        except ResponseError as e:
            self.finished_error.emit(str(e))
        except Exception as e:
            self.finished_error.emit(str(e))
        finally:
            self.done.emit()
