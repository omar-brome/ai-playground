"""Center panel: scaled video frame (RGB ndarray → PIL → CTkLabel)."""

from __future__ import annotations

import tkinter as tk

import customtkinter as ctk
import numpy as np
from PIL import Image, ImageTk

from app.theme import PANEL


class VideoCanvas(ctk.CTkFrame):
    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color=PANEL, corner_radius=10, **kwargs)
        self._label = tk.Label(self, bg=PANEL, bd=0, highlightthickness=0)
        self._label.pack(fill="both", expand=True, padx=4, pady=4)
        self._photo: ImageTk.PhotoImage | None = None
        self._last_size = (1, 1)
        self.bind("<Configure>", self._on_configure)

    def _on_configure(self, _event: tk.Event) -> None:
        self._last_size = (max(1, self.winfo_width()), max(1, self.winfo_height()))

    def set_frame_rgb(self, rgb: np.ndarray) -> None:
        if rgb.size == 0:
            return
        h, w = rgb.shape[:2]
        tw, th = self._last_size
        if tw < 10 or th < 10:
            tw, th = max(tw, 640), max(th, 360)

        scale = min(tw / w, th / h, 1.0)
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        img = Image.fromarray(rgb.astype(np.uint8))
        if scale < 1.0:
            img = img.resize((nw, nh), Image.Resampling.LANCZOS)

        self._photo = ImageTk.PhotoImage(img)
        self._label.configure(image=self._photo)

    def clear(self) -> None:
        self._label.configure(image="")
        self._photo = None
