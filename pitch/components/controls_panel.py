"""Left sidebar: detection toggles, model, confidence."""

from __future__ import annotations

from typing import Callable

import customtkinter as ctk

from app.theme import ACCENT, CORNER_RADIUS, MUTED, PANEL, TEXT


class ControlsPanel(ctk.CTkFrame):
    def __init__(
        self,
        master: ctk.CTkFrame,
        *,
        on_toggle: Callable[[str, bool], None],
        on_model: Callable[[str], None],
        on_confidence: Callable[[float], None],
        **kwargs,
    ) -> None:
        super().__init__(master, fg_color=PANEL, corner_radius=CORNER_RADIUS, width=200, **kwargs)
        self._on_toggle = on_toggle

        self._vars: dict[str, ctk.BooleanVar] = {}

        self._section("Detection")
        for key, label in [
            ("players", "Players"),
            ("ball", "Ball"),
            ("referee", "Referee"),
        ]:
            self._vars[key] = ctk.BooleanVar(value=True)
            sw = ctk.CTkSwitch(
                self,
                text=label,
                variable=self._vars[key],
                command=lambda k=key: self._emit(k),
                text_color=TEXT,
                progress_color=ACCENT,
                button_color=MUTED,
                button_hover_color=ACCENT,
            )
            sw.pack(anchor="w", padx=12, pady=4)

        self._section("Overlays")
        overlay_defaults = {
            "trails": True,
            "heatmap": False,
            "offside": False,
            "possession": True,
        }
        for key, label in [
            ("trails", "Trails"),
            ("heatmap", "Heatmap"),
            ("offside", "Offside"),
            ("possession", "Possession"),
        ]:
            self._vars[key] = ctk.BooleanVar(value=overlay_defaults[key])
            sw = ctk.CTkSwitch(
                self,
                text=label,
                variable=self._vars[key],
                command=lambda k=key: self._emit(k),
                text_color=TEXT,
                progress_color=ACCENT,
                button_color=MUTED,
                button_hover_color=ACCENT,
            )
            sw.pack(anchor="w", padx=12, pady=4)

        self._section("Model")
        self._model_var = ctk.StringVar(value="yolov8s.pt")
        menu = ctk.CTkOptionMenu(
            self,
            values=["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"],
            variable=self._model_var,
            command=lambda v: on_model(v),
            fg_color=PANEL,
            button_color=ACCENT,
            button_hover_color=MUTED,
            text_color=TEXT,
        )
        menu.pack(fill="x", padx=12, pady=(4, 8))

        ctk.CTkLabel(self, text="Confidence", text_color=MUTED, font=ctk.CTkFont(size=11)).pack(
            anchor="w", padx=12
        )
        self._conf_var = ctk.DoubleVar(value=0.5)
        self._conf_slider = ctk.CTkSlider(
            self,
            from_=0.1,
            to=0.9,
            number_of_steps=16,
            variable=self._conf_var,
            command=lambda v: on_confidence(float(v)),
            progress_color=ACCENT,
            button_color=ACCENT,
        )
        self._conf_slider.pack(fill="x", padx=12, pady=(0, 12))

    def _section(self, title: str) -> None:
        ctk.CTkLabel(
            self,
            text=f"— {title}",
            text_color=MUTED,
            font=ctk.CTkFont(size=11),
        ).pack(anchor="w", padx=12, pady=(12, 4))

    def _emit(self, key: str) -> None:
        var = self._vars.get(key)
        if var is not None:
            self._on_toggle(key, bool(var.get()))

    def get_model(self) -> str:
        return self._model_var.get()

    def get_confidence(self) -> float:
        return float(self._conf_var.get())

    def set_processor_flags(self, mapping: dict[str, bool]) -> None:
        """Sync UI from processor state if needed."""
        for k, v in mapping.items():
            if k in self._vars:
                self._vars[k].set(v)
