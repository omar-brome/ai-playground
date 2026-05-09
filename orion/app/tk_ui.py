"""
Orion UI using only the standard library ``tkinter`` package.

Apple's system Python links to a deprecated Tcl/Tk where CustomTkinter's root/canvas
often paints a solid white window. This module uses classic Tk widgets, which render
reliably on the same runtime.
"""

from __future__ import annotations

import sys
import threading
import tkinter as tk
import tkinter.font as tkfont
from datetime import datetime
from pathlib import Path
from tkinter import messagebox, ttk
from typing import Any

from ollama import ResponseError

from app.state import AppState
from app.theme import DEFAULT_SYSTEM_PROMPT
from components.message_bubble import format_timestamp
from services import chat_storage
from services import ollama_service
from services.settings_storage import load_settings, save_settings

# —— theme (match app/theme.py intent) ——
BG = "#0f0f0f"
SIDEBAR_BG = "#161616"
CHAT_BG = "#0f0f0f"
TEXT = "#e5e5e5"
MUTED = "#6b7280"
ACCENT = "#6366f1"
USER_ACCENT = "#93c5fd"
BORDER = "#2a2a2a"
# Visible on both dark custom colors and macOS “aqua” fallbacks (white/light gray).
INPUT_RING_IDLE = "#525252"
INPUT_RING_FOCUS = "#818cf8"
FIELD_BG = "#1a1a1a"


def _configure_apple_tk_colors(root: tk.Tk) -> None:
    """Apple's bundled Tcl/Tk often ignores ``configure(bg=…)`` on Text/Entry (white-on-white).

    Setting the Tk option database with high priority fixes invisible text and restores contrast.
    Safe no-op on non-macOS.
    """
    if sys.platform != "darwin":
        return
    prio = 91
    add = root.option_add
    add("*Text.background", FIELD_BG, prio)
    add("*Text.foreground", TEXT, prio)
    add("*Text.insertBackground", TEXT, prio)
    add("*Text.selectBackground", "#3f3f62", prio)
    add("*Text.selectForeground", TEXT, prio)
    add("*Entry.background", FIELD_BG, prio)
    add("*Entry.foreground", TEXT, prio)
    add("*Entry.insertBackground", TEXT, prio)
    add("*Listbox.background", "#1a1a1a", prio)
    add("*Listbox.foreground", TEXT, prio)
    add("*Listbox.selectBackground", "#2d2d44", prio)
    add("*Listbox.selectForeground", TEXT, prio)
    add("*Menu.background", "#252525", prio)
    add("*Menu.foreground", TEXT, prio)
    add("*Menubutton.background", "#252525", prio)
    add("*Menubutton.foreground", TEXT, prio)
    add("*Frame.background", BG, prio)


def _setup_global_ttk_styles(root: tk.Tk) -> None:
    """``ttk`` + ``clam`` draws button labels reliably; plain ``tk.Button`` can render blank on some macOS Tk builds."""
    style = ttk.Style(root)
    try:
        if "clam" in style.theme_names():
            style.theme_use("clam")
    except tk.TclError:
        pass
    try:
        style.configure(
            "Horizontal.TScale",
            background=CHAT_BG,
            troughcolor="#333333",
            sliderrelief="flat",
        )
        style.configure(
            "OrionAccent.TButton",
            background="#4f46e5",
            foreground="#ffffff",
            padding=(14, 8),
            font=("Helvetica", 12, "bold"),
        )
        style.map(
            "OrionAccent.TButton",
            background=[("pressed", "#4338ca"), ("active", "#6366f1"), ("disabled", "#525252")],
            foreground=[("disabled", "#d4d4d8")],
        )
        style.configure(
            "OrionMuted.TButton",
            background="#252525",
            foreground="#e5e5e5",
            padding=(12, 8),
            font=("Helvetica", 11),
        )
        style.map(
            "OrionMuted.TButton",
            background=[("pressed", "#1f1f1f"), ("active", "#3f3f46")],
            foreground=[("disabled", "#71717a")],
        )
        style.configure(
            "OrionDanger.TButton",
            background="#991b1b",
            foreground="#ffffff",
            padding=(12, 8),
            font=("Helvetica", 11, "bold"),
        )
        style.map(
            "OrionDanger.TButton",
            background=[("pressed", "#7f1d1d"), ("active", "#b91c1c")],
        )
    except tk.TclError:
        pass


def _created_sort_key(c: dict[str, Any]) -> datetime:
    raw = c.get("created_at") or ""
    try:
        return datetime.fromisoformat(raw)
    except (ValueError, TypeError):
        return datetime.min


class OrionTkApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Orion")
        self._state = AppState()
        self._settings: dict[str, Any] = load_settings(self._state.settings_path())
        self._payload: dict[str, Any] = {}
        self._chat_ids_ordered: list[str] = []
        self._model_names: list[str] = []
        self._generating = False

        self.geometry(self._settings.get("window_geometry", "1200x800+100+100"))
        self.minsize(900, 600)
        self.configure(bg=BG)
        _configure_apple_tk_colors(self)
        _setup_global_ttk_styles(self)

        icon_path = Path(__file__).resolve().parent.parent / "assets" / "icon.png"
        if icon_path.is_file():
            try:
                img = tk.PhotoImage(file=str(icon_path))
                self.iconphoto(True, img)
                self._icon = img
            except tk.TclError:
                pass

        self._build_ui()
        self.bind("<Configure>", self._on_configure_window)

        self.after(500, self._tick_ollama_banner)
        self.after(100, self._startup_models)
        self.after(200, self._bootstrap_session)
        self.after(250, self._focus_message_input)

    def _focus_message_input(self) -> None:
        try:
            self._input.focus_force()
            self._input.mark_set(tk.INSERT, "1.0")
        except (tk.TclError, AttributeError):
            pass

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        self.rowconfigure(2, weight=1)

        self._banner = tk.Label(
            self,
            text="⚠️ Ollama is not running. Start: ollama serve",
            fg="#fbbf24",
            bg="#292524",
            font=("SF Pro Text", 13) if self._tk_font_ok("SF Pro Text") else ("Helvetica", 13),
            padx=12,
            pady=6,
        )
        self._banner.grid(row=0, column=0, sticky="ew", padx=12, pady=(8, 4))
        self._update_banner()

        header = tk.Frame(self, bg=BG)
        header.grid(row=1, column=0, sticky="ew", padx=12, pady=(0, 4))
        header.columnconfigure(3, weight=1)

        tk.Label(header, text="Orion", fg=TEXT, bg=BG, font=("Helvetica Neue", 18, "bold")).grid(
            row=0, column=0, sticky="w", padx=(0, 16)
        )
        tk.Label(header, text="Model:", fg=MUTED, bg=BG).grid(row=0, column=1, sticky="e")
        self._model_var = tk.StringVar(value="(loading models…)")
        self._model_menu = tk.OptionMenu(header, self._model_var, "(loading models…)")
        self._model_menu.configure(bg="#252525", fg=TEXT, highlightthickness=0, activeforeground=TEXT)
        self._model_menu["menu"].configure(bg="#252525", fg=TEXT)
        self._model_menu.grid(row=0, column=2, sticky="w", padx=(8, 24))

        tk.Label(header, text="System prompt:", fg=MUTED, bg=BG).grid(row=1, column=0, sticky="nw", pady=(8, 0))
        self._sys_entry = tk.Entry(
            header,
            width=80,
            bg=FIELD_BG,
            fg=TEXT,
            insertbackground=TEXT,
            relief="solid",
            borderwidth=1,
            highlightthickness=2,
            highlightbackground=INPUT_RING_IDLE,
            highlightcolor=INPUT_RING_FOCUS,
        )
        self._sys_entry.grid(row=1, column=1, columnspan=3, sticky="ew", pady=(8, 0))
        self._sys_entry.insert(0, self._settings.get("default_system_prompt", DEFAULT_SYSTEM_PROMPT))

        tk.Label(header, text="Temp", fg=MUTED, bg=BG).grid(row=0, column=4, padx=(16, 4))
        self._temp_var = tk.DoubleVar(value=float(self._settings.get("temperature", 0.7)))
        ttk.Scale(header, from_=0, to=2, variable=self._temp_var, length=120).grid(row=0, column=5, sticky="w")
        self._temp_lbl = tk.Label(header, text="0.70", fg=TEXT, bg=BG, width=5)
        self._temp_lbl.grid(row=0, column=6, sticky="w")
        self._temp_var.trace_add("write", lambda *_: self._temp_lbl.configure(text=f"{self._temp_var.get():.2f}"))

        body = tk.Frame(self, bg=BG)
        body.grid(row=2, column=0, sticky="nsew", padx=8, pady=(0, 8))
        body.columnconfigure(1, weight=1)
        body.rowconfigure(0, weight=1)

        # Sidebar
        side = tk.Frame(body, bg=SIDEBAR_BG, width=220)
        side.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        side.grid_propagate(False)

        ttk.Button(
            side,
            text="+ New chat",
            style="OrionAccent.TButton",
            command=self._new_chat,
        ).pack(fill="x", padx=10, pady=(12, 8))

        sb_list = tk.Scrollbar(side)
        sb_list.pack(side="right", fill="y", pady=(0, 8), padx=(0, 6))
        self._chat_list = tk.Listbox(
            side,
            bg="#1a1a1a",
            fg=TEXT,
            selectbackground="#2d2d44",
            selectforeground=TEXT,
            highlightthickness=1,
            highlightbackground=INPUT_RING_IDLE,
            highlightcolor=INPUT_RING_FOCUS,
            yscrollcommand=sb_list.set,
            exportselection=False,
        )
        self._chat_list.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        sb_list.config(command=self._chat_list.yview)
        self._chat_list.bind("<<ListboxSelect>>", self._on_list_select)

        ttk.Button(
            side,
            text="Delete chat",
            style="OrionDanger.TButton",
            command=self._delete_selected_chat,
        ).pack(fill="x", padx=8, pady=(0, 8))

        ttk.Button(
            side,
            text="⚙ Settings info",
            style="OrionMuted.TButton",
            command=self._show_settings_info,
        ).pack(fill="x", padx=8, pady=(0, 12))

        # Chat column
        main = tk.Frame(body, bg=CHAT_BG)
        main.grid(row=0, column=1, sticky="nsew")
        main.rowconfigure(0, weight=1)
        main.columnconfigure(0, weight=1)

        wrap = tk.Frame(main, bg=INPUT_RING_IDLE)
        wrap.grid(row=0, column=0, sticky="nsew")
        wrap.rowconfigure(0, weight=1)
        wrap.columnconfigure(0, weight=1)

        chat_inner = tk.Frame(wrap, bg=CHAT_BG)
        chat_inner.grid(row=0, column=0, sticky="nsew", padx=1, pady=1)
        chat_inner.rowconfigure(0, weight=1)
        chat_inner.columnconfigure(0, weight=1)

        sb_chat = tk.Scrollbar(chat_inner)
        sb_chat.grid(row=0, column=1, sticky="ns")
        self._chat_text = tk.Text(
            chat_inner,
            bg=CHAT_BG,
            fg=TEXT,
            insertbackground=TEXT,
            wrap="word",
            state="disabled",
            font=("Helvetica Neue", 14) if self._tk_font_ok("Helvetica Neue") else ("Helvetica", 14),
            padx=12,
            pady=12,
            highlightthickness=0,
            borderwidth=0,
            relief="flat",
            yscrollcommand=sb_chat.set,
        )
        self._chat_text.grid(row=0, column=0, sticky="nsew")
        sb_chat.config(command=self._chat_text.yview)

        self._chat_text.tag_configure("user_label", foreground=USER_ACCENT, font=("Helvetica Neue", 12, "bold"))
        self._chat_text.tag_configure("bot_label", foreground=ACCENT, font=("Helvetica Neue", 12, "bold"))
        self._chat_text.tag_configure("body", foreground=TEXT)
        self._chat_text.tag_configure("muted", foreground=MUTED)
        self._chat_text.tag_configure("err", foreground="#f87171")

        meta = tk.Frame(main, bg=CHAT_BG)
        meta.grid(row=1, column=0, sticky="e", pady=(4, 0))
        self._token_lbl = tk.Label(meta, text="Tokens ~0", fg=MUTED, bg=CHAT_BG, font=("Helvetica", 11))
        self._token_lbl.pack(side="right")

        inp_fr = tk.Frame(main, bg=CHAT_BG)
        inp_fr.grid(row=2, column=0, sticky="ew", pady=(12, 0))
        inp_fr.columnconfigure(0, weight=1)

        tk.Label(inp_fr, text="Message", fg=MUTED, bg=CHAT_BG, font=("Helvetica", 11)).grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 6)
        )

        self._input_ring = tk.Frame(inp_fr, bg=INPUT_RING_IDLE)
        self._input_ring.grid(row=1, column=0, sticky="ew", padx=(0, 8))
        self._input = tk.Text(
            self._input_ring,
            height=4,
            bg=FIELD_BG,
            fg=TEXT,
            insertbackground=TEXT,
            wrap="word",
            font=("Helvetica Neue", 13) if self._tk_font_ok("Helvetica Neue") else ("Helvetica", 13),
            relief="flat",
            borderwidth=0,
            highlightthickness=0,
            padx=10,
            pady=10,
        )
        self._input.pack(fill="both", expand=True, padx=2, pady=2)
        self._input.configure(takefocus=True)
        self._input.bind("<FocusIn>", lambda _e: self._input_ring.configure(bg=INPUT_RING_FOCUS))
        self._input.bind("<FocusOut>", lambda _e: self._input_ring.configure(bg=INPUT_RING_IDLE))
        self._input.bind("<Return>", self._on_return_key)
        self._count_lbl = tk.Label(inp_fr, text="0 / 4096", fg=MUTED, bg=CHAT_BG)
        self._count_lbl.grid(row=2, column=0, sticky="e", pady=(6, 0))
        self._input.bind("<KeyRelease>", lambda _e: self._update_char_count())

        btn_fr = tk.Frame(inp_fr, bg=CHAT_BG)
        btn_fr.grid(row=1, column=1, rowspan=2, sticky="ne")

        self._stop_btn = ttk.Button(
            btn_fr,
            text="Stop",
            style="OrionDanger.TButton",
            command=self._stop_gen,
        )
        self._stop_btn.pack(pady=(0, 6))
        self._stop_btn.pack_forget()

        ttk.Button(
            btn_fr,
            text="Send →",
            style="OrionAccent.TButton",
            command=self._send_clicked,
        ).pack()

    @staticmethod
    def _tk_font_ok(name: str) -> bool:
        try:
            f = tkfont.Font(family=name, size=12)
            return bool(f.actual("family"))
        except Exception:
            return False

    def _update_char_count(self) -> None:
        n = len(self._input.get("1.0", "end-1c"))
        col = MUTED if n < 3500 else ("#f59e0b" if n < 4096 else "#ef4444")
        self._count_lbl.configure(text=f"{n} / 4096", fg=col)

    def _on_return_key(self, event: tk.Event) -> str | None:
        if event.state & 0x0001:
            return None
        self._send_clicked()
        return "break"

    def _on_configure_window(self, event: tk.Event) -> None:
        if event.widget is self:
            self._settings["window_geometry"] = self.geometry()
            save_settings(self._state.settings_path(), self._settings)

    def _tick_ollama_banner(self) -> None:
        self._update_banner()
        self.after(8000, self._tick_ollama_banner)

    def _update_banner(self) -> None:
        if ollama_service.is_ollama_running():
            self._banner.grid_remove()
        else:
            self._banner.grid()

    def _bootstrap_session(self) -> None:
        chats = chat_storage.list_chats(self._state.chats_dir())
        chats.sort(key=_created_sort_key, reverse=True)
        if chats:
            cid = chats[0]["id"]
            self._load_chat(cid)
            self._refresh_chat_list(select_id=cid)
        else:
            self._new_chat()

    def _startup_models(self) -> None:
        def work() -> None:
            names: list[str] = []
            if ollama_service.is_ollama_running():
                try:
                    models = ollama_service.get_installed_models()
                    names = [m.get("name", "") for m in models if m.get("name")]
                except Exception:
                    pass

            def ui() -> None:
                self._model_names = names
                menu = self._model_menu["menu"]
                menu.delete(0, "end")
                if not names:
                    self._model_var.set("(no models — ollama pull …)")
                    menu.add_command(
                        label="(no models — ollama pull …)",
                        command=lambda: None,
                    )
                else:
                    for n in names:

                        def pick_model(v: str = n) -> None:
                            self._model_var.set(v)
                            self._state.selected_model = v

                        menu.add_command(label=n, command=pick_model)
                    pick = names[0]
                    self._model_var.set(pick)
                    self._state.selected_model = pick

            self.after(0, ui)

        threading.Thread(target=work, daemon=True).start()

    def _current_model(self) -> str:
        v = self._model_var.get()
        return v if v and not v.startswith("(") else ""

    def _get_system_prompt(self) -> str:
        t = self._sys_entry.get().strip()
        return t or DEFAULT_SYSTEM_PROMPT

    def _build_api_messages(self) -> list[dict[str, str]]:
        sp = self._get_system_prompt()
        msgs: list[dict[str, str]] = [{"role": "system", "content": sp}]
        for m in self._state.messages:
            r = m.get("role")
            c = m.get("content", "")
            if r in ("user", "assistant"):
                msgs.append({"role": r, "content": c})
        return msgs

    def _append_transcript_line(self, text: str, tags: tuple[str, ...] = ("body",)) -> None:
        self._chat_text.configure(state="normal")
        self._chat_text.insert("end", text, tags)
        self._chat_text.configure(state="disabled")
        self._chat_text.see("end")

    def _render_messages(self) -> None:
        self._chat_text.configure(state="normal")
        self._chat_text.delete("1.0", "end")
        self._chat_text.configure(state="disabled")
        for m in self._state.messages:
            role = m.get("role")
            content = m.get("content", "")
            ts = format_timestamp(m.get("timestamp", "")) or ""
            if role == "user":
                self._append_transcript_line(f"You · {ts}\n", ("user_label",))
                self._append_transcript_line(content + "\n\n", ("body",))
            elif role == "assistant":
                self._append_transcript_line(f"Orion · {ts}\n", ("bot_label",))
                self._append_transcript_line(content + "\n\n", ("body",))

    def _new_chat(self) -> None:
        if self._generating:
            return
        cid = chat_storage.new_chat_id()
        now = chat_storage.iso_now()
        self._state.current_chat_id = cid
        self._state.messages = []
        self._state.temperature = float(self._temp_var.get())
        self._payload = {
            "id": cid,
            "title": "New chat",
            "created_at": now,
            "model": self._current_model(),
            "system_prompt": self._get_system_prompt(),
            "messages": [],
        }
        self._persist()
        self._chat_text.configure(state="normal")
        self._chat_text.delete("1.0", "end")
        self._chat_text.configure(state="disabled")
        self._refresh_chat_list(select_id=cid)
        self._update_tokens()

    def _refresh_chat_list(self, select_id: str | None = None) -> None:
        chats = chat_storage.list_chats(self._state.chats_dir())
        chats.sort(key=_created_sort_key, reverse=True)
        self._chat_list.delete(0, tk.END)
        self._chat_ids_ordered = []
        for c in chats:
            self._chat_ids_ordered.append(c["id"])
            self._chat_list.insert(tk.END, chat_storage.preview_title(c))
        if select_id:
            try:
                idx = self._chat_ids_ordered.index(select_id)
                self._chat_list.selection_clear(0, tk.END)
                self._chat_list.selection_set(idx)
                self._chat_list.see(idx)
            except ValueError:
                pass

    def _on_list_select(self, _event: tk.Event | None = None) -> None:
        sel = self._chat_list.curselection()
        if not sel:
            return
        idx = sel[0]
        if idx >= len(self._chat_ids_ordered):
            return
        cid = self._chat_ids_ordered[idx]
        if cid == self._state.current_chat_id:
            return
        self._load_chat(cid)

    def _delete_selected_chat(self) -> None:
        if self._generating:
            messagebox.showwarning("Delete", "Wait for the reply to finish, or press Stop.")
            return
        sel = self._chat_list.curselection()
        if not sel:
            messagebox.showinfo("Delete", "Select a chat in the list first.")
            return
        idx = sel[0]
        if idx >= len(self._chat_ids_ordered):
            return
        cid = self._chat_ids_ordered[idx]
        if not messagebox.askyesno("Delete chat", "Delete this conversation permanently?"):
            return
        was_current = cid == self._state.current_chat_id
        chat_storage.delete_chat(self._state.chats_dir(), cid)
        if was_current:
            remaining = chat_storage.list_chats(self._state.chats_dir())
            remaining.sort(key=_created_sort_key, reverse=True)
            if remaining:
                self._load_chat(remaining[0]["id"])
            else:
                self._new_chat()
        else:
            self._refresh_chat_list(select_id=self._state.current_chat_id)

    def _load_chat(self, chat_id: str) -> None:
        path = chat_storage.chat_path(self._state.chats_dir(), chat_id)
        if not path.exists():
            return
        data = chat_storage.load_chat(path)
        self._state.current_chat_id = data["id"]
        self._state.messages = list(data.get("messages") or [])
        self._sys_entry.delete(0, tk.END)
        self._sys_entry.insert(0, data.get("system_prompt") or DEFAULT_SYSTEM_PROMPT)
        if data.get("model"):
            self._model_var.set(data["model"])
            self._state.selected_model = data["model"]
        self._payload = {
            "id": data["id"],
            "title": data.get("title", "Chat"),
            "created_at": data.get("created_at", chat_storage.iso_now()),
            "model": data.get("model", ""),
            "system_prompt": data.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
            "messages": self._state.messages,
        }
        self._render_messages()
        self._update_tokens()

    def _current_payload(self) -> dict[str, Any]:
        bt = "New chat"
        bc = chat_storage.iso_now()
        if hasattr(self, "_payload"):
            bt = self._payload.get("title", bt)
            bc = self._payload.get("created_at", bc)
        return {
            "id": self._state.current_chat_id or "",
            "title": bt,
            "created_at": bc,
            "model": self._current_model(),
            "system_prompt": self._get_system_prompt(),
            "messages": self._state.messages,
        }

    def _persist(self) -> None:
        if not self._settings.get("save_chat_history", True):
            return
        if not self._state.current_chat_id:
            return
        chat_storage.save_chat(self._state.chats_dir(), self._current_payload())

    def _update_tokens(self) -> None:
        n = sum(len(str(m.get("content", ""))) for m in self._state.messages)
        self._token_lbl.configure(text=f"Tokens ~{max(0, n // 4)}")

    def _set_generating(self, on: bool) -> None:
        self._generating = on
        if on:
            self._input.configure(state="disabled")
            self._stop_btn.pack(pady=(0, 6))
        else:
            self._input.configure(state="normal")
            self._stop_btn.pack_forget()

    def _stop_gen(self) -> None:
        self._state.request_stop()

    def _send_clicked(self) -> None:
        text = self._input.get("1.0", "end-1c").strip()
        if not text or len(text) > 4096:
            return
        if not ollama_service.is_ollama_running():
            messagebox.showwarning("Ollama", "Start Ollama with: ollama serve")
            return
        model = self._current_model()
        if not model:
            messagebox.showwarning("Model", "No model — wait for the list to load or run: ollama pull llama3.2")
            return

        self._input.delete("1.0", "end")
        self._update_char_count()

        now = datetime.now().isoformat(timespec="seconds")
        self._state.messages.append({"role": "user", "content": text, "timestamp": now})
        self._state.temperature = float(self._temp_var.get())
        ts = format_timestamp(now) or ""
        self._append_transcript_line(f"You · {ts}\n", ("user_label",))
        self._append_transcript_line(text + "\n\n", ("body",))

        if self._settings.get("auto_title_chats", True) and len(self._state.messages) == 1:
            self._payload["title"] = chat_storage.title_from_first_message(text)
        self._persist()
        self._refresh_chat_list(select_id=self._state.current_chat_id)

        self._state.reset_cancel()
        self._set_generating(True)
        as_ts = datetime.now().isoformat(timespec="seconds")
        as_disp = format_timestamp(as_ts) or ""

        self._append_transcript_line(f"Orion · {as_disp}\n", ("bot_label",))

        def worker() -> None:
            buf: list[str] = []
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
                    buf.append(token)

                    def append(t: str = token) -> None:
                        self._chat_text.configure(state="normal")
                        self._chat_text.insert("end", t, ("body",))
                        self._chat_text.configure(state="disabled")
                        self._chat_text.see("end")

                    self.after(0, append)
            except ResponseError as e:
                err_txt = str(e)

                def err() -> None:
                    self._append_transcript_line(f"Error: {err_txt}\n", ("err",))
                    self._set_generating(False)

                self.after(0, err)
                return
            except Exception as e:
                err_txt = str(e)

                def err2() -> None:
                    self._append_transcript_line(f"Error: {err_txt}\n", ("err",))
                    self._set_generating(False)

                self.after(0, err2)
                return

            out = "".join(buf)

            def done() -> None:
                self._append_transcript_line("\n", ("body",))
                if out.strip():
                    self._state.messages.append(
                        {"role": "assistant", "content": out, "timestamp": as_ts}
                    )
                    self._state.last_assistant_text = out
                    self._persist()
                self._set_generating(False)
                self._update_tokens()

            self.after(0, done)

        threading.Thread(target=worker, daemon=True).start()
        self._update_tokens()

    def _show_settings_info(self) -> None:
        messagebox.showinfo(
            "Orion (classic Tk UI)",
            "This build uses standard tkinter (recommended on macOS with Apple Tcl/Tk).\n\n"
            "Full settings UI is available when running with CustomTkinter on other platforms "
            "or after installing Python from python.org (3.11+) which bundles a newer Tk.\n\n"
            f"Settings file: {self._state.settings_path()}",
        )
