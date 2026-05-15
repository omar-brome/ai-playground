"""Settings dialog (tabs: General, Models, Chat, About)."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from PySide6.QtCore import QObject, QThread, Signal, Qt
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDialog,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from app.theme import BG, DEFAULT_SYSTEM_PROMPT, MUTED, TEXT, label_font_point
from app.theme import FontSize
from services import chat_storage
from services import ollama_service
from services.settings_storage import save_settings

APP_VERSION = "0.1.0"


class _PullModelWorker(QObject):
    line = Signal(str)
    percent = Signal(object)
    finished = Signal(int)

    def __init__(self, model_name: str) -> None:
        super().__init__()
        self._model_name = model_name

    def run(self) -> None:
        def lc(s: str) -> None:
            self.line.emit(s)

        def pc(p: float | None) -> None:
            self.percent.emit(p)

        code = ollama_service.pull_model(self._model_name, lc, pc)
        self.finished.emit(code)


class SettingsDialog(QDialog):
    def __init__(
        self,
        parent: QWidget,
        *,
        settings: dict[str, Any],
        settings_path: Path,
        chats_dir: Path,
        font_size: FontSize,
        on_apply: Callable[[dict[str, Any]], None],
        refresh_models: Callable[[], None],
        on_history_cleared: Callable[[], None] | None = None,
    ) -> None:
        super().__init__(parent)
        self._settings = dict(settings)
        self._settings_path = settings_path
        self._chats_dir = chats_dir
        self._on_apply = on_apply
        self._refresh_models = refresh_models
        self._on_history_cleared = on_history_cleared
        self._font_size = font_size
        self._pull_thread: QThread | None = None

        self.setWindowTitle("Settings")
        self.resize(560, 440)
        self.setModal(True)

        root = QVBoxLayout(self)
        tabs = QTabWidget()
        root.addWidget(tabs)

        g = QWidget()
        g_form = QFormLayout(g)
        self._font_combo = QComboBox()
        self._font_combo.addItems(["Small", "Medium", "Large"])
        fs = str(self._settings.get("font_size", "medium")).lower()
        self._font_combo.setCurrentIndex(["small", "medium", "large"].index(fs) if fs in ("small", "medium", "large") else 1)
        g_form.addRow("Font size", self._font_combo)

        self._send_enter = QCheckBox("Send on Enter")
        self._send_enter.setChecked(bool(self._settings.get("send_on_enter", True)))
        g_form.addRow(self._send_enter)

        theme_note = QLabel("Lyra uses a fixed dark theme (Qt Fusion).")
        theme_note.setStyleSheet(f"color: {MUTED};")
        g_form.addRow(theme_note)
        tabs.addTab(g, "General")

        m = QWidget()
        m_layout = QVBoxLayout(m)
        pull_row = QHBoxLayout()
        self._pull_entry = QLineEdit()
        self._pull_entry.setPlaceholderText("model name e.g. llama3.2")
        pull_row.addWidget(self._pull_entry)
        pull_btn = QPushButton("Pull")
        pull_btn.clicked.connect(self._run_pull)
        pull_row.addWidget(pull_btn)
        m_layout.addLayout(pull_row)
        self._pull_bar = QProgressBar()
        self._pull_bar.setRange(0, 100)
        self._pull_bar.setValue(0)
        m_layout.addWidget(self._pull_bar)
        self._pull_log = QLabel("")
        self._pull_log.setStyleSheet(f"color: {MUTED};")
        m_layout.addWidget(self._pull_log)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        self._models_inner = QWidget()
        self._models_layout = QVBoxLayout(self._models_inner)
        self._models_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        scroll.setWidget(self._models_inner)
        m_layout.addWidget(scroll, 1)
        tabs.addTab(m, "Models")

        c = QWidget()
        c_form = QFormLayout(c)
        self._def_prompt = QTextEdit()
        self._def_prompt.setPlainText(self._settings.get("default_system_prompt", DEFAULT_SYSTEM_PROMPT))
        self._def_prompt.setMinimumHeight(72)
        c_form.addRow("Default system prompt", self._def_prompt)

        self._auto_title = QCheckBox("Auto-title chats")
        self._auto_title.setChecked(bool(self._settings.get("auto_title_chats", True)))
        c_form.addRow(self._auto_title)

        self._save_hist = QCheckBox("Save chat history")
        self._save_hist.setChecked(bool(self._settings.get("save_chat_history", True)))
        c_form.addRow(self._save_hist)

        clear_btn = QPushButton("Clear all chat history…")
        clear_btn.setStyleSheet("background-color: #7f1d1d; color: white;")
        clear_btn.clicked.connect(self._clear_all)
        c_form.addRow(clear_btn)
        tabs.addTab(c, "Chat")

        a = QWidget()
        a_layout = QVBoxLayout(a)
        title = QLabel(f"Lyra {APP_VERSION}")
        title.setStyleSheet("font-size: 18px; font-weight: bold;")
        a_layout.addWidget(title)
        ver = ollama_service.get_ollama_version()
        a_layout.addWidget(QLabel(f"Ollama: {ver}"))
        a_layout.addWidget(QLabel("Local inference only — no cloud APIs."))
        a_layout.addStretch(1)
        tabs.addTab(a, "About")

        btn_row = QHBoxLayout()
        btn_row.addStretch(1)
        ok_btn = QPushButton("OK")
        ok_btn.clicked.connect(self._accept)
        btn_row.addWidget(ok_btn)
        root.addLayout(btn_row)

        self._style_dialog()
        self._populate_models_list()

    def _style_dialog(self) -> None:
        self.setStyleSheet(
            f"""
            QDialog {{ background-color: {BG}; }}
            QLabel {{ color: {TEXT}; }}
            QTabWidget::pane {{ border: 1px solid #2a2a2a; }}
            QLineEdit, QTextEdit {{
                background-color: #141414;
                color: #f3f4f6;
                border: 1px solid #2a2a2a;
                border-radius: 4px;
                padding: 4px;
                font-size: {label_font_point(self._font_size)}px;
            }}
            QComboBox {{
                background-color: #252525;
                color: {TEXT};
                padding: 4px;
            }}
            """
        )

    def _merged(self) -> dict[str, Any]:
        fs_map = {0: "small", 1: "medium", 2: "large"}
        self._settings["font_size"] = fs_map.get(self._font_combo.currentIndex(), "medium")
        self._settings["send_on_enter"] = self._send_enter.isChecked()
        self._settings["default_system_prompt"] = self._def_prompt.toPlainText().strip() or DEFAULT_SYSTEM_PROMPT
        self._settings["auto_title_chats"] = self._auto_title.isChecked()
        self._settings["save_chat_history"] = self._save_hist.isChecked()
        return self._settings

    def _accept(self) -> None:
        data = self._merged()
        save_settings(self._settings_path, data)
        self._on_apply(data)
        self.accept()

    def closeEvent(self, event) -> None:  # type: ignore[override]
        if self._pull_thread and self._pull_thread.isRunning():
            event.ignore()
            return
        data = self._merged()
        save_settings(self._settings_path, data)
        self._on_apply(data)
        super().closeEvent(event)

    def _populate_models_list(self) -> None:
        while self._models_layout.count():
            item = self._models_layout.takeAt(0)
            w = item.widget()
            if w is not None:
                w.deleteLater()
        try:
            models = ollama_service.get_installed_models()
        except Exception:
            models = []
        for mod in models:
            name = mod.get("name", "?")
            meta = ollama_service.model_display_meta(mod)
            row = QWidget()
            row.setStyleSheet("background-color: #1a1a1a; border-radius: 8px;")
            h = QHBoxLayout(row)
            h.addWidget(QLabel(name), 1)
            h.addWidget(QLabel(meta))
            del_btn = QPushButton("Delete")
            del_btn.setStyleSheet("background-color: #7f1d1d; color: white;")
            del_btn.clicked.connect(lambda _=False, n=name: self._delete_model(n))
            h.addWidget(del_btn)
            self._models_layout.addWidget(row)

    def _delete_model(self, name: str) -> None:
        r = QMessageBox.question(
            self,
            "Delete model",
            f"Delete Ollama model {name}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if r != QMessageBox.StandardButton.Yes:
            return
        try:
            ollama_service.delete_model_remote(name)
        except Exception as exc:
            QMessageBox.critical(self, "Error", str(exc))
            return
        self._populate_models_list()
        self._refresh_models()

    def _run_pull(self) -> None:
        name = self._pull_entry.text().strip()
        if not name or (self._pull_thread and self._pull_thread.isRunning()):
            return
        self._pull_bar.setValue(0)
        self._pull_log.setText("")
        th = QThread()
        worker = _PullModelWorker(name)
        worker.moveToThread(th)
        th.started.connect(worker.run)
        worker.line.connect(self._on_pull_line)
        worker.percent.connect(self._on_pull_pct)
        worker.finished.connect(self._on_pull_done)
        worker.finished.connect(th.quit)
        worker.finished.connect(worker.deleteLater)
        th.finished.connect(th.deleteLater)
        th.finished.connect(self._clear_pull_thread)
        self._pull_thread = th
        th.start()

    def _clear_pull_thread(self) -> None:
        self._pull_thread = None

    def _on_pull_line(self, line: str) -> None:
        self._pull_log.setText(line[:120])

    def _on_pull_pct(self, p: object) -> None:
        if p is None:
            self._pull_bar.setValue(0)
        else:
            self._pull_bar.setValue(int(min(100, max(0, float(p)))))

    def _on_pull_done(self, code: int) -> None:
        self._pull_bar.setValue(100 if code == 0 else 0)
        self._pull_log.setText("Done." if code == 0 else f"Exit {code}")
        self._populate_models_list()
        self._refresh_models()

    def _clear_all(self) -> None:
        r = QMessageBox.question(
            self,
            "Clear history",
            "Delete all saved chats?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if r != QMessageBox.StandardButton.Yes:
            return
        chat_storage.clear_all_chats(self._chats_dir)
        self._on_apply(self._merged())
        if self._on_history_cleared:
            self._on_history_cleared()
