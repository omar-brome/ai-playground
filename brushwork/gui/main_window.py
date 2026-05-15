"""Brushwork main window: menus, toolbar, scrollable canvas."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QEvent, QPoint, QSettings, Qt
from PySide6.QtGui import (
    QAction,
    QActionGroup,
    QColor,
    QGuiApplication,
    QIcon,
    QKeySequence,
    QMouseEvent,
    QPainter,
    QPixmap,
    QWheelEvent,
)
from PySide6.QtPrintSupport import QPrintDialog, QPrinter
from PySide6.QtWidgets import (
    QCheckBox,
    QColorDialog,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFileDialog,
    QFontDialog,
    QFormLayout,
    QInputDialog,
    QLabel,
    QMainWindow,
    QMessageBox,
    QScrollArea,
    QSpinBox,
    QStatusBar,
    QToolBar,
    QWidget,
)

from gui.canvas import BrushCanvas, Tool


class NewImageDialog(QDialog):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("New image")
        self._w = QSpinBox()
        self._w.setRange(16, 8192)
        self._w.setValue(800)
        self._h = QSpinBox()
        self._h.setRange(16, 8192)
        self._h.setValue(600)
        form = QFormLayout(self)
        form.addRow("Width (px)", self._w)
        form.addRow("Height (px)", self._h)
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        form.addRow(buttons)

    def size_px(self) -> tuple[int, int]:
        return self._w.value(), self._h.value()


class ResizeImageDialog(QDialog):
    def __init__(self, parent: QWidget | None, cur_w: int, cur_h: int) -> None:
        super().__init__(parent)
        self.setWindowTitle("Resize image")
        self._w = QSpinBox()
        self._w.setRange(1, 8192)
        self._w.setValue(cur_w)
        self._h = QSpinBox()
        self._h.setRange(1, 8192)
        self._h.setValue(cur_h)
        self._stretch = QCheckBox("Stretch (scale entire image to new size)")
        form = QFormLayout(self)
        form.addRow("Width (px)", self._w)
        form.addRow("Height (px)", self._h)
        form.addRow(self._stretch)
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        form.addRow(buttons)

    def values(self) -> tuple[int, int, bool]:
        return self._w.value(), self._h.value(), self._stretch.isChecked()


class JpegQualityDialog(QDialog):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("JPEG quality")
        self._q = QSpinBox()
        self._q.setRange(1, 100)
        self._q.setValue(90)
        form = QFormLayout(self)
        form.addRow("Quality (1–100)", self._q)
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        form.addRow(buttons)

    def quality(self) -> int:
        return self._q.value()


class MainWindow(QMainWindow):
    _MAX_RECENT = 8

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Brushwork")
        self.resize(1000, 700)
        self._settings = QSettings()
        self._canvas = BrushCanvas()
        self._canvas.imageChanged.connect(self._on_image_changed)
        self._canvas.colorsSwapped.connect(self._on_colors_swapped)
        self._canvas.colorSampled.connect(self._on_color_sampled)
        self._canvas.textToolRequested.connect(self._on_text_tool_requested)
        self._current_path: Path | None = None
        self._tool_group: QActionGroup | None = None
        self._last_image_pos = QPoint(self._canvas.image().width() // 2, self._canvas.image().height() // 2)
        self._middle_panning = False
        self._middle_anchor: QPoint | None = None
        self._middle_scroll = QPoint(0, 0)
        self._recent_menu: QWidget | None = None

        self._scroll = QScrollArea()
        self._scroll.setWidget(self._canvas)
        self._scroll.setAlignment(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignTop)
        self._scroll.setWidgetResizable(False)
        self.setCentralWidget(self._scroll)

        self._build_actions()
        self._build_menus()
        self._build_toolbar()
        self._status = QStatusBar()
        self.setStatusBar(self._status)
        self._status.showMessage("Ready — left drag to draw")

        self._canvas.installEventFilter(self)
        self._scroll.viewport().installEventFilter(self)

        self._sync_zoom_combo()

    def eventFilter(self, obj, event) -> bool:  # type: ignore[override]
        if obj is self._canvas and event.type() == QEvent.Type.MouseMove:
            if isinstance(event, QMouseEvent):
                ip = self._canvas.image_pos_from_widget(event.position())
                self._last_image_pos = QPoint(ip)
                self._status.showMessage(
                    f"{ip.x()}, {ip.y()}  |  {self._canvas.image().width()}×{self._canvas.image().height()}"
                )
        if obj is self._scroll.viewport() or obj is self._canvas:
            if event.type() == QEvent.Type.Wheel and isinstance(event, QWheelEvent):
                if self._handle_wheel_zoom(event, obj):
                    return True
            if isinstance(event, QMouseEvent):
                if event.type() == QEvent.Type.MouseButtonPress and event.button() == Qt.MouseButton.MiddleButton:
                    self._middle_panning = True
                    self._middle_anchor = event.globalPosition().toPoint()
                    self._middle_scroll = QPoint(
                        self._scroll.horizontalScrollBar().value(),
                        self._scroll.verticalScrollBar().value(),
                    )
                    return True
                if event.type() == QEvent.Type.MouseButtonRelease and event.button() == Qt.MouseButton.MiddleButton:
                    self._middle_panning = False
                    self._middle_anchor = None
                    return True
                if event.type() == QEvent.Type.MouseMove and self._middle_panning and self._middle_anchor is not None:
                    g = event.globalPosition().toPoint()
                    d = g - self._middle_anchor
                    self._scroll.horizontalScrollBar().setValue(self._middle_scroll.x() - d.x())
                    self._scroll.verticalScrollBar().setValue(self._middle_scroll.y() - d.y())
                    return True
        return super().eventFilter(obj, event)

    def _handle_wheel_zoom(self, event: QWheelEvent, source: QWidget) -> bool:
        pos_src = event.position().toPoint()
        if source is self._canvas:
            pos_vp = self._scroll.viewport().mapFrom(self._canvas, pos_src)
        else:
            pos_vp = pos_src
        mouse_on_canvas = self._canvas.mapFrom(self._scroll.viewport(), pos_vp)
        mouse_on_canvas.setX(max(0, min(self._canvas.width() - 1, mouse_on_canvas.x())))
        mouse_on_canvas.setY(max(0, min(self._canvas.height() - 1, mouse_on_canvas.y())))
        old_z = self._canvas.zoom()
        dy = event.angleDelta().y()
        if dy == 0:
            return False
        factor = 1.12 if dy > 0 else 1 / 1.12
        new_z = max(0.25, min(8.0, old_z * factor))
        if abs(new_z - old_z) < 1e-9:
            return True
        ix = mouse_on_canvas.x() / old_z
        iy = mouse_on_canvas.y() / old_z
        self._canvas.set_zoom(new_z)
        new_c = QPoint(int(ix * new_z), int(iy * new_z))
        delta = new_c - mouse_on_canvas
        h = self._scroll.horizontalScrollBar()
        v = self._scroll.verticalScrollBar()
        h.setValue(int(h.value() + delta.x()))
        v.setValue(int(v.value() + delta.y()))
        self._sync_zoom_combo()
        return True

    def _on_color_sampled(self, _c: QColor, _bg: bool) -> None:
        self._update_fg_icon()
        self._update_bg_icon()

    def _on_colors_swapped(self) -> None:
        self._update_fg_icon()
        self._update_bg_icon()

    def _on_text_tool_requested(self, ip: QPoint) -> None:
        text, ok = QInputDialog.getText(self, "Text", "Text to place:")
        if not ok or not text.strip():
            return
        okf, font = QFontDialog.getFont(self._canvas.font(), self)
        if not okf:
            return
        self._canvas.apply_text(text.strip(), font, ip)

    def _on_tool_triggered(self, action: QAction) -> None:
        name = action.data()
        if isinstance(name, str) and name in Tool.__members__:
            self._canvas.set_tool(Tool[name])

    def _on_image_changed(self) -> None:
        dirty = self._canvas.is_dirty()
        if self._current_path:
            self.setWindowTitle(f"Brushwork — {self._current_path.name}{'*' if dirty else ''}")
        else:
            self.setWindowTitle(f"Brushwork — Untitled{'*' if dirty else ''}")

    def _sync_zoom_combo(self) -> None:
        pct = int(round(self._canvas.zoom() * 100))
        if hasattr(self, "_zoom_combo"):
            self._zoom_combo.blockSignals(True)
            i = self._zoom_combo.findText(f"{pct}%")
            if i >= 0:
                self._zoom_combo.setCurrentIndex(i)
            else:
                self._zoom_combo.setCurrentText(f"{pct}%")
            self._zoom_combo.blockSignals(False)

    def _on_zoom_combo_changed(self, text: str) -> None:
        s = text.strip().rstrip("%")
        try:
            v = float(s)
        except ValueError:
            self._sync_zoom_combo()
            return
        self._canvas.set_zoom(max(0.25, min(8.0, v / 100.0)))

    def _fit_to_window(self) -> None:
        vp = self._scroll.viewport().size()
        iw = max(1, self._canvas.image().width())
        ih = max(1, self._canvas.image().height())
        z = min((vp.width() - 8) / iw, (vp.height() - 8) / ih)
        self._canvas.set_zoom(max(0.25, min(8.0, z)))
        self._sync_zoom_combo()

    def _build_actions(self) -> None:
        self._act_new = QAction("&New…", self)
        self._act_new.setShortcut(QKeySequence.StandardKey.New)
        self._act_new.triggered.connect(self._new_image)

        self._act_open = QAction("&Open…", self)
        self._act_open.setShortcut(QKeySequence.StandardKey.Open)
        self._act_open.triggered.connect(self._open_image)

        self._act_save = QAction("&Save", self)
        self._act_save.setShortcut(QKeySequence.StandardKey.Save)
        self._act_save.triggered.connect(self._save_image)

        self._act_save_as = QAction("Save &as…", self)
        self._act_save_as.setShortcut(QKeySequence.StandardKey.SaveAs)
        self._act_save_as.triggered.connect(self._save_image_as)

        self._act_print = QAction("&Print…", self)
        self._act_print.triggered.connect(self._print_image)

        self._act_exit = QAction("E&xit", self)
        self._act_exit.setShortcut(QKeySequence.StandardKey.Quit)
        self._act_exit.triggered.connect(self.close)

        self._act_undo = QAction("&Undo", self)
        self._act_undo.setShortcut(QKeySequence.StandardKey.Undo)
        self._act_undo.triggered.connect(self._canvas.undo)

        self._act_redo = QAction("&Redo", self)
        self._act_redo.setShortcut(QKeySequence.StandardKey.Redo)
        self._act_redo.triggered.connect(self._canvas.redo)

        self._act_copy = QAction("&Copy", self)
        self._act_copy.setShortcut(QKeySequence.StandardKey.Copy)
        self._act_copy.setShortcutContext(Qt.ShortcutContext.ApplicationShortcut)
        self._act_copy.triggered.connect(self._copy_selection_or_skip)

        self._act_paste = QAction("&Paste", self)
        self._act_paste.setShortcut(QKeySequence.StandardKey.Paste)
        self._act_paste.setShortcutContext(Qt.ShortcutContext.ApplicationShortcut)
        self._act_paste.triggered.connect(self._paste_clipboard_image)

        self._act_resize = QAction("&Resize image…", self)
        self._act_resize.triggered.connect(self._resize_image)

        self._act_crop_sel = QAction("&Crop to selection", self)
        self._act_crop_sel.triggered.connect(self._crop_selection)

        self._act_rot_cw = QAction("Rotate 90° &clockwise", self)
        self._act_rot_cw.triggered.connect(lambda: self._canvas.rotate_90(True))

        self._act_rot_ccw = QAction("Rotate 90° co&unter-clockwise", self)
        self._act_rot_ccw.triggered.connect(lambda: self._canvas.rotate_90(False))

        self._act_flip_h = QAction("Flip &horizontal", self)
        self._act_flip_h.triggered.connect(lambda: self._canvas.flip(True))

        self._act_flip_v = QAction("Flip &vertical", self)
        self._act_flip_v.triggered.connect(lambda: self._canvas.flip(False))

        self._act_invert = QAction("&Invert colors", self)
        self._act_invert.triggered.connect(self._canvas.invert_colors)

        self._act_clear = QAction("&Clear", self)
        self._act_clear.triggered.connect(self._clear_image)

        self._act_zoom_in = QAction("Zoom in", self)
        self._act_zoom_in.setShortcut(QKeySequence.StandardKey.ZoomIn)
        self._act_zoom_in.triggered.connect(lambda: self._bump_zoom(1.25))

        self._act_zoom_out = QAction("Zoom out", self)
        self._act_zoom_out.setShortcut(QKeySequence.StandardKey.ZoomOut)
        self._act_zoom_out.triggered.connect(lambda: self._bump_zoom(1 / 1.25))

        self._act_zoom_100 = QAction("Zoom 100%", self)
        self._act_zoom_100.triggered.connect(self._zoom_100)

        self._act_fit = QAction("&Fit to window", self)
        self._act_fit.triggered.connect(self._fit_to_window)

        self._act_shortcuts = QAction("&Keyboard shortcuts", self)
        self._act_shortcuts.triggered.connect(self._show_shortcuts)

        self._act_about = QAction("&About Brushwork", self)
        self._act_about.triggered.connect(self._show_about)

        self.addAction(self._act_copy)
        self.addAction(self._act_paste)

    def _zoom_100(self) -> None:
        self._canvas.set_zoom(1.0)
        self._sync_zoom_combo()

    def _bump_zoom(self, factor: float) -> None:
        self._canvas.set_zoom(self._canvas.zoom() * factor)
        self._sync_zoom_combo()

    def _build_menus(self) -> None:
        mb = self.menuBar()
        f = mb.addMenu("&File")
        f.addAction(self._act_new)
        f.addAction(self._act_open)
        self._recent_menu = f.addMenu("Open &recent")
        self._rebuild_recent_menu()
        f.addSeparator()
        f.addAction(self._act_save)
        f.addAction(self._act_save_as)
        f.addSeparator()
        f.addAction(self._act_print)
        f.addSeparator()
        f.addAction(self._act_exit)

        e = mb.addMenu("&Edit")
        e.addAction(self._act_undo)
        e.addAction(self._act_redo)
        e.addSeparator()
        e.addAction(self._act_copy)
        e.addAction(self._act_paste)

        i = mb.addMenu("&Image")
        i.addAction(self._act_resize)
        i.addAction(self._act_crop_sel)
        i.addSeparator()
        i.addAction(self._act_rot_cw)
        i.addAction(self._act_rot_ccw)
        i.addSeparator()
        i.addAction(self._act_flip_h)
        i.addAction(self._act_flip_v)
        i.addSeparator()
        i.addAction(self._act_invert)
        i.addAction(self._act_clear)

        v = mb.addMenu("&View")
        v.addAction(self._act_zoom_in)
        v.addAction(self._act_zoom_out)
        v.addAction(self._act_zoom_100)
        v.addAction(self._act_fit)

        h = mb.addMenu("&Help")
        h.addAction(self._act_shortcuts)
        h.addAction(self._act_about)

    def _rebuild_recent_menu(self) -> None:
        if self._recent_menu is None:
            return
        self._recent_menu.clear()
        paths = self._settings.value("recentFiles", [])
        if not isinstance(paths, list):
            paths = []
        for p in paths[: self._MAX_RECENT]:
            if not isinstance(p, str) or not p:
                continue
            act = QAction(p, self)
            act.triggered.connect(lambda checked=False, path=p: self._open_recent_path(path))
            self._recent_menu.addAction(act)
        if self._recent_menu.isEmpty():
            a = QAction("(empty)", self)
            a.setEnabled(False)
            self._recent_menu.addAction(a)

    def _add_recent(self, path: Path) -> None:
        key = str(path.resolve())
        cur = self._settings.value("recentFiles", [])
        if not isinstance(cur, list):
            cur = []
        cur = [x for x in cur if isinstance(x, str) and x != key]
        cur.insert(0, key)
        self._settings.setValue("recentFiles", cur[: self._MAX_RECENT])
        self._rebuild_recent_menu()

    def _build_toolbar(self) -> None:
        tb = QToolBar("Tools")
        tb.setMovable(True)
        self.addToolBar(tb)

        self._tool_group = QActionGroup(self)
        self._tool_group.setExclusive(True)
        self._tool_group.triggered.connect(self._on_tool_triggered)

        for name, tool, checked in (
            ("Pencil", Tool.PENCIL, True),
            ("Brush", Tool.BRUSH, False),
            ("Airbrush", Tool.AIRBRUSH, False),
            ("Eraser", Tool.ERASER, False),
            ("Line", Tool.LINE, False),
            ("Rect", Tool.RECT, False),
            ("Rnd rect", Tool.ROUND_RECT, False),
            ("Ellipse", Tool.ELLIPSE, False),
            ("Polygon", Tool.POLYGON, False),
            ("Curve", Tool.CURVE, False),
            ("Fill", Tool.FILL, False),
            ("Dropper", Tool.EYEDROPPER, False),
            ("Text", Tool.TEXT, False),
            ("Select", Tool.SELECT, False),
        ):
            a = QAction(name, self)
            a.setCheckable(True)
            a.setChecked(checked)
            a.setData(tool.name)
            self._tool_group.addAction(a)
            tb.addAction(a)

        tb.addSeparator()

        self._fg_preview = QAction("FG", self)
        self._fg_preview.triggered.connect(self._pick_fg)
        self._update_fg_icon()
        tb.addAction(self._fg_preview)

        self._bg_preview = QAction("BG", self)
        self._bg_preview.triggered.connect(self._pick_bg)
        self._update_bg_icon()
        tb.addAction(self._bg_preview)

        tb.addSeparator()
        tb.addWidget(QLabel(" Size "))
        self._size_spin = QSpinBox()
        self._size_spin.setRange(1, 64)
        self._size_spin.setValue(self._canvas.brush_size())
        self._size_spin.valueChanged.connect(self._canvas.set_brush_size)
        tb.addWidget(self._size_spin)

        tb.addWidget(QLabel(" Rnd r "))
        self._radius_spin = QSpinBox()
        self._radius_spin.setRange(0, 64)
        self._radius_spin.setValue(self._canvas.round_rect_radius())
        self._radius_spin.valueChanged.connect(self._canvas.set_round_rect_radius)
        tb.addWidget(self._radius_spin)

        tb.addWidget(QLabel(" Fill tol "))
        self._fill_tol_spin = QSpinBox()
        self._fill_tol_spin.setRange(0, 32)
        self._fill_tol_spin.setValue(0)
        self._fill_tol_spin.setToolTip("Flood fill color tolerance (0 = exact match only)")
        self._fill_tol_spin.valueChanged.connect(self._canvas.set_fill_tolerance)
        tb.addWidget(self._fill_tol_spin)

        tb.addSeparator()
        tb.addWidget(QLabel(" Zoom "))
        self._zoom_combo = QComboBox()
        for z in (25, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800):
            self._zoom_combo.addItem(f"{z}%")
        self._zoom_combo.setEditable(True)
        self._zoom_combo.setMinimumWidth(72)
        self._zoom_combo.currentTextChanged.connect(self._on_zoom_combo_changed)
        tb.addWidget(self._zoom_combo)

    def _update_fg_icon(self) -> None:
        pix = QPixmap(24, 24)
        pix.fill(self._canvas.fg())
        self._fg_preview.setIcon(QIcon(pix))

    def _update_bg_icon(self) -> None:
        pix = QPixmap(24, 24)
        pix.fill(self._canvas.bg())
        self._bg_preview.setIcon(QIcon(pix))

    def _pick_fg(self) -> None:
        c = QColorDialog.getColor(self._canvas.fg(), self, "Foreground color")
        if c.isValid():
            self._canvas.set_fg(c)
            self._update_fg_icon()

    def _pick_bg(self) -> None:
        c = QColorDialog.getColor(self._canvas.bg(), self, "Background color")
        if c.isValid():
            self._canvas.set_bg(c)
            self._update_bg_icon()

    def _new_image(self) -> None:
        if not self._maybe_save_dirty():
            return
        dlg = NewImageDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            w, h = dlg.size_px()
            self._canvas.new_image(w, h)
            self._current_path = None
            self._on_image_changed()

    def _open_image(self) -> None:
        if not self._maybe_save_dirty():
            return
        path, _ = QFileDialog.getOpenFileName(
            self,
            "Open image",
            "",
            "Images (*.png *.jpg *.jpeg *.bmp *.webp);;All files (*)",
        )
        if not path:
            return
        self._load_path(Path(path))

    def _open_recent_path(self, path: str) -> None:
        if not self._maybe_save_dirty():
            return
        self._load_path(Path(path))

    def _load_path(self, path: Path) -> None:
        img = QPixmap(str(path)).toImage()
        if img.isNull():
            QMessageBox.warning(self, "Open", "Could not load image.")
            return
        self._canvas.set_image(img)
        self._current_path = path
        self._canvas.mark_saved()
        self._add_recent(path)
        self._on_image_changed()

    def _resize_image(self) -> None:
        img = self._canvas.image()
        dlg = ResizeImageDialog(self, img.width(), img.height())
        if dlg.exec() != QDialog.DialogCode.Accepted:
            return
        w, h, stretch = dlg.values()
        self._canvas.resize_image(w, h, stretch)

    def _crop_selection(self) -> None:
        if not self._canvas.crop_to_selection():
            QMessageBox.information(self, "Crop", "Use the Select tool and drag a rectangle first.")

    def _clear_image(self) -> None:
        r = QMessageBox.question(
            self,
            "Clear",
            "Fill the entire image with white?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
        )
        if r == QMessageBox.StandardButton.Yes:
            self._canvas.clear_image()

    def _copy_selection_or_skip(self) -> None:
        img = self._canvas.copy_selection_image()
        if img is None or img.isNull():
            return
        QGuiApplication.clipboard().setImage(img)

    def _paste_clipboard_image(self) -> None:
        mim = QGuiApplication.clipboard().mimeData()
        if mim is None or not mim.hasImage():
            return
        img = QGuiApplication.clipboard().image()
        if img.isNull():
            return
        lp = self._last_image_pos
        tl = QPoint(
            lp.x() - img.width() // 2,
            lp.y() - img.height() // 2,
        )
        self._canvas.paste_image(img, tl)

    def _print_image(self) -> None:
        printer = QPrinter(QPrinter.PrinterMode.HighResolution)
        dlg = QPrintDialog(printer, self)
        if dlg.exec() != QDialog.DialogCode.Accepted:
            return
        img = self._canvas.image()
        painter = QPainter(printer)
        rect = painter.viewport()
        scaled = img.scaled(rect.size(), Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        x = (rect.width() - scaled.width()) // 2
        y = (rect.height() - scaled.height()) // 2
        painter.drawImage(x, y, scaled)
        painter.end()

    def _show_shortcuts(self) -> None:
        text = (
            "<p><b>File</b><br>"
            "Ctrl+N — New<br>"
            "Ctrl+O — Open<br>"
            "Ctrl+S — Save<br>"
            "Ctrl+Shift+S — Save as</p>"
            "<p><b>Edit</b><br>"
            "Ctrl+Z — Undo<br>"
            "Ctrl+Y / Ctrl+Shift+Z — Redo<br>"
            "Ctrl+C — Copy selection (Select tool)<br>"
            "Ctrl+V — Paste image from clipboard</p>"
            "<p><b>View</b><br>"
            "Ctrl++ / Ctrl+- — Zoom in/out<br>"
            "Mouse wheel — Zoom toward cursor<br>"
            "Middle drag — Pan</p>"
            "<p><b>Canvas</b><br>"
            "Right-click — Swap foreground/background (or close polygon)<br>"
            "Shift+click (eyedropper) — Sample into background<br>"
            "Enter — Close polygon<br>"
            "Delete — Clear selected region (Select tool)</p>"
        )
        QMessageBox.information(self, "Keyboard shortcuts", text)

    def _show_about(self) -> None:
        QMessageBox.about(
            self,
            "About Brushwork",
            "<h3>Brushwork</h3>"
            "<p>A small bitmap editor built with <b>Python</b> and <b>Qt / PySide6</b>.</p>"
            "<p>Not affiliated with Microsoft.</p>",
        )

    def _save_image(self) -> None:
        if self._current_path is None:
            self._save_image_as()
            return
        if self._save_to_path(self._current_path):
            self._canvas.mark_saved()
            self._add_recent(self._current_path)
            self._on_image_changed()
        else:
            QMessageBox.warning(self, "Save", "Could not save file.")

    def _save_image_as(self) -> None:
        path, _ = QFileDialog.getSaveFileName(
            self,
            "Save image",
            "",
            "PNG (*.png);;JPEG (*.jpg);;BMP (*.bmp)",
        )
        if not path:
            return
        quality = -1
        low = path.lower()
        if low.endswith((".jpg", ".jpeg")):
            qdlg = JpegQualityDialog(self)
            if qdlg.exec() != QDialog.DialogCode.Accepted:
                return
            quality = qdlg.quality()
        if self._save_to_path(Path(path), quality=quality):
            self._current_path = Path(path)
            self._canvas.mark_saved()
            self._add_recent(self._current_path)
            self._on_image_changed()
        else:
            QMessageBox.warning(self, "Save", "Could not save file.")

    def _save_to_path(self, path: Path, quality: int = -1) -> bool:
        img = self._canvas.image()
        low = str(path).lower()
        if low.endswith((".jpg", ".jpeg")) and quality >= 0:
            return bool(img.save(str(path), "JPEG", quality))
        return bool(img.save(str(path)))

    def _maybe_save_dirty(self) -> bool:
        if not self._canvas.is_dirty():
            return True
        r = QMessageBox.question(
            self,
            "Brushwork",
            "Save changes?",
            QMessageBox.StandardButton.Save
            | QMessageBox.StandardButton.Discard
            | QMessageBox.StandardButton.Cancel,
        )
        if r == QMessageBox.StandardButton.Cancel:
            return False
        if r == QMessageBox.StandardButton.Save:
            self._save_image()
            return not self._canvas.is_dirty()
        return True

    def closeEvent(self, event) -> None:  # type: ignore[override]
        if self._maybe_save_dirty():
            event.accept()
        else:
            event.ignore()
