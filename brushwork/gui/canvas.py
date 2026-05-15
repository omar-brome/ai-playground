"""Paint canvas: raster image, tools, zoom."""

from __future__ import annotations

from collections import deque
from enum import Enum, auto

from PySide6.QtCore import QPoint, QRect, QSize, Qt, Signal
from PySide6.QtGui import QColor, QImage, QMouseEvent, QPainter, QPen
from PySide6.QtWidgets import QWidget


class Tool(Enum):
    PENCIL = auto()
    BRUSH = auto()
    ERASER = auto()
    LINE = auto()
    RECT = auto()
    ELLIPSE = auto()
    FILL = auto()


class BrushCanvas(QWidget):
    """Widget displaying a QImage; mouse maps to image pixels (with zoom)."""

    imageChanged = Signal()
    colorsSwapped = Signal()

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._image = QImage(QSize(800, 600), QImage.Format.Format_ARGB32_Premultiplied)
        self._image.fill(QColor(255, 255, 255))
        self._zoom = 1.0
        self._tool = Tool.PENCIL
        self._fg = QColor(0, 0, 0)
        self._bg = QColor(255, 255, 255)
        self._brush_size = 4
        self._drawing = False
        self._last_ip: QPoint | None = None
        self._shape_start: QPoint | None = None
        self._shape_end: QPoint | None = None
        self._dirty = False
        self._undo_stack: list[QImage] = []
        self._redo_stack: list[QImage] = []
        self._max_undo = 30
        self.setMouseTracking(True)
        self._resize_from_image()

    def _resize_from_image(self) -> None:
        z = self._zoom
        self.setFixedSize(
            int(self._image.width() * z),
            int(self._image.height() * z),
        )

    def image(self) -> QImage:
        return self._image

    def set_image(self, img: QImage) -> None:
        self._image = img.convertToFormat(QImage.Format.Format_ARGB32_Premultiplied)
        self._clear_history()
        self._dirty = False
        self._resize_from_image()
        self.update()
        self.imageChanged.emit()

    def new_image(self, width: int, height: int) -> None:
        self._image = QImage(QSize(width, height), QImage.Format.Format_ARGB32_Premultiplied)
        self._image.fill(QColor(255, 255, 255))
        self._clear_history()
        self._dirty = False
        self._resize_from_image()
        self.update()
        self.imageChanged.emit()

    def _clear_history(self) -> None:
        self._undo_stack.clear()
        self._redo_stack.clear()

    def is_dirty(self) -> bool:
        return self._dirty

    def mark_saved(self) -> None:
        self._dirty = False

    def zoom(self) -> float:
        return self._zoom

    def set_zoom(self, z: float) -> None:
        self._zoom = max(0.25, min(8.0, z))
        self._resize_from_image()
        self.update()

    def tool(self) -> Tool:
        return self._tool

    def set_tool(self, t: Tool) -> None:
        self._tool = t
        self._drawing = False
        self._last_ip = None
        self._shape_start = None
        self._shape_end = None

    def set_fg(self, c: QColor) -> None:
        self._fg = QColor(c)

    def fg(self) -> QColor:
        return QColor(self._fg)

    def set_bg(self, c: QColor) -> None:
        self._bg = QColor(c)

    def bg(self) -> QColor:
        return QColor(self._bg)

    def set_brush_size(self, n: int) -> None:
        self._brush_size = max(1, min(64, int(n)))

    def brush_size(self) -> int:
        return self._brush_size

    def image_pos_from_widget(self, pos) -> QPoint:
        return self._widget_to_image(pos)

    def _widget_to_image(self, pos) -> QPoint:
        z = self._zoom
        x = int(pos.x() / z)
        y = int(pos.y() / z)
        x = max(0, min(self._image.width() - 1, x))
        y = max(0, min(self._image.height() - 1, y))
        return QPoint(x, y)

    def _push_undo(self) -> None:
        self._undo_stack.append(self._image.copy())
        if len(self._undo_stack) > self._max_undo:
            self._undo_stack.pop(0)
        self._redo_stack.clear()

    def undo(self) -> bool:
        if not self._undo_stack:
            return False
        self._redo_stack.append(self._image.copy())
        self._image = self._undo_stack.pop()
        self._resize_from_image()
        self.update()
        self.imageChanged.emit()
        return True

    def redo(self) -> bool:
        if not self._redo_stack:
            return False
        self._undo_stack.append(self._image.copy())
        self._image = self._redo_stack.pop()
        self._resize_from_image()
        self.update()
        self.imageChanged.emit()
        return True

    def paintEvent(self, event) -> None:  # type: ignore[override]
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(120, 120, 120))
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        painter.scale(self._zoom, self._zoom)
        painter.drawImage(0, 0, self._image)
        if self._shape_start is not None and self._shape_end is not None:
            painter.setPen(QPen(self._fg, max(1, self._brush_size // 2), Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            if self._tool == Tool.LINE:
                painter.drawLine(self._shape_start, self._shape_end)
            elif self._tool == Tool.RECT:
                painter.drawRect(QRect(self._shape_start, self._shape_end).normalized())
            elif self._tool == Tool.ELLIPSE:
                painter.drawEllipse(QRect(self._shape_start, self._shape_end).normalized())

    def mousePressEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        if event.button() == Qt.MouseButton.RightButton:
            self._fg, self._bg = QColor(self._bg), QColor(self._fg)
            self.colorsSwapped.emit()
            self.update()
            return
        if event.button() != Qt.MouseButton.LeftButton:
            return
        ip = self._widget_to_image(event.position())
        if self._tool == Tool.FILL:
            self._push_undo()
            self._flood_fill(ip.x(), ip.y(), self._fg)
            self._dirty = True
            self.update()
            self.imageChanged.emit()
            return
        if self._tool in (Tool.LINE, Tool.RECT, Tool.ELLIPSE):
            self._shape_start = ip
            self._shape_end = ip
            self.update()
            return
        self._push_undo()
        self._drawing = True
        self._last_ip = ip
        if self._tool == Tool.ERASER:
            self._stroke_to(ip, self._bg)
        else:
            self._stroke_to(ip, self._fg)

    def mouseMoveEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        ip = self._widget_to_image(event.position())
        if self._tool in (Tool.LINE, Tool.RECT, Tool.ELLIPSE) and self._shape_start is not None:
            self._shape_end = ip
            self.update()
            return
        if not self._drawing or self._last_ip is None:
            return
        if self._tool == Tool.ERASER:
            self._stroke_to(ip, self._bg)
        else:
            self._stroke_to(ip, self._fg)
        self._last_ip = ip

    def mouseReleaseEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        if event.button() != Qt.MouseButton.LeftButton:
            return
        if self._tool in (Tool.LINE, Tool.RECT, Tool.ELLIPSE) and self._shape_start is not None:
            end = self._widget_to_image(event.position())
            start = self._shape_start
            self._shape_start = None
            self._shape_end = None
            if end != start:
                self._commit_shape(start, end)
                self._dirty = True
            self.update()
            self.imageChanged.emit()
            return
        self._drawing = False
        self._last_ip = None

    def _stroke_to(self, ip: QPoint, color: QColor) -> None:
        p = QPainter(self._image)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        width = 1 if self._tool == Tool.PENCIL else self._brush_size
        pen = QPen(color, width, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin)
        p.setPen(pen)
        if self._last_ip is not None and self._last_ip != ip:
            p.drawLine(self._last_ip, ip)
        else:
            r = max(1, int(width))
            p.drawEllipse(ip.x() - r // 2, ip.y() - r // 2, r, r)
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def _commit_shape(self, a: QPoint, b: QPoint) -> None:
        self._push_undo()
        p = QPainter(self._image)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        w = max(1, self._brush_size // 2)
        p.setPen(QPen(self._fg, w, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        r = QRect(a, b).normalized()
        if self._tool == Tool.LINE:
            p.drawLine(a, b)
        elif self._tool == Tool.RECT:
            p.drawRect(r)
        elif self._tool == Tool.ELLIPSE:
            p.drawEllipse(r)
        p.end()

    def _flood_fill(self, x: int, y: int, new_color: QColor) -> None:
        img = self._image
        w, h = img.width(), img.height()
        old = img.pixelColor(x, y)
        if old == new_color:
            return
        q = deque([(x, y)])
        visited = set()
        while q:
            cx, cy = q.popleft()
            if (cx, cy) in visited:
                continue
            if not (0 <= cx < w and 0 <= cy < h):
                continue
            visited.add((cx, cy))
            if img.pixelColor(cx, cy) != old:
                continue
            img.setPixelColor(cx, cy, new_color)
            q.append((cx + 1, cy))
            q.append((cx - 1, cy))
            q.append((cx, cy + 1))
            q.append((cx, cy - 1))
