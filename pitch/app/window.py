"""Main Pitch window: tk.Tk root + CustomTkinter shell (macOS-safe)."""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox
from typing import Any

import customtkinter as ctk
import numpy as np

from app.theme import ACCENT, BG, CORNER_RADIUS, PANEL, TEXT, apply_global_theme
from components.controls_panel import ControlsPanel
from components.playback_bar import PlaybackBar
from components.stats_panel import StatsPanel
from components.video_canvas import VideoCanvas
from services.device import device_startup_message, device_status_label, get_device
from services.exporter import export_report
from services.video_processor import VideoProcessor


class PitchWindow(tk.Tk):
    def __init__(self, *, model_path: str = "yolov8s.pt", source: str | None = None) -> None:
        super().__init__()
        apply_global_theme()

        self.title("Pitch")
        self.geometry("1280x780")
        self.minsize(1024, 640)
        self.configure(bg=BG)

        dev = get_device()
        print(device_startup_message(dev))
        self._device_label_text = device_status_label(dev)

        icon_path = Path(__file__).resolve().parent.parent / "assets" / "icon.png"
        if icon_path.is_file():
            try:
                img = tk.PhotoImage(file=str(icon_path))
                self.iconphoto(True, img)
                self._icon = img
            except tk.TclError:
                pass

        self._shell = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        self._shell.pack(fill="both", expand=True)

        header = ctk.CTkFrame(self._shell, fg_color=BG)
        header.pack(fill="x", padx=16, pady=(12, 8))
        ctk.CTkLabel(
            header,
            text="⚽ Pitch",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=TEXT,
        ).pack(side="left")

        self._btn_open = ctk.CTkButton(
            header,
            text="Open Video",
            command=self._open_video,
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=ACCENT,
        )
        self._btn_open.pack(side="right", padx=4)
        self._btn_cam = ctk.CTkButton(
            header,
            text="Webcam",
            command=self._open_webcam,
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=ACCENT,
        )
        self._btn_cam.pack(side="right", padx=4)
        self._btn_export = ctk.CTkButton(
            header,
            text="Export",
            command=self._export_report,
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=ACCENT,
        )
        self._btn_export.pack(side="right", padx=4)

        body = ctk.CTkFrame(self._shell, fg_color=BG)
        body.pack(fill="both", expand=True, padx=12, pady=(0, 8))
        body.grid_columnconfigure(1, weight=1)
        body.grid_rowconfigure(0, weight=1)

        self._controls = ControlsPanel(
            body,
            on_toggle=self._on_toggle,
            on_model=self._on_model_change,
            on_confidence=self._on_confidence,
        )
        self._controls.grid(row=0, column=0, sticky="ns", padx=(0, 8))

        self._startup_model = model_path
        base = Path(model_path).name
        if base in ("yolov8n.pt", "yolov8s.pt", "yolov8m.pt"):
            self._controls._model_var.set(base)

        center = ctk.CTkFrame(body, fg_color=BG)
        center.grid(row=0, column=1, sticky="nsew")
        center.grid_rowconfigure(0, weight=1)
        center.grid_columnconfigure(0, weight=1)

        self._video_canvas = VideoCanvas(center)
        self._video_canvas.grid(row=0, column=0, sticky="nsew")

        self._playback = PlaybackBar(
            center,
            on_play_pause=self._toggle_playback,
            on_seek=self._on_seek,
            on_speed=self._on_speed,
        )
        self._playback.grid(row=1, column=0, sticky="ew", pady=(8, 0))

        self._stats = StatsPanel(body)
        self._stats.grid(row=0, column=2, sticky="ns", padx=(8, 0))

        footer = ctk.CTkFrame(self._shell, fg_color=BG)
        footer.pack(fill="x", padx=16, pady=(0, 10))
        self._status = ctk.CTkLabel(
            footer,
            text=f"{self._device_label_text}  ·  No source",
            text_color="#6b7280",
            font=ctk.CTkFont(size=11),
        )
        self._status.pack(side="left")

        self._btn_report = ctk.CTkButton(
            footer,
            text="Save Report",
            command=self._export_report,
            fg_color=PANEL,
            hover_color=ACCENT,
            text_color=TEXT,
            width=120,
            corner_radius=CORNER_RADIUS,
            border_width=1,
            border_color=ACCENT,
        )
        self._btn_report.pack(side="right")

        self._processor: VideoProcessor | None = None
        self._last_stats: dict[str, Any] = {}

        # Do NOT load YOLO here: it blocks the main thread (and first run downloads
        # weights), so no window appears until loading finishes. Model loads on first
        # Open Video / Webcam or after the UI is shown when using --source.
        try:
            self.update_idletasks()
            self.lift()
            self.attributes("-topmost", True)
            self.attributes("-topmost", False)
        except tk.TclError:
            pass

        if source:
            self.after_idle(lambda: self._load_path(source))

    def _ensure_processor(self) -> None:
        if self._processor is not None:
            self._processor.stop()

        def frame_cb(rgb: np.ndarray, stats: dict[str, Any], fps_val: float) -> None:
            self.after(0, lambda: self._apply_frame(rgb, stats, fps_val))

        def stats_cb(stats: dict[str, Any]) -> None:
            self._last_stats = stats

        model = self._controls.get_model() if hasattr(self, "_controls") else self._startup_model
        self._processor = VideoProcessor(
            frame_callback=frame_cb,
            stats_callback=stats_cb,
            model_path=model,
        )
        if hasattr(self, "_controls"):
            self._pull_controls_into_processor()

    def _pull_controls_into_processor(self) -> None:
        p = self._processor
        if p is None:
            return
        for key in ("players", "ball", "referee", "trails", "heatmap", "offside", "possession"):
            if key in self._controls._vars:
                self._on_toggle(key, bool(self._controls._vars[key].get()))
        p.set_confidence(self._controls.get_confidence())

    def _apply_frame(self, rgb: np.ndarray, stats: dict[str, Any], fps_val: float) -> None:
        self._last_stats = stats
        self._video_canvas.set_frame_rgb(rgb)
        self._stats.update_stats(
            stats,
            player_count=int(stats.get("player_count", 0)),
            ball_seen=bool(stats.get("ball_seen")),
            team_a_count=int(stats.get("team_a_count", 0)),
            team_b_count=int(stats.get("team_b_count", 0)),
        )
        proc = self._processor
        if proc:
            self._playback.set_timeline(
                current_frame=max(0, proc.current_frame_index),
                total_frames=max(1, proc.total_frames),
                fps=proc.source_fps,
            )
        self._status.configure(
            text=f"{self._device_label_text}  ·  {proc.source_path if proc else '—'}  ·  {fps_val:.1f} FPS"
        )

    def _on_toggle(self, key: str, value: bool) -> None:
        p = self._processor
        if p is None:
            return
        mapping = {
            "players": "show_players",
            "ball": "show_ball",
            "referee": "show_referee",
            "trails": "show_trails",
            "heatmap": "show_heatmap",
            "offside": "show_offside",
            "possession": "show_possession",
        }
        attr = mapping.get(key)
        if attr:
            setattr(p, attr, value)

    def _on_model_change(self, model_name: str) -> None:
        if self._processor:
            try:
                self._processor.set_model(model_name)
            except Exception as e:
                messagebox.showerror("Model error", str(e))

    def _on_confidence(self, value: float) -> None:
        if self._processor:
            self._processor.set_confidence(value)

    def _open_video(self) -> None:
        path = filedialog.askopenfilename(
            title="Open match video",
            filetypes=[("Video", "*.mp4 *.mov *.mkv *.avi"), ("All", "*.*")],
        )
        if path:
            self._load_path(path)

    def _load_path(self, path: str) -> None:
        self._stop_playback()
        self._status.configure(
            text=f"{self._device_label_text}  ·  Loading model…",
        )
        self.update_idletasks()
        self._ensure_processor()
        assert self._processor is not None
        ok = self._processor.load_video(path)
        if not ok:
            messagebox.showerror("Pitch", "Could not open video file.")
            return
        self._status.configure(
            text=f"{self._device_label_text}  ·  {path}",
        )
        self._playback.set_playing(True)
        self._processor.start()

    def _open_webcam(self) -> None:
        self._stop_playback()
        self._status.configure(
            text=f"{self._device_label_text}  ·  Loading model…",
        )
        self.update_idletasks()
        self._ensure_processor()
        assert self._processor is not None
        ok = self._processor.load_webcam(0)
        if not ok:
            messagebox.showerror("Pitch", "Could not open webcam.")
            return
        self._status.configure(text=f"{self._device_label_text}  ·  webcam:0")
        self._playback.set_playing(True)
        self._processor.start()

    def _stop_playback(self) -> None:
        if self._processor:
            self._processor.stop()
        self._playback.set_playing(False)

    def _toggle_playback(self) -> None:
        if self._processor is None or self._processor.cap is None:
            messagebox.showinfo("Pitch", "Open a video or webcam first.")
            return
        self._processor.toggle_pause()
        self._playback.set_playing(not self._processor.paused)

    def _on_seek(self, position: float) -> None:
        p = self._processor
        if p is None or p.total_frames <= 0:
            return
        frame = int(round(float(position) * max(p.total_frames - 1, 0)))
        p.seek_to_frame(frame)

    def _on_speed(self, speed: float) -> None:
        if self._processor:
            self._processor.speed = speed

    def _export_report(self) -> None:
        path = filedialog.asksaveasfilename(
            title="Save report",
            defaultextension=".json",
            filetypes=[("JSON", "*.json")],
        )
        if not path:
            return
        try:
            export_report(self._last_stats, path)
            messagebox.showinfo("Pitch", f"Report saved to {path}")
        except OSError as e:
            messagebox.showerror("Pitch", str(e))

    def destroy(self) -> None:
        if self._processor:
            self._processor.stop()
        super().destroy()
