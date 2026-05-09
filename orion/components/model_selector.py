"""Model dropdown, system prompt panel, model metadata hint."""

from __future__ import annotations

from collections.abc import Callable

import customtkinter as ctk
import requests

from app.theme import ACCENT, BG, BORDER, INPUT_BG_SOLID, MUTED, TEXT
from app.theme import TEXT_SOLID, patch_ctk_textbox
from app.theme import DEFAULT_SYSTEM_PROMPT, FontSize, label_font
from services.ollama_service import get_installed_models, model_display_meta


class ModelSelector:
    def __init__(
        self,
        parent: ctk.CTkFrame,
        *,
        font_size: FontSize,
        on_model_change: Callable[[str], None],
        on_system_prompt_change: Callable[[str], None],
        on_temperature_change: Callable[[float], None] | None = None,
    ) -> None:
        self._font_size = font_size
        self._on_model_change = on_model_change
        self._on_system_prompt_change = on_system_prompt_change
        self._on_temperature_change = on_temperature_change
        self._models: list[dict] = []
        self._names: list[str] = []
        self._expanded = False
        self._suppress_callback = False

        self._frame = ctk.CTkFrame(parent, fg_color=BG)

        top = ctk.CTkFrame(self._frame, fg_color=BG)
        top.pack(fill="x")

        self._model_lbl = ctk.CTkLabel(
            top, text="Model:", text_color=MUTED, font=label_font(font_size)
        )
        self._model_lbl.pack(side="left", padx=(0, 8))
        self._menu = ctk.CTkOptionMenu(
            top,
            values=["(none)"],
            command=self._on_select,
            fg_color="#252525",
            button_color=ACCENT,
            button_hover_color="#4f46e5",
            font=label_font(font_size),
        )
        self._menu.pack(side="left")

        self._hint = ctk.CTkLabel(top, text="", text_color=MUTED, font=label_font(font_size))
        self._hint.pack(side="left", padx=(12, 0))

        self._chevron = ctk.CTkButton(
            self._frame,
            text="System prompt ▾",
            width=160,
            fg_color=("#252525", "#252525"),
            text_color=ACCENT,
            hover_color="#252525",
            font=label_font(font_size),
            command=self._toggle_prompt,
        )
        self._chevron.pack(anchor="w", pady=(6, 0))

        self._prompt_box = ctk.CTkTextbox(
            self._frame,
            height=72,
            fg_color=INPUT_BG_SOLID,
            text_color=TEXT_SOLID,
            font=label_font(font_size),
            border_width=1,
            border_color=BORDER,
            corner_radius=8,
            wrap="word",
        )
        self._prompt_box.insert("1.0", DEFAULT_SYSTEM_PROMPT)
        patch_ctk_textbox(self._prompt_box, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)
        self._prompt_box.bind("<KeyRelease>", lambda _e: self._emit_prompt())
        self._prompt_box.pack(fill="x", pady=(6, 0))
        self._prompt_box.pack_forget()

        temp_row = ctk.CTkFrame(self._frame, fg_color=BG)
        temp_row.pack(fill="x", pady=(8, 0))
        self._temp_caption = ctk.CTkLabel(
            temp_row, text="Temperature", text_color=MUTED, font=label_font(font_size)
        )
        self._temp_caption.pack(side="left")
        self._temp = ctk.CTkSlider(temp_row, from_=0, to=2, number_of_steps=40, width=160)
        self._temp.set(0.7)
        self._temp.pack(side="left", padx=(12, 8))
        self._temp_label = ctk.CTkLabel(
            temp_row, text="0.70", text_color=TEXT, font=label_font(font_size)
        )
        self._temp_label.pack(side="left")
        self._temp.configure(command=self._on_temp_slide)

    def pack(self, **kwargs: object) -> None:
        self._frame.pack(**kwargs)

    def refresh_models(self, selected: str | None = None) -> list[str]:
        try:
            self._models = get_installed_models()
        except requests.RequestException:
            self._models = []
        self._names = [m.get("name", "") for m in self._models if m.get("name")]
        if not self._names:
            self._menu.configure(values=["(no models)"])
            self._menu.set("(no models)")
            self._hint.configure(text="Run ollama pull …")
            return []
        self._menu.configure(values=self._names)
        pick = selected if selected in self._names else self._names[0]
        self._suppress_callback = True
        try:
            self._menu.set(pick)
        finally:
            self._suppress_callback = False
        self._update_hint(pick)
        return self._names

    def current_model(self) -> str:
        v = self._menu.get()
        return v if v and not v.startswith("(") else ""

    def set_model(self, name: str) -> None:
        if name in self._names:
            self._suppress_callback = True
            try:
                self._menu.set(name)
            finally:
                self._suppress_callback = False
            self._update_hint(name)

    def _update_hint(self, name: str) -> None:
        for m in self._models:
            if m.get("name") == name:
                self._hint.configure(text=model_display_meta(m))
                return
        self._hint.configure(text="")

    def _on_select(self, choice: str) -> None:
        self._update_hint(choice)
        if self._suppress_callback:
            return
        self._on_model_change(choice)

    def get_system_prompt(self) -> str:
        return self._prompt_box.get("1.0", "end-1c").strip() or DEFAULT_SYSTEM_PROMPT

    def set_system_prompt(self, text: str) -> None:
        self._prompt_box.delete("1.0", "end")
        self._prompt_box.insert("1.0", text or DEFAULT_SYSTEM_PROMPT)

    def _toggle_prompt(self) -> None:
        self._expanded = not self._expanded
        if self._expanded:
            self._prompt_box.pack(fill="x", pady=(6, 0))
            self._chevron.configure(text="System prompt ▴")
        else:
            self._prompt_box.pack_forget()
            self._chevron.configure(text="System prompt ▾")

    def _emit_prompt(self) -> None:
        self._on_system_prompt_change(self.get_system_prompt())

    def set_temperature(self, t: float) -> None:
        self._temp.set(max(0.0, min(2.0, t)))
        self._temp_label.configure(text=f"{float(self._temp.get()):.2f}")

    def get_temperature(self) -> float:
        return float(self._temp.get())

    def _on_temp_slide(self, _v: float) -> None:
        val = float(self._temp.get())
        self._temp_label.configure(text=f"{val:.2f}")
        if self._on_temperature_change:
            self._on_temperature_change(val)

    def set_font_size(self, size: FontSize) -> None:
        self._font_size = size
        self._model_lbl.configure(font=label_font(size))
        self._menu.configure(font=label_font(size))
        self._hint.configure(font=label_font(size))
        self._chevron.configure(font=label_font(size))
        self._prompt_box.configure(font=label_font(size))
        patch_ctk_textbox(self._prompt_box, fg=TEXT_SOLID, bg=INPUT_BG_SOLID)
        self._temp_caption.configure(font=label_font(size))
        self._temp_label.configure(font=label_font(size))
