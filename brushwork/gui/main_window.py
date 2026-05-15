"""Brushwork main window: menus, toolbar, scrollable canvas."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtGui import QAction, QActionGroup, QColor, QIcon, QKeySequence, QMouseEvent, QPixmap
from PySide6.QtWidgets import (
    QColorDialog,
    QDialog,
    QDialogButtonBox,
    QFileDialog,
    QFormLayout,
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


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Brushwork")
        self.resize(1000, 700)
        self._canvas = BrushCanvas()
        self._canvas.imageChanged.connect(self._on_image_changed)
        self._canvas.colorsSwapped.connect(self._on_colors_swapped)
        self._current_path: Path | None = None
        self._tool_group: QActionGroup | None = None

        scroll = QScrollArea()
        scroll.setWidget(self._canvas)
        scroll.setAlignment(Qt.AlignmentFlag.AlignCenter)
        scroll.setWidgetResizable(False)
        self.setCentralWidget(scroll)

        self._build_actions()
        self._build_menus()
        self._build_toolbar()
        self._status = QStatusBar()
        self.setStatusBar(self._status)
        self._status.showMessage("Ready — left drag to draw")

        self._canvas.installEventFilter(self)

    def eventFilter(self, obj, event) -> bool:  # type: ignore[override]
        if obj is self._canvas and event.type() == event.Type.MouseMove:
            if isinstance(event, QMouseEvent):
                ip = self._canvas.image_pos_from_widget(event.position())
                self._status.showMessage(
                    f"{ip.x()}, {ip.y()}  |  {self._canvas.image().width()}×{self._canvas.image().height()}"
                )
        return super().eventFilter(obj, event)

    def _on_colors_swapped(self) -> None:
        self._update_fg_icon()
        self._update_bg_icon()

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

        self._act_exit = QAction("E&xit", self)
        self._act_exit.setShortcut(QKeySequence.StandardKey.Quit)
        self._act_exit.triggered.connect(self.close)

        self._act_undo = QAction("&Undo", self)
        self._act_undo.setShortcut(QKeySequence.StandardKey.Undo)
        self._act_undo.triggered.connect(self._canvas.undo)

        self._act_redo = QAction("&Redo", self)
        self._act_redo.setShortcut(QKeySequence.StandardKey.Redo)
        self._act_redo.triggered.connect(self._canvas.redo)

        self._act_zoom_in = QAction("Zoom in", self)
        self._act_zoom_in.setShortcut(QKeySequence.StandardKey.ZoomIn)
        self._act_zoom_in.triggered.connect(lambda: self._canvas.set_zoom(self._canvas.zoom() * 1.25))

        self._act_zoom_out = QAction("Zoom out", self)
        self._act_zoom_out.setShortcut(QKeySequence.StandardKey.ZoomOut)
        self._act_zoom_out.triggered.connect(lambda: self._canvas.set_zoom(self._canvas.zoom() / 1.25))

        self._act_zoom_100 = QAction("Zoom 100%", self)
        self._act_zoom_100.triggered.connect(lambda: self._canvas.set_zoom(1.0))

    def _build_menus(self) -> None:
        mb = self.menuBar()
        f = mb.addMenu("&File")
        f.addAction(self._act_new)
        f.addAction(self._act_open)
        f.addSeparator()
        f.addAction(self._act_save)
        f.addAction(self._act_save_as)
        f.addSeparator()
        f.addAction(self._act_exit)

        e = mb.addMenu("&Edit")
        e.addAction(self._act_undo)
        e.addAction(self._act_redo)

        v = mb.addMenu("&View")
        v.addAction(self._act_zoom_in)
        v.addAction(self._act_zoom_out)
        v.addAction(self._act_zoom_100)

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
            ("Eraser", Tool.ERASER, False),
            ("Line", Tool.LINE, False),
            ("Rect", Tool.RECT, False),
            ("Ellipse", Tool.ELLIPSE, False),
            ("Fill", Tool.FILL, False),
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
        img = QPixmap(path).toImage()
        if img.isNull():
            QMessageBox.warning(self, "Open", "Could not load image.")
            return
        self._canvas.set_image(img)
        self._current_path = Path(path)
        self._canvas.mark_saved()
        self._on_image_changed()

    def _save_image(self) -> None:
        if self._current_path is None:
            self._save_image_as()
            return
        if self._canvas.image().save(str(self._current_path)):
            self._canvas.mark_saved()
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
        if self._canvas.image().save(path):
            self._current_path = Path(path)
            self._canvas.mark_saved()
            self._on_image_changed()
        else:
            QMessageBox.warning(self, "Save", "Could not save file.")

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
