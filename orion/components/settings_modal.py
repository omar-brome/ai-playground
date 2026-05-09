"""Modal settings window with tabs."""

from __future__ import annotations

import threading
from collections.abc import Callable
from pathlib import Path
from tkinter import messagebox

import customtkinter as ctk

from app.theme import BG, BORDER, INPUT_BG_SOLID, MUTED, TEXT
from app.theme import TEXT_SOLID, patch_ctk_entry, patch_ctk_scrollable_canvas, patch_ctk_textbox
from app.theme import DEFAULT_SYSTEM_PROMPT, FontSize, label_font
from services import chat_storage
from services import ollama_service


APP_VERSION = "0.1.0"
GITHUB_URL = "https://github.com"


class SettingsModal(ctk.CTkToplevel):
    def __init__(
        self,
        master: ctk.CTk,
        *,
        settings: dict,
        settings_path: Path,
        chats_dir: Path,
        font_size: FontSize,
        on_change: Callable[[dict], None],
        refresh_models: Callable[[], None],
        on_history_cleared: Callable[[], None] | None = None,
    ) -> None:
        super().__init__(master)
        self._settings = dict(settings)
        self._settings_path = settings_path
        self._chats_dir = chats_dir
        self._on_change = on_change
        self._refresh_models_parent = refresh_models
        self._on_history_cleared = on_history_cleared
        self._font_size = font_size

        self.title("Settings")
        self.geometry("560x420")
        self.configure(fg_color=BG)
        self.transient(master)
        self.grab_set()

        tabs = ctk.CTkTabview(self, fg_color=BG, segmented_button_fg_color="#252525")
        tabs.pack(fill="both", expand=True, padx=16, pady=16)

        g = tabs.add("General")
        m = tabs.add("Models")
        c = tabs.add("Chat")
        a = tabs.add("About")

        # --- General ---
        row = 0
        ctk.CTkLabel(g, text="Theme", text_color=MUTED, font=label_font(font_size)).grid(
            row=row, column=0, sticky="w", pady=6
        )
        self._theme = ctk.CTkSegmentedButton(
            g, values=["Dark", "Light", "System"], command=self._persist
        )
        self._theme.grid(row=row, column=1, sticky="w", pady=6)
        cur = self._settings.get("appearance_mode", "dark")
        theme_labels = {"dark": "Dark", "light": "Light", "system": "System"}
        self._theme.set(theme_labels.get(str(cur).lower(), "Dark"))

        row += 1
        ctk.CTkLabel(g, text="Font size", text_color=MUTED, font=label_font(font_size)).grid(
            row=row, column=0, sticky="w", pady=6
        )
        self._fonts = ctk.CTkSegmentedButton(
            g, values=["Small", "Medium", "Large"], command=self._persist
        )
        self._fonts.grid(row=row, column=1, sticky="w", pady=6)
        fs = self._settings.get("font_size", "medium")
        fs_labels = {"small": "Small", "medium": "Medium", "large": "Large"}
        self._fonts.set(fs_labels.get(str(fs).lower(), "Medium"))

        row += 1
        self._send_enter = ctk.CTkSwitch(
            g,
            text="Send on Enter",
            command=self._persist,
            font=label_font(font_size),
        )
        self._send_enter.grid(row=row, column=0, columnspan=2, sticky="w", pady=6)
        if self._settings.get("send_on_enter", True):
            self._send_enter.select()
        else:
            self._send_enter.deselect()
        g.grid_columnconfigure(1, weight=1)

        # --- Models ---
        self._models_frame = ctk.CTkScrollableFrame(m, fg_color=BG)
        self._models_frame.pack(fill="both", expand=True)
        patch_ctk_scrollable_canvas(self._models_frame, bg=BG)

        pull_row = ctk.CTkFrame(m, fg_color=BG)
        pull_row.pack(fill="x", pady=(0, 8))
        self._pull_entry = ctk.CTkEntry(
            pull_row,
            placeholder_text="model name e.g. llama3.2",
            width=220,
            fg_color=INPUT_BG_SOLID,
            text_color=TEXT_SOLID,
        )
        self._pull_entry.pack(side="left", padx=(0, 8))
        patch_ctk_entry(self._pull_entry)
        ctk.CTkButton(pull_row, text="Pull", command=self._run_pull).pack(side="left")

        self._pull_bar = ctk.CTkProgressBar(m)
        self._pull_bar.pack(fill="x", pady=(0, 8))
        self._pull_bar.set(0)
        self._pull_log = ctk.CTkLabel(m, text="", text_color=MUTED, font=label_font(font_size))
        self._pull_log.pack(anchor="w")

        self._populate_models_list()

        # --- Chat ---
        r = 0
        ctk.CTkLabel(c, text="Default system prompt", text_color=MUTED, font=label_font(font_size)).grid(
            row=r, column=0, sticky="nw", pady=6
        )
        self._def_prompt = ctk.CTkTextbox(
            c,
            height=72,
            fg_color=INPUT_BG_SOLID,
            text_color=TEXT_SOLID,
            border_color=BORDER,
            font=label_font(font_size),
        )
        self._def_prompt.grid(row=r, column=1, sticky="ew", pady=6)
        self._def_prompt.insert("1.0", self._settings.get("default_system_prompt", DEFAULT_SYSTEM_PROMPT))
        patch_ctk_textbox(self._def_prompt, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)

        r += 1
        self._auto_title = ctk.CTkSwitch(c, text="Auto-title chats", command=self._persist, font=label_font(font_size))
        self._auto_title.grid(row=r, column=0, columnspan=2, sticky="w", pady=6)
        if self._settings.get("auto_title_chats", True):
            self._auto_title.select()
        else:
            self._auto_title.deselect()

        r += 1
        self._save_hist = ctk.CTkSwitch(c, text="Save chat history", command=self._persist, font=label_font(font_size))
        self._save_hist.grid(row=r, column=0, columnspan=2, sticky="w", pady=6)
        if self._settings.get("save_chat_history", True):
            self._save_hist.select()
        else:
            self._save_hist.deselect()

        r += 1
        ctk.CTkButton(c, text="Clear all chat history…", fg_color="#7f1d1d", command=self._clear_all).grid(
            row=r, column=0, columnspan=2, sticky="w", pady=12
        )
        c.grid_columnconfigure(1, weight=1)

        # --- About ---
        ctk.CTkLabel(
            a,
            text=f"Orion {APP_VERSION}",
            text_color=TEXT,
            font=ctk.CTkFont(size=18, weight="bold"),
        ).pack(anchor="w", pady=(0, 8))
        ver = ollama_service.get_ollama_version()
        ctk.CTkLabel(a, text=f"Ollama: {ver}", text_color=MUTED, font=label_font(font_size)).pack(anchor="w")
        link = ctk.CTkLabel(
            a,
            text=GITHUB_URL,
            text_color="#818cf8",
            font=label_font(font_size),
            cursor="hand2",
        )
        link.pack(anchor="w", pady=8)
        link.bind("<Button-1>", lambda _e: __import__("webbrowser").open(GITHUB_URL))

        self.protocol("WM_DELETE_WINDOW", self._close)

    def _populate_models_list(self) -> None:
        for w in self._models_frame.winfo_children():
            w.destroy()
        try:
            models = ollama_service.get_installed_models()
        except Exception:
            models = []
        for m in models:
            name = m.get("name", "?")
            meta = ollama_service.model_display_meta(m)
            row = ctk.CTkFrame(self._models_frame, fg_color="#1a1a1a", corner_radius=8)
            row.pack(fill="x", pady=4)
            ctk.CTkLabel(row, text=name, text_color=TEXT, font=label_font(self._font_size)).pack(
                side="left", padx=8, pady=6
            )
            ctk.CTkLabel(row, text=meta, text_color=MUTED, font=label_font(self._font_size)).pack(
                side="left", padx=8
            )
            ctk.CTkButton(
                row,
                text="Delete",
                width=72,
                fg_color="#7f1d1d",
                command=lambda n=name: self._delete_model(n),
            ).pack(side="right", padx=8, pady=4)

    def _delete_model(self, name: str) -> None:
        if not messagebox.askyesno("Delete model", f"Delete Ollama model {name}?"):
            return
        try:
            ollama_service.delete_model_remote(name)
        except Exception as exc:
            messagebox.showerror("Error", str(exc))
            return
        self._populate_models_list()
        self._refresh_models_parent()

    def _run_pull(self) -> None:
        name = self._pull_entry.get().strip()
        if not name:
            return

        def line_cb(line: str) -> None:
            self.after(0, lambda: self._pull_log.configure(text=line[:120]))

        def pct_cb(p: float | None) -> None:
            def upd() -> None:
                if p is None:
                    self._pull_bar.set(0)
                else:
                    self._pull_bar.set(min(1.0, max(0.0, p / 100.0)))

            self.after(0, upd)

        def worker() -> None:
            code = ollama_service.pull_model(name, line_cb, pct_cb)
            self.after(0, lambda: self._pull_done(code))

        threading.Thread(target=worker, daemon=True).start()

    def _pull_done(self, code: int) -> None:
        self._pull_bar.set(1.0 if code == 0 else 0)
        self._pull_log.configure(text="Done." if code == 0 else f"Exit {code}")
        self._populate_models_list()
        self._refresh_models_parent()

    def _clear_all(self) -> None:
        if not messagebox.askyesno("Clear history", "Delete all saved chats?"):
            return
        chat_storage.clear_all_chats(self._chats_dir)
        self._on_change(self._merged_settings())
        if self._on_history_cleared:
            self._on_history_cleared()

    def _merged_settings(self) -> dict:
        theme_map = {"Dark": "dark", "Light": "light", "System": "system"}
        fs_map = {"Small": "small", "Medium": "medium", "Large": "large"}
        self._settings["appearance_mode"] = theme_map.get(self._theme.get(), "dark")
        self._settings["font_size"] = fs_map.get(self._fonts.get(), "medium")
        self._settings["send_on_enter"] = bool(self._send_enter.get())
        self._settings["default_system_prompt"] = self._def_prompt.get("1.0", "end-1c").strip() or DEFAULT_SYSTEM_PROMPT
        self._settings["auto_title_chats"] = bool(self._auto_title.get())
        self._settings["save_chat_history"] = bool(self._save_hist.get())
        self._settings["temperature"] = float(self._settings.get("temperature", 0.7))
        return self._settings

    def _persist(self, _v: object | None = None) -> None:
        data = self._merged_settings()
        self._on_change(data)

    def _close(self) -> None:
        self._persist()
        self.grab_release()
        self.destroy()
