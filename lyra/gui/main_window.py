"""Main window: layout, Ollama streaming, persistence."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from PySide6.QtCore import Qt, QThread, QTimer, QRect, Signal
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import (
    QComboBox,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QSlider,
    QSplitter,
    QVBoxLayout,
    QWidget,
    QFileDialog,
)

from app.state import AppState
from app.theme import (
    ACCENT,
    BG,
    BANNER_BG,
    BANNER_FG,
    CHAT_BG,
    DEFAULT_SYSTEM_PROMPT,
    MUTED,
    TEXT,
    chat_font_point,
    label_font_point,
)
from app.theme import FontSize
from gui.chat_widget import ChatTranscript, format_timestamp
from gui.settings_dialog import SettingsDialog
from gui.sidebar_widget import LyraSidebar
from services import chat_storage
from services import ollama_service
from services.settings_storage import load_settings, save_settings, validate_font_size
from workers.ollama_worker import OllamaStreamWorker


class MessageInput(QPlainTextEdit):
    send_requested = Signal()

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._send_on_enter = True
        self.setMaximumBlockCount(0)
        self.setFixedHeight(88)

    def set_send_on_enter(self, on: bool) -> None:
        self._send_on_enter = on

    def keyPressEvent(self, event) -> None:  # type: ignore[override]
        if self._send_on_enter and event.key() in (
            Qt.Key.Key_Return,
            Qt.Key.Key_Enter,
        ):
            mods = event.modifiers()
            if not (mods & Qt.KeyboardModifier.ShiftModifier):
                event.accept()
                self.send_requested.emit()
                return
        super().keyPressEvent(event)


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self._state = AppState()
        self._settings: dict[str, Any] = load_settings(self._state.settings_path())
        self._font_size: FontSize = validate_font_size(self._settings.get("font_size"))
        self._state.font_size = self._font_size
        self._state.temperature = float(self._settings.get("temperature", 0.7))

        self._payload: dict[str, Any] = {}
        self._stream_thread: QThread | None = None
        self._stream_worker: OllamaStreamWorker | None = None

        self.setWindowTitle("Lyra")
        geom = self._settings.get("window_geometry", "1200x800+100+100")
        w, h, x, y = self._parse_geometry(str(geom))
        self.setGeometry(QRect(x, y, w, h))
        self.setMinimumSize(900, 600)

        central = QWidget()
        self.setCentralWidget(central)
        outer = QHBoxLayout(central)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)

        splitter = QSplitter(Qt.Orientation.Horizontal)
        outer.addWidget(splitter)

        self._sidebar = LyraSidebar(
            chats_dir=lambda: self._state.chats_dir(),
            font_size=self._font_size,
            on_select=self._open_chat,
            on_new=self._new_chat,
            on_delete=self._delete_chat,
            on_rename=self._rename_chat,
            on_export=self._export_chat,
            on_open_settings=self._open_settings,
        )
        splitter.addWidget(self._sidebar)

        right = QWidget()
        right_col = QVBoxLayout(right)
        right_col.setContentsMargins(0, 0, 0, 0)
        right_col.setSpacing(0)

        self._banner = QLabel("Ollama is not running. Start it with: ollama serve")
        self._banner.setStyleSheet(
            f"background-color: {BANNER_BG}; color: {BANNER_FG}; padding: 10px; font-size: 13px;"
        )
        self._banner.setWordWrap(True)
        right_col.addWidget(self._banner)

        header = QWidget()
        header.setStyleSheet(f"background-color: {BG};")
        hlay = QVBoxLayout(header)
        hlay.setContentsMargins(16, 12, 16, 8)

        row1 = QHBoxLayout()
        t = QLabel("Lyra")
        t.setStyleSheet(f"color: {TEXT}; font-size: 18px; font-weight: bold;")
        row1.addWidget(t)
        row1.addStretch(1)

        row1.addWidget(QLabel("Model:"))
        self._model_combo = QComboBox()
        self._model_combo.setMinimumWidth(200)
        self._model_combo.currentTextChanged.connect(self._on_model_changed)
        row1.addWidget(self._model_combo)

        ref = QPushButton("Refresh")
        ref.clicked.connect(self._refresh_models)
        row1.addWidget(ref)
        hlay.addLayout(row1)

        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Temperature"))
        self._temp_slider = QSlider(Qt.Orientation.Horizontal)
        self._temp_slider.setRange(0, 200)
        self._temp_slider.setValue(int(self._state.temperature * 100))
        self._temp_slider.setMaximumWidth(200)
        self._temp_slider.valueChanged.connect(self._on_temp_changed)
        row2.addWidget(self._temp_slider)
        self._temp_label = QLabel(f"{self._state.temperature:.2f}")
        self._temp_label.setStyleSheet(f"color: {TEXT}; min-width: 36px;")
        row2.addWidget(self._temp_label)
        row2.addStretch(1)
        self._prompt_toggle = QPushButton("System prompt ▾")
        self._prompt_toggle.setStyleSheet(f"color: {ACCENT}; border: none; background: transparent;")
        self._prompt_toggle.clicked.connect(self._toggle_prompt)
        row2.addWidget(self._prompt_toggle)
        hlay.addLayout(row2)

        self._prompt_edit = QPlainTextEdit()
        self._prompt_edit.setPlaceholderText("System prompt…")
        self._prompt_edit.setMaximumHeight(80)
        self._style_input(self._prompt_edit)
        self._prompt_edit.textChanged.connect(self._on_prompt_edited)
        self._prompt_edit.hide()
        hlay.addWidget(self._prompt_edit)

        right_col.addWidget(header)

        self._chat = ChatTranscript()
        self._chat.setStyleSheet(
            f"QPlainTextEdit {{ background-color: {CHAT_BG}; color: #f3f4f6; border: none; padding: 12px; }}"
        )
        self._apply_chat_font()
        right_col.addWidget(self._chat, 1)

        meta = QHBoxLayout()
        self._token_label = QLabel("Tokens ~0")
        self._token_label.setStyleSheet(f"color: {MUTED}; font-size: {label_font_point(self._font_size)}px;")
        meta.addStretch(1)
        meta.addWidget(self._token_label)
        right_col.addLayout(meta)

        inp_row = QHBoxLayout()
        self._input = MessageInput()
        self._style_input(self._input)
        self._input.set_send_on_enter(bool(self._settings.get("send_on_enter", True)))
        self._input.send_requested.connect(self._send_from_input)
        inp_row.addWidget(self._input, 1)

        self._send_btn = QPushButton("Send")
        self._send_btn.clicked.connect(self._send_from_input)
        inp_row.addWidget(self._send_btn)

        self._stop_btn = QPushButton("Stop")
        self._stop_btn.clicked.connect(self._on_stop)
        self._stop_btn.setEnabled(False)
        inp_row.addWidget(self._stop_btn)

        wrap = QWidget()
        wrap.setStyleSheet(f"background-color: {CHAT_BG};")
        wrap_l = QVBoxLayout(wrap)
        wrap_l.setContentsMargins(8, 8, 8, 8)
        wrap_l.addLayout(inp_row)
        right_col.addWidget(wrap)

        splitter.addWidget(right)
        splitter.setSizes([240, 960])

        self._banner_timer = QTimer(self)
        self._banner_timer.timeout.connect(self._update_ollama_banner)
        self._banner_timer.start(8000)
        self._update_ollama_banner()

        QShortcut(QKeySequence.StandardKey.New, self, self._new_chat)
        QShortcut(QKeySequence.StandardKey.Preferences, self, self._open_settings)
        QShortcut(QKeySequence(Qt.Key.Key_Escape), self, self._on_escape)

        search_sc = QShortcut(QKeySequence.StandardKey.Find, self)
        search_sc.activated.connect(self._sidebar.focus_search)

        self._refresh_models()
        names = [self._model_combo.itemText(i) for i in range(self._model_combo.count())]
        usable = [n for n in names if n and not n.startswith("(")]
        if usable:
            self._state.selected_model = usable[0]

        self._set_temperature_ui(self._state.temperature)
        self._new_chat()

    def _parse_geometry(self, s: str) -> tuple[int, int, int, int]:
        """Return width, height, x, y."""
        try:
            pos = s.split("+")
            if len(pos) == 3:
                w, h = pos[0].split("x")
                return int(w), int(h), int(pos[1]), int(pos[2])
        except (ValueError, IndexError):
            pass
        return 1200, 800, 100, 100

    def _style_input(self, w: QPlainTextEdit) -> None:
        pt = label_font_point(self._font_size)
        w.setStyleSheet(
            f"""
            QPlainTextEdit {{
                background-color: #141414;
                color: #f3f4f6;
                border: 1px solid #2a2a2a;
                border-radius: 6px;
                padding: 6px;
                font-size: {pt}px;
            }}
            """

        )

    def _apply_chat_font(self) -> None:
        self._chat.set_chat_font_points(chat_font_point(self._font_size))

    def _update_ollama_banner(self) -> None:
        self._banner.setVisible(not ollama_service.is_ollama_running())

    def _toggle_prompt(self) -> None:
        vis = not self._prompt_edit.isVisible()
        self._prompt_edit.setVisible(vis)
        self._prompt_toggle.setText("System prompt ▴" if vis else "System prompt ▾")

    def _on_prompt_edited(self) -> None:
        self._persist_current_chat()

    def _on_temp_changed(self, v: int) -> None:
        t = v / 100.0
        self._state.temperature = t
        self._temp_label.setText(f"{t:.2f}")
        self._settings["temperature"] = t
        save_settings(self._state.settings_path(), self._settings)

    def _set_temperature_ui(self, t: float) -> None:
        self._temp_slider.blockSignals(True)
        self._temp_slider.setValue(int(round(t * 100)))
        self._temp_slider.blockSignals(False)
        self._temp_label.setText(f"{t:.2f}")

    def _refresh_models(self, select_name: str | None = None) -> None:
        self._model_combo.blockSignals(True)
        self._model_combo.clear()
        try:
            models = ollama_service.get_installed_models()
        except Exception:
            models = []
        names = [m.get("name", "") for m in models if m.get("name")]
        if not names:
            self._model_combo.addItem("(no models)")
            self._model_combo.blockSignals(False)
            return
        for n in names:
            self._model_combo.addItem(n)
        pick = select_name if select_name in names else names[0]
        idx = names.index(pick)
        self._model_combo.setCurrentIndex(idx)
        self._state.selected_model = pick
        self._model_combo.blockSignals(False)

    def _on_model_changed(self, name: str) -> None:
        if self._state.is_generating:
            return
        if not name or name.startswith("("):
            return
        prev = self._state.selected_model
        if prev and prev != name and self._state.messages:
            r = QMessageBox.question(
                self,
                "Switch model",
                f"Switch to {name}? This will start a new chat.",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            )
            if r == QMessageBox.StandardButton.Yes:
                self._state.selected_model = name
                self._new_chat()
            else:
                self._model_combo.blockSignals(True)
                idx = self._model_combo.findText(prev)
                if idx >= 0:
                    self._model_combo.setCurrentIndex(idx)
                self._model_combo.blockSignals(False)
            return
        self._state.selected_model = name

    def _current_model(self) -> str:
        return self._model_combo.currentText()

    def _get_system_prompt(self) -> str:
        return self._prompt_edit.toPlainText().strip() or DEFAULT_SYSTEM_PROMPT

    def _new_chat(self) -> None:
        if self._state.is_generating:
            return
        self._chat.clear()
        cid = chat_storage.new_chat_id()
        now = chat_storage.iso_now()
        self._state.current_chat_id = cid
        self._state.messages = []
        sp = str(self._settings.get("default_system_prompt", DEFAULT_SYSTEM_PROMPT))
        self._prompt_edit.blockSignals(True)
        self._prompt_edit.setPlainText(sp)
        self._prompt_edit.blockSignals(False)
        self._state.system_prompt = sp
        model = self._current_model()
        if not model.startswith("("):
            self._state.selected_model = model
        self._payload = {
            "id": cid,
            "title": "New chat",
            "created_at": now,
            "model": model,
            "system_prompt": sp,
            "messages": [],
        }
        self._persist_current_chat()
        self._sidebar.refresh(cid)
        self._update_token_estimate()

    def _open_chat(self, chat_id: str) -> None:
        if self._state.is_generating:
            return
        path = chat_storage.chat_path(self._state.chats_dir(), chat_id)
        if not path.exists():
            return
        data = chat_storage.load_chat(path)
        self._state.current_chat_id = data["id"]
        self._state.messages = list(data.get("messages") or [])
        self._state.system_prompt = data.get("system_prompt") or DEFAULT_SYSTEM_PROMPT
        self._prompt_edit.blockSignals(True)
        self._prompt_edit.setPlainText(self._state.system_prompt)
        self._prompt_edit.blockSignals(False)
        if data.get("model"):
            self._refresh_models(data["model"])
            self._state.selected_model = data["model"]
        self._chat.clear()
        for m in self._state.messages:
            role = m.get("role")
            content = m.get("content", "")
            ts = m.get("timestamp", "")
            if role == "user":
                self._chat.add_user(str(content), str(ts))
            elif role == "assistant":
                ts_disp = format_timestamp(str(ts)) if ts else ""
                hdr = f"Assistant ({ts_disp})\n" if ts_disp else "Assistant\n"
                self._chat.move_cursor_end()
                self._chat.insertPlainText(hdr + str(content) + "\n\n")
        self._payload = {
            "id": data["id"],
            "title": data.get("title", "Chat"),
            "created_at": data.get("created_at", chat_storage.iso_now()),
            "model": data.get("model", ""),
            "system_prompt": data.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
            "messages": self._state.messages,
        }
        self._sidebar.refresh(chat_id)
        self._update_token_estimate()

    def _current_payload(self) -> dict[str, Any]:
        base_title = "New chat"
        base_created = chat_storage.iso_now()
        base_title = self._payload.get("title", base_title)
        base_created = self._payload.get("created_at", base_created)
        return {
            "id": self._state.current_chat_id or "",
            "title": base_title,
            "created_at": base_created,
            "model": self._state.selected_model or self._current_model(),
            "system_prompt": self._get_system_prompt(),
            "messages": self._state.messages,
        }

    def _persist_current_chat(self) -> None:
        if not self._settings.get("save_chat_history", True):
            return
        if not self._state.current_chat_id:
            return
        chat_storage.save_chat(self._state.chats_dir(), self._current_payload())

    def _rename_chat(self, chat_id: str, new_title: str) -> None:
        path = chat_storage.chat_path(self._state.chats_dir(), chat_id)
        if not path.exists():
            return
        data = chat_storage.load_chat(path)
        data["title"] = new_title
        chat_storage.save_chat(self._state.chats_dir(), data)
        if chat_id == self._state.current_chat_id:
            self._payload["title"] = new_title
        self._sidebar.refresh(self._state.current_chat_id)

    def _delete_chat(self, chat_id: str) -> None:
        chat_storage.delete_chat(self._state.chats_dir(), chat_id)
        if chat_id == self._state.current_chat_id:
            self._new_chat()
        self._sidebar.refresh(self._state.current_chat_id)

    def _export_chat(self, chat_id: str) -> None:
        path = chat_storage.chat_path(self._state.chats_dir(), chat_id)
        if not path.exists():
            return
        data = chat_storage.load_chat(path)
        out, _ = QFileDialog.getSaveFileName(
            self,
            "Export chat",
            f"{data.get('title', 'chat')}.md",
            "Markdown (*.md);;Text (*.txt)",
        )
        if not out:
            return
        lines = [f"# {data.get('title', 'Chat')}\n", f"Model: {data.get('model', '')}\n\n"]
        for m in data.get("messages") or []:
            role = m.get("role", "")
            content = m.get("content", "")
            lines.append(f"## {role}\n\n{content}\n\n")
        Path(out).write_text("".join(lines), encoding="utf-8")

    def _build_api_messages(self) -> list[dict[str, str]]:
        sp = self._get_system_prompt().strip() or DEFAULT_SYSTEM_PROMPT
        msgs: list[dict[str, str]] = [{"role": "system", "content": sp}]
        for m in self._state.messages:
            r = m.get("role")
            c = m.get("content", "")
            if r in ("user", "assistant"):
                msgs.append({"role": r, "content": str(c)})
        return msgs

    def _send_from_input(self) -> None:
        text = self._input.toPlainText().strip()
        if not text:
            return
        if self._on_send(text):
            self._input.clear()

    def _on_send(self, text: str) -> bool:
        if not ollama_service.is_ollama_running():
            QMessageBox.warning(self, "Ollama", "Start Ollama with: ollama serve")
            return False
        model = self._current_model()
        if not model or model.startswith("("):
            QMessageBox.warning(self, "Model", "Pull a model first, e.g. ollama pull llama3.2")
            return False

        now = datetime.now().isoformat(timespec="seconds")
        user_msg = {"role": "user", "content": text, "timestamp": now}
        self._state.messages.append(user_msg)
        self._chat.add_user(text, now)

        if self._settings.get("auto_title_chats", True) and len(self._state.messages) == 1:
            self._payload["title"] = chat_storage.title_from_first_message(text)

        self._persist_current_chat()
        self._sidebar.refresh(self._state.current_chat_id)

        self._state.is_generating = True
        self._state.reset_cancel()
        self._send_btn.setEnabled(False)
        self._stop_btn.setEnabled(True)

        as_ts = datetime.now().isoformat(timespec="seconds")
        self._chat.begin_assistant(as_ts)

        def on_ok(text_out: str) -> None:
            self._chat.finalize_assistant(text_out)
            if text_out.strip():
                assistant_msg = {
                    "role": "assistant",
                    "content": text_out,
                    "timestamp": as_ts,
                }
                self._state.messages.append(assistant_msg)
                self._state.last_assistant_text = text_out
                self._persist_current_chat()
            self._finish_generation()
            self._update_token_estimate()

        def on_err(err: str) -> None:
            self._chat.finalize_assistant(f"**Error:** {err}")
            self._finish_generation()

        worker = OllamaStreamWorker(
            model=model,
            messages=self._build_api_messages(),
            temperature=self._state.temperature,
            cancel_event=self._state.cancel_event,
        )
        thread = QThread()
        worker.moveToThread(thread)
        thread.started.connect(worker.run_stream)
        worker.finished_ok.connect(on_ok)
        worker.finished_error.connect(on_err)
        worker.done.connect(thread.quit)
        worker.done.connect(worker.deleteLater)
        thread.finished.connect(self._cleanup_stream_thread)
        thread.finished.connect(thread.deleteLater)

        self._stream_thread = thread
        self._stream_worker = worker
        thread.start()
        self._update_token_estimate()
        return True

    def _cleanup_stream_thread(self) -> None:
        self._stream_thread = None
        self._stream_worker = None

    def _finish_generation(self) -> None:
        self._state.is_generating = False
        self._send_btn.setEnabled(True)
        self._stop_btn.setEnabled(False)

    def _on_stop(self) -> None:
        self._state.request_stop()

    def _on_escape(self) -> None:
        if self._state.is_generating:
            self._on_stop()

    def _update_token_estimate(self) -> None:
        n = sum(len(str(m.get("content", ""))) for m in self._state.messages)
        est = max(0, n // 4)
        self._token_label.setText(f"Tokens ~{est}")

    def _open_settings(self) -> None:
        def on_apply(new_settings: dict[str, Any]) -> None:
            self._settings.update(new_settings)
            save_settings(self._state.settings_path(), self._settings)
            self._font_size = validate_font_size(self._settings.get("font_size"))
            self._state.font_size = self._font_size
            self._apply_chat_font()
            self._style_input(self._input)
            self._style_input(self._prompt_edit)
            self._input.set_send_on_enter(bool(self._settings.get("send_on_enter", True)))
            self._token_label.setStyleSheet(
                f"color: {MUTED}; font-size: {label_font_point(self._font_size)}px;"
            )
            self._sidebar.set_font_size(self._font_size)
            self._sidebar.refresh(self._state.current_chat_id)
            self._set_temperature_ui(float(self._settings.get("temperature", self._state.temperature)))

        def on_cleared() -> None:
            self._new_chat()
            self._sidebar.refresh(self._state.current_chat_id)

        dlg = SettingsDialog(
            self,
            settings=self._settings,
            settings_path=self._state.settings_path(),
            chats_dir=self._state.chats_dir(),
            font_size=self._font_size,
            on_apply=on_apply,
            refresh_models=lambda: self._refresh_models(self._current_model()),
            on_history_cleared=on_cleared,
        )
        dlg.exec()

    def closeEvent(self, event) -> None:  # type: ignore[override]
        g = self.geometry()
        self._settings["window_geometry"] = f"{g.width()}x{g.height()}+{g.x()}+{g.y()}"
        save_settings(self._state.settings_path(), self._settings)
        super().closeEvent(event)

    def moveEvent(self, event) -> None:  # type: ignore[override]
        super().moveEvent(event)
        self._save_geometry()

    def resizeEvent(self, event) -> None:  # type: ignore[override]
        super().resizeEvent(event)
        self._save_geometry()

    def _save_geometry(self) -> None:
        g = self.geometry()
        self._settings["window_geometry"] = f"{g.width()}x{g.height()}+{g.x()}+{g.y()}"
        save_settings(self._state.settings_path(), self._settings)
