"""Main Orion window: layout, Ollama streaming, persistence, shortcuts."""

from __future__ import annotations

import threading
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import messagebox
from typing import Any

import customtkinter as ctk
from ollama import ResponseError

from app.state import AppState
from app.theme import BG, CHAT_BG, FontSize
from app.theme import MUTED, TEXT
from app.theme import DEFAULT_SYSTEM_PROMPT
from components.chat_view import ChatView
from components.input_bar import InputBar
from components.message_bubble import format_timestamp
from components.model_selector import ModelSelector
from components.settings_modal import SettingsModal
from components.sidebar import Sidebar
from services import chat_storage
from services import ollama_service
from services.settings_storage import load_settings, save_settings, validate_font_size


class OrionApp(tk.Tk):
    """Use classic ``tk.Tk`` as the OS window and host CustomTkinter inside it.

    On many macOS installs (Apple Tcl/Tk + Python), ``ctk.CTk`` as the root draws a blank
    white client area; embedding ``CTkFrame`` under ``tk.Tk`` avoids that broken canvas path.
    """

    def __init__(self) -> None:
        super().__init__()
        self._state = AppState()
        self._settings: dict[str, Any] = load_settings(self._state.settings_path())
        self._font_size: FontSize = validate_font_size(self._settings.get("font_size"))
        self._state.font_size = self._font_size
        self._state.temperature = float(self._settings.get("temperature", 0.7))

        # Dark engine only — Light/System + saved prefs caused white/invisible UI on some Mac builds.
        ctk.set_appearance_mode("dark")

        self.title("Orion")
        self.geometry(self._settings.get("window_geometry", "1200x800+100+100"))
        self.minsize(900, 600)
        self.configure(bg=BG)

        # Full-window CTk host (not ctk.CTk root — fixes blank white window on stock macOS Tk).
        self._shell = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        self._shell.pack(fill="both", expand=True)

        self._set_icon()

        self._shell.grid_columnconfigure(1, weight=1)
        self._shell.grid_rowconfigure(2, weight=1)

        self._header = ctk.CTkFrame(self._shell, fg_color=BG)
        self._header.grid(row=0, column=0, columnspan=2, sticky="ew", padx=0, pady=0)
        head_inner = ctk.CTkFrame(self._header, fg_color=BG)
        head_inner.pack(fill="x", padx=16, pady=12)
        ctk.CTkLabel(
            head_inner,
            text="Orion",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=TEXT,
        ).pack(side="left")
        self._model_selector = ModelSelector(
            head_inner,
            font_size=self._font_size,
            on_model_change=self._on_model_pick,
            on_system_prompt_change=self._on_system_prompt_change,
            on_temperature_change=self._on_temperature_change,
        )
        self._model_selector.pack(side="right")

        self._banner = ctk.CTkLabel(
            self._shell,
            text="⚠️ Ollama is not running. Start it with: ollama serve",
            text_color="#fbbf24",
            fg_color="#292524",
            corner_radius=8,
            font=ctk.CTkFont(size=13),
        )
        self._banner.grid(row=1, column=0, columnspan=2, sticky="ew", padx=12, pady=(0, 6))
        self._update_ollama_banner()

        self._sidebar = Sidebar(
            self._shell,
            font_size=self._font_size,
            chats_dir=self._state.chats_dir(),
            on_select_chat=self._open_chat,
            on_new_chat=self._new_chat,
            on_delete_chat=self._delete_chat,
            on_rename_chat=self._rename_chat,
            on_open_settings=self._open_settings,
            on_export_chat=self._export_chat_id,
        )
        self._sidebar.grid(row=2, column=0, sticky="nsew")

        self._center = ctk.CTkFrame(self._shell, fg_color=CHAT_BG)
        self._center.grid(row=2, column=1, sticky="nsew")
        self._center.grid_rowconfigure(0, weight=1)
        self._center.grid_columnconfigure(0, weight=1)

        self._chat_view = ChatView(self._center, self._font_size)
        self._chat_view.widget().grid(row=0, column=0, sticky="nsew", padx=0, pady=0)

        meta = ctk.CTkFrame(self._center, fg_color=CHAT_BG)
        meta.grid(row=1, column=0, sticky="ew", padx=12, pady=(0, 4))
        self._token_label = ctk.CTkLabel(
            meta,
            text="Tokens ~0",
            text_color=MUTED,
            font=ctk.CTkFont(size=12),
        )
        self._token_label.pack(side="right")

        self._input = InputBar(
            self._center,
            font_size=self._font_size,
            on_send=self._on_send,
            on_stop=self._on_stop,
        )
        self._input.grid(row=2, column=0, sticky="ew")
        self._input.set_send_on_enter(bool(self._settings.get("send_on_enter", True)))

        self.bind("<Configure>", self._on_configure_window)
        self.bind_all("<Command-n>", self._shortcut_new)
        self.bind_all("<Command-comma>", self._shortcut_settings)
        self.bind_all("<Command-k>", self._shortcut_focus_input)
        self.bind_all("<Command-BackSpace>", self._shortcut_delete_chat)
        self.bind_all("<Command-Delete>", self._shortcut_delete_chat)
        self.bind_all("<Escape>", self._shortcut_stop)
        self.bind_all("<Command-f>", self._shortcut_search)
        self.bind_all("<Command-c>", self._shortcut_copy_last)

        self.after(500, self._tick_banner)

        names = self._model_selector.refresh_models()
        self._model_selector.set_temperature(self._state.temperature)
        if names:
            self._state.selected_model = self._model_selector.current_model()

        self._new_chat()
        self._sidebar.refresh(self._state.current_chat_id)

        self.update_idletasks()

    # --- Window / platform ---
    def _set_icon(self) -> None:
        icon_path = Path(__file__).resolve().parent.parent / "assets" / "icon.png"
        if icon_path.is_file():
            try:
                img = tk.PhotoImage(file=str(icon_path))
                self.iconphoto(True, img)
                self._icon_ref = img
            except tk.TclError:
                pass

    def _on_configure_window(self, event: tk.Event) -> None:
        if event.widget is self:
            self._settings["window_geometry"] = self.geometry()
            save_settings(self._state.settings_path(), self._settings)

    def _update_ollama_banner(self) -> None:
        if ollama_service.is_ollama_running():
            self._banner.grid_remove()
        else:
            self._banner.grid()

    def _tick_banner(self) -> None:
        self._update_ollama_banner()
        self.after(8000, self._tick_banner)

    # --- Model / prompts ---
    def _on_model_pick(self, model_name: str) -> None:
        if self._state.is_generating:
            return
        if not model_name or model_name.startswith("("):
            return
        prev = self._state.selected_model
        if prev and prev != model_name and self._state.messages:
            if messagebox.askyesno(
                "Switch model",
                f"Switch to {model_name}? This will start a new chat.",
            ):
                self._state.selected_model = model_name
                self._new_chat()
            else:
                self._model_selector.set_model(prev)
            return
        self._state.selected_model = model_name

    def _on_system_prompt_change(self, _text: str) -> None:
        self._persist_current_chat()

    def _on_temperature_change(self, t: float) -> None:
        self._state.temperature = t
        self._settings["temperature"] = t
        save_settings(self._state.settings_path(), self._settings)

    # --- Chat lifecycle ---
    def _new_chat(self) -> None:
        if self._state.is_generating:
            return
        self._chat_view.clear()
        cid = chat_storage.new_chat_id()
        now = chat_storage.iso_now()
        self._state.current_chat_id = cid
        self._state.messages = []
        sp = self._settings.get("default_system_prompt", DEFAULT_SYSTEM_PROMPT)
        self._model_selector.set_system_prompt(sp)
        self._state.system_prompt = sp
        model = self._model_selector.current_model()
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
        self._model_selector.set_system_prompt(self._state.system_prompt)
        if data.get("model"):
            self._model_selector.set_model(data["model"])
            self._state.selected_model = data["model"]
        self._chat_view.clear()
        for m in self._state.messages:
            role = m.get("role")
            content = m.get("content", "")
            ts = m.get("timestamp", "")
            if role == "user":
                self._chat_view.add_user(content, ts)
            elif role == "assistant":
                self._chat_view.add_assistant(content, ts)
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
        if hasattr(self, "_payload"):
            base_title = self._payload.get("title", base_title)
            base_created = self._payload.get("created_at", base_created)
        return {
            "id": self._state.current_chat_id or "",
            "title": base_title,
            "created_at": base_created,
            "model": self._state.selected_model or self._model_selector.current_model(),
            "system_prompt": self._model_selector.get_system_prompt(),
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
        if chat_id == self._state.current_chat_id and hasattr(self, "_payload"):
            self._payload["title"] = new_title
        self._sidebar.refresh(self._state.current_chat_id)

    def _delete_chat(self, chat_id: str) -> None:
        if not messagebox.askyesno("Delete chat", "Delete this conversation?"):
            return
        chat_storage.delete_chat(self._state.chats_dir(), chat_id)
        if chat_id == self._state.current_chat_id:
            self._new_chat()
        self._sidebar.refresh(self._state.current_chat_id)

    def _export_chat_id(self, chat_id: str) -> None:
        path = chat_storage.chat_path(self._state.chats_dir(), chat_id)
        if not path.exists():
            return
        data = chat_storage.load_chat(path)
        from tkinter import filedialog

        out = filedialog.asksaveasfilename(
            defaultextension=".md",
            filetypes=[("Markdown", "*.md"), ("Text", "*.txt")],
            initialfile=f"{data.get('title', 'chat')}.md",
        )
        if not out:
            return
        lines = [f"# {data.get('title', 'Chat')}\n", f"Model: {data.get('model', '')}\n\n"]
        for m in data.get("messages") or []:
            role = m.get("role", "")
            content = m.get("content", "")
            lines.append(f"## {role}\n\n{content}\n\n")
        Path(out).write_text("".join(lines), encoding="utf-8")

    # --- Send / stream ---
    def _build_api_messages(self) -> list[dict[str, str]]:
        sp = self._model_selector.get_system_prompt().strip() or DEFAULT_SYSTEM_PROMPT
        msgs: list[dict[str, str]] = [{"role": "system", "content": sp}]
        for m in self._state.messages:
            r = m.get("role")
            c = m.get("content", "")
            if r in ("user", "assistant"):
                msgs.append({"role": r, "content": c})
        return msgs

    def _on_send(self, text: str) -> None:
        if not ollama_service.is_ollama_running():
            messagebox.showwarning("Ollama", "Start Ollama with: ollama serve")
            return
        model = self._model_selector.current_model()
        if not model or model.startswith("("):
            messagebox.showwarning("Model", "Pull a model first, e.g. ollama pull llama3.2")
            return

        now = datetime.now().isoformat(timespec="seconds")
        user_msg = {"role": "user", "content": text, "timestamp": now}
        self._state.messages.append(user_msg)
        self._chat_view.add_user(text, now)

        if self._settings.get("auto_title_chats", True) and len(self._state.messages) == 1:
            self._payload["title"] = chat_storage.title_from_first_message(text)

        self._persist_current_chat()
        self._sidebar.refresh(self._state.current_chat_id)

        self._state.is_generating = True
        self._state.reset_cancel()
        self._input.set_generating(True)

        as_ts = datetime.now().isoformat(timespec="seconds")
        self._chat_view.start_assistant_stream(as_ts)

        def worker() -> None:
            full = []
            try:
                stream = ollama_service.stream_chat(
                    model,
                    self._build_api_messages(),
                    temperature=self._state.temperature,
                    cancel_event=self._state.cancel_event,
                )
                for token in stream:
                    if self._state.cancel_event.is_set():
                        break
                    full.append(token)
                    self.after(0, lambda tt=token: self._chat_view.append_stream(tt))
            except ResponseError as e:
                err = str(e)

                def show_err() -> None:
                    self._chat_view.finalize_stream_replace(
                        f"**Error:** {err}", format_timestamp(as_ts) or ""
                    )
                    self._finish_generation_error(err)

                self.after(0, show_err)
                return
            except Exception as e:
                err = str(e)

                def show_err2() -> None:
                    self._chat_view.finalize_stream_replace(
                        f"**Error:** {err}", format_timestamp(as_ts) or ""
                    )
                    self._finish_generation_error(err)

                self.after(0, show_err2)
                return

            text_out = "".join(full)

            def done() -> None:
                ts_disp = format_timestamp(as_ts) or ""
                self._chat_view.finalize_stream_replace(text_out, ts_disp)
                if text_out.strip():
                    assistant_msg = {
                        "role": "assistant",
                        "content": text_out,
                        "timestamp": as_ts,
                    }
                    self._state.messages.append(assistant_msg)
                    self._state.last_assistant_text = text_out
                    self._persist_current_chat()
                self._state.is_generating = False
                self._input.set_generating(False)
                self._update_token_estimate()

            self.after(0, done)

        threading.Thread(target=worker, daemon=True).start()
        self._update_token_estimate()

    def _finish_generation_error(self, _err: str) -> None:
        self._state.is_generating = False
        self._input.set_generating(False)

    def _on_stop(self) -> None:
        self._state.request_stop()

    def _update_token_estimate(self) -> None:
        n = sum(len(m.get("content", "")) for m in self._state.messages)
        est = max(0, n // 4)
        self._token_label.configure(text=f"Tokens ~{est}")

    # --- Settings ---
    def _open_settings(self) -> None:
        def on_change(new_settings: dict[str, Any]) -> None:
            self._settings.update(new_settings)
            save_settings(self._state.settings_path(), self._settings)
            ctk.set_appearance_mode("dark")
            self._font_size = validate_font_size(self._settings.get("font_size"))
            self._state.font_size = self._font_size
            self._chat_view.set_font_size(self._font_size)
            self._input.set_font_size(self._font_size)
            self._model_selector.set_font_size(self._font_size)
            self._input.set_send_on_enter(bool(self._settings.get("send_on_enter", True)))
            self._sidebar.set_font_size(self._font_size, self._state.current_chat_id)

        def on_history_cleared() -> None:
            self._new_chat()
            self._sidebar.refresh(self._state.current_chat_id)

        SettingsModal(
            self,
            settings=self._settings,
            settings_path=self._state.settings_path(),
            chats_dir=self._state.chats_dir(),
            font_size=self._font_size,
            on_change=on_change,
            refresh_models=lambda: self._model_selector.refresh_models(self._model_selector.current_model()),
            on_history_cleared=on_history_cleared,
        )

    # --- Shortcuts ---
    def _shortcut_new(self, event: tk.Event) -> str | None:
        self._new_chat()
        return "break"

    def _shortcut_settings(self, event: tk.Event) -> str | None:
        self._open_settings()
        return "break"

    def _shortcut_focus_input(self, event: tk.Event) -> str | None:
        self._input.focus_input()
        return "break"

    def _shortcut_delete_chat(self, event: tk.Event) -> str | None:
        if self._state.current_chat_id:
            self._delete_chat(self._state.current_chat_id)
        return "break"

    def _shortcut_stop(self, event: tk.Event) -> str | None:
        if self._state.is_generating:
            self._on_stop()
        return "break"

    def _shortcut_search(self, event: tk.Event) -> str | None:
        self._sidebar.set_search_visible(True)
        return "break"

    def _shortcut_copy_last(self, event: tk.Event) -> str | None:
        w = event.widget
        try:
            if hasattr(w, "selection_get") and w.selection_get():
                return None
        except tk.TclError:
            pass
        if self._state.last_assistant_text:
            self.clipboard_clear()
            self.clipboard_append(self._state.last_assistant_text)
            return "break"
        return None
