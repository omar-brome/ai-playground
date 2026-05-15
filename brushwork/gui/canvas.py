"""Paint canvas: raster image, tools, zoom."""

from __future__ import annotations

import math
import random
from collections import deque
from enum import Enum, auto

from PySide6.QtCore import QPoint, QRect, QSize, Qt, Signal, QTimer
from PySide6.QtGui import (
    QColor,
    QFont,
    QImage,
    QKeyEvent,
    QMouseEvent,
    QPainter,
    QPainterPath,
    QPen,
    QPolygon,
    QTransform,
)
from PySide6.QtWidgets import QWidget


class Tool(Enum):
    PENCIL = auto()
    BRUSH = auto()
    ERASER = auto()
    AIRBRUSH = auto()
    LINE = auto()
    RECT = auto()
    ROUND_RECT = auto()
    ELLIPSE = auto()
    POLYGON = auto()
    CURVE = auto()
    FILL = auto()
    EYEDROPPER = auto()
    TEXT = auto()
    SELECT = auto()


class BrushCanvas(QWidget):
    """Widget displaying a QImage; mouse maps to image pixels (with zoom)."""

    imageChanged = Signal()
    colorsSwapped = Signal()
    colorSampled = Signal(QColor, bool)  # color, is_background
    textToolRequested = Signal(QPoint)  # image coordinates

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
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)

        self._round_rect_radius = 12
        self._fill_tolerance = 0

        self._poly_vertices: list[QPoint] = []
        self._curve_points: list[QPoint] = []
        self._airbrush_stroke_started = False

        self._sel_state = "none"
        self._sel_rect = QRect()
        self._sel_anchor: QPoint | None = None
        self._float_pix: QImage | None = None
        self._float_tl = QPoint(0, 0)
        self._move_press_offset: QPoint | None = None
        self._ants_phase = 0
        self._ants_timer = QTimer(self)
        self._ants_timer.setInterval(120)
        self._ants_timer.timeout.connect(self._on_ants_tick)

        self._hover_ip = QPoint(0, 0)

        self._resize_from_image()

    def _on_ants_tick(self) -> None:
        self._ants_phase = (self._ants_phase + 1) % 10000
        if self._tool == Tool.SELECT and self._sel_state in ("creating", "selected", "moving"):
            self.update()

    def _ensure_ants_timer(self) -> None:
        if self._tool == Tool.SELECT and self._sel_state in ("creating", "selected", "moving"):
            if not self._ants_timer.isActive():
                self._ants_timer.start()
        else:
            self._ants_timer.stop()

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
        self._clear_selection()
        self._resize_from_image()
        self.update()
        self.imageChanged.emit()

    def new_image(self, width: int, height: int) -> None:
        self._image = QImage(QSize(width, height), QImage.Format.Format_ARGB32_Premultiplied)
        self._image.fill(QColor(255, 255, 255))
        self._clear_history()
        self._dirty = False
        self._clear_selection()
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
        self._poly_vertices.clear()
        self._curve_points.clear()
        self._airbrush_stroke_started = False
        if t != Tool.SELECT:
            self._clear_selection()
        self._ensure_ants_timer()
        self.update()

    def set_round_rect_radius(self, r: int) -> None:
        self._round_rect_radius = max(0, min(128, int(r)))

    def round_rect_radius(self) -> int:
        return self._round_rect_radius

    def set_fill_tolerance(self, t: int) -> None:
        self._fill_tolerance = max(0, min(32, int(t)))

    def fill_tolerance(self) -> int:
        return self._fill_tolerance

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

    def _clear_selection(self) -> None:
        self._sel_state = "none"
        self._sel_rect = QRect()
        self._sel_anchor = None
        self._float_pix = None
        self._move_press_offset = None
        self._ensure_ants_timer()

    def has_selection(self) -> bool:
        return self._tool == Tool.SELECT and self._sel_state == "selected" and not self._sel_rect.isEmpty()

    def selection_rect(self) -> QRect:
        return QRect(self._sel_rect)

    def copy_selection_image(self) -> QImage | None:
        if not self.has_selection():
            return None
        r = self._sel_rect.normalized()
        return self._image.copy(r)

    def delete_selection_interior(self) -> bool:
        if not self.has_selection():
            return False
        self._push_undo()
        p = QPainter(self._image)
        p.fillRect(self._sel_rect.normalized(), QColor(255, 255, 255))
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()
        return True

    def crop_to_selection(self) -> bool:
        if not self.has_selection():
            return False
        r = self._sel_rect.normalized()
        self._push_undo()
        self._image = self._image.copy(r)
        self._clear_selection()
        self._resize_from_image()
        self._dirty = True
        self.update()
        self.imageChanged.emit()
        return True

    def paste_image(self, img: QImage, top_left: QPoint | None = None) -> None:
        if img.isNull():
            return
        img = img.convertToFormat(QImage.Format.Format_ARGB32_Premultiplied)
        self._push_undo()
        p = QPainter(self._image)
        if top_left is None:
            x = max(0, (self._image.width() - img.width()) // 2)
            y = max(0, (self._image.height() - img.height()) // 2)
            tl = QPoint(x, y)
        else:
            tl = QPoint(
                max(0, min(self._image.width() - img.width(), top_left.x())),
                max(0, min(self._image.height() - img.height(), top_left.y())),
            )
        p.drawImage(tl, img)
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def apply_text(self, text: str, font: QFont, ip: QPoint) -> None:
        if not text:
            return
        self._push_undo()
        p = QPainter(self._image)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        p.setFont(font)
        p.setPen(QPen(self._fg))
        p.drawText(ip, text)
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def resize_image(self, width: int, height: int, stretch: bool) -> None:
        w, h = max(1, width), max(1, height)
        self._push_undo()
        if stretch:
            self._image = self._image.scaled(
                QSize(w, h),
                Qt.AspectRatioMode.IgnoreAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            ).convertToFormat(QImage.Format.Format_ARGB32_Premultiplied)
        else:
            old = self._undo_stack[-1]
            self._image = QImage(QSize(w, h), QImage.Format.Format_ARGB32_Premultiplied)
            self._image.fill(QColor(255, 255, 255))
            p = QPainter(self._image)
            sx = min(w, old.width())
            sy = min(h, old.height())
            p.drawImage(0, 0, old, 0, 0, sx, sy)
            p.end()
        self._clear_selection()
        self._resize_from_image()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def rotate_90(self, clockwise: bool) -> None:
        self._push_undo()
        t = QTransform()
        if clockwise:
            t.rotate(90)
        else:
            t.rotate(-90)
        self._image = self._image.transformed(t, Qt.TransformationMode.SmoothTransformation).convertToFormat(
            QImage.Format.Format_ARGB32_Premultiplied
        )
        self._clear_selection()
        self._resize_from_image()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def flip(self, horizontal: bool) -> None:
        self._push_undo()
        # mirrored(rx, ry): rx=True flips horizontally; ry=True flips vertically
        self._image = self._image.mirrored(horizontal, not horizontal)
        self._clear_selection()
        self._resize_from_image()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def invert_colors(self) -> None:
        self._push_undo()
        self._image.invertPixels()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def clear_image(self) -> None:
        self._push_undo()
        self._image.fill(QColor(255, 255, 255))
        self._clear_selection()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def _color_within_tolerance(self, a: QColor, b: QColor) -> bool:
        if self._fill_tolerance <= 0:
            return a == b
        dr = a.red() - b.red()
        dg = a.green() - b.green()
        db = a.blue() - b.blue()
        da = a.alpha() - b.alpha()
        thr = self._fill_tolerance
        return dr * dr + dg * dg + db * db + da * da <= thr * thr * 25

    def _flood_fill(self, x: int, y: int, new_color: QColor) -> None:
        img = self._image
        w, h = img.width(), img.height()
        old = img.pixelColor(x, y)
        if old == new_color and self._fill_tolerance <= 0:
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
            if not self._color_within_tolerance(img.pixelColor(cx, cy), old):
                continue
            img.setPixelColor(cx, cy, new_color)
            q.append((cx + 1, cy))
            q.append((cx - 1, cy))
            q.append((cx, cy + 1))
            q.append((cx, cy - 1))

    def _spray_airbrush(self, ip: QPoint) -> None:
        rad = max(2, self._brush_size)
        n = max(8, rad * 4)
        p = QPainter(self._image)
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(self._fg)
        for _ in range(n):
            ang = random.random() * 6.283185307179586
            dist = random.random() * rad
            dx = int(math.cos(ang) * dist)
            dy = int(math.sin(ang) * dist)
            px, py = ip.x() + dx, ip.y() + dy
            if 0 <= px < self._image.width() and 0 <= py < self._image.height():
                p.drawEllipse(px, py, 1, 1)
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def mousePressEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        if event.button() == Qt.MouseButton.RightButton:
            if self._tool == Tool.POLYGON and self._poly_vertices:
                self._close_polygon()
                return
            self._fg, self._bg = QColor(self._bg), QColor(self._fg)
            self.colorsSwapped.emit()
            self.update()
            return
        if event.button() != Qt.MouseButton.LeftButton:
            return
        ip = self._widget_to_image(event.position())
        mods = event.modifiers()

        if self._tool == Tool.EYEDROPPER:
            c = self._image.pixelColor(ip.x(), ip.y())
            if mods & Qt.KeyboardModifier.ShiftModifier:
                self.set_bg(c)
                self.colorSampled.emit(c, True)
            else:
                self.set_fg(c)
                self.colorSampled.emit(c, False)
            return

        if self._tool == Tool.TEXT:
            self.textToolRequested.emit(ip)
            return

        if self._tool == Tool.FILL:
            self._push_undo()
            self._flood_fill(ip.x(), ip.y(), self._fg)
            self._dirty = True
            self.update()
            self.imageChanged.emit()
            return

        if self._tool == Tool.SELECT:
            self._handle_select_press(ip)
            return

        if self._tool == Tool.POLYGON:
            self._poly_vertices.append(ip)
            self.update()
            return

        if self._tool == Tool.CURVE:
            self._curve_points.append(ip)
            if len(self._curve_points) == 3:
                self._commit_curve()
            self.update()
            return

        if self._tool in (Tool.LINE, Tool.RECT, Tool.ROUND_RECT, Tool.ELLIPSE):
            self._shape_start = ip
            self._shape_end = ip
            self.update()
            return

        if self._tool == Tool.AIRBRUSH:
            if not self._airbrush_stroke_started:
                self._push_undo()
                self._airbrush_stroke_started = True
            self._drawing = True
            self._last_ip = ip
            self._spray_airbrush(ip)
            return

        self._push_undo()
        self._drawing = True
        self._last_ip = ip
        if self._tool == Tool.ERASER:
            self._stroke_to(ip, self._bg)
        else:
            self._stroke_to(ip, self._fg)

    def mouseDoubleClickEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        if event.button() == Qt.MouseButton.LeftButton and self._tool == Tool.POLYGON and self._poly_vertices:
            self._close_polygon()

    def mouseMoveEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        ip = self._widget_to_image(event.position())
        self._hover_ip = ip
        if self._tool == Tool.SELECT:
            self._handle_select_move(ip)
            return
        if self._tool in (Tool.LINE, Tool.RECT, Tool.ROUND_RECT, Tool.ELLIPSE) and self._shape_start is not None:
            self._shape_end = ip
            self.update()
            return
        if self._tool == Tool.POLYGON and self._poly_vertices:
            self.update()
            return
        if self._tool == Tool.CURVE and self._curve_points:
            self.update()
            return
        if not self._drawing or self._last_ip is None:
            return
        if self._tool == Tool.AIRBRUSH:
            self._spray_airbrush(ip)
            self._last_ip = ip
            return
        if self._tool == Tool.ERASER:
            self._stroke_to(ip, self._bg)
        else:
            self._stroke_to(ip, self._fg)
        self._last_ip = ip

    def mouseReleaseEvent(self, event: QMouseEvent) -> None:  # type: ignore[override]
        if event.button() != Qt.MouseButton.LeftButton:
            return
        ip = self._widget_to_image(event.position())
        if self._tool == Tool.SELECT:
            self._handle_select_release(ip)
            return
        if self._tool in (Tool.LINE, Tool.RECT, Tool.ROUND_RECT, Tool.ELLIPSE) and self._shape_start is not None:
            end = ip
            start = self._shape_start
            self._shape_start = None
            self._shape_end = None
            if end != start:
                self._commit_shape(start, end)
                self._dirty = True
            self.update()
            self.imageChanged.emit()
            return
        if self._tool == Tool.AIRBRUSH:
            self._drawing = False
            self._last_ip = None
            self._airbrush_stroke_started = False
            return
        self._drawing = False
        self._last_ip = None

    def keyPressEvent(self, event: QKeyEvent) -> None:  # type: ignore[override]
        if self._tool == Tool.POLYGON and event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            self._close_polygon()
            return
        if self._tool == Tool.SELECT and event.key() == Qt.Key.Key_Delete and self.has_selection():
            self.delete_selection_interior()
            return
        super().keyPressEvent(event)

    def _close_polygon(self) -> None:
        if len(self._poly_vertices) < 2:
            self._poly_vertices.clear()
            self.update()
            return
        self._push_undo()
        p = QPainter(self._image)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        w = max(1, self._brush_size // 2)
        p.setPen(QPen(self._fg, w, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        poly = QPolygon(self._poly_vertices + [self._poly_vertices[0]])
        p.drawPolyline(poly)
        p.end()
        self._poly_vertices.clear()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def _commit_curve(self) -> None:
        if len(self._curve_points) != 3:
            return
        p0, p1, p2 = self._curve_points
        self._curve_points.clear()
        self._push_undo()
        p = QPainter(self._image)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        w = max(1, self._brush_size // 2)
        pen = QPen(self._fg, w, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)
        p.setPen(pen)
        path = QPainterPath()
        path.moveTo(p0)
        path.quadTo(p1, p2)
        p.drawPath(path)
        p.end()
        self._dirty = True
        self.update()
        self.imageChanged.emit()

    def _handle_select_press(self, ip: QPoint) -> None:
        if self._sel_state == "selected" and self._sel_rect.normalized().contains(ip):
            self._push_undo()
            r = self._sel_rect.normalized()
            self._float_pix = self._image.copy(r)
            p = QPainter(self._image)
            p.fillRect(r, QColor(255, 255, 255))
            p.end()
            self._move_press_offset = ip - r.topLeft()
            self._float_tl = r.topLeft()
            self._sel_state = "moving"
            self.update()
            self.imageChanged.emit()
            return
        self._sel_state = "creating"
        self._sel_anchor = ip
        self._sel_rect = QRect(ip, ip)
        self._ensure_ants_timer()
        self.update()

    def _handle_select_move(self, ip: QPoint) -> None:
        if self._sel_state == "creating" and self._sel_anchor is not None:
            self._sel_rect = QRect(self._sel_anchor, ip).normalized()
            self.update()
            return
        if self._sel_state == "moving" and self._float_pix is not None and self._move_press_offset is not None:
            tl = ip - self._move_press_offset
            self._float_tl = tl
            self.update()

    def _handle_select_release(self, ip: QPoint) -> None:
        if self._sel_state == "creating":
            if self._sel_anchor is not None:
                self._sel_rect = QRect(self._sel_anchor, ip).normalized()
            if self._sel_rect.width() >= 2 and self._sel_rect.height() >= 2:
                self._sel_state = "selected"
            else:
                self._clear_selection()
            self._sel_anchor = None
            self.update()
            return
        if self._sel_state == "moving" and self._float_pix is not None:
            p = QPainter(self._image)
            p.drawImage(self._float_tl, self._float_pix)
            p.end()
            fw, fh = self._float_pix.width(), self._float_pix.height()
            self._sel_rect = QRect(self._float_tl, QSize(fw, fh)).normalized()
            self._float_pix = None
            self._move_press_offset = None
            self._sel_state = "selected"
            self._dirty = True
            self.update()
            self.imageChanged.emit()

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
        elif self._tool == Tool.ROUND_RECT:
            rr = min(self._round_rect_radius, r.width() // 2, r.height() // 2)
            p.drawRoundedRect(r, rr, rr)
        elif self._tool == Tool.ELLIPSE:
            p.drawEllipse(r)
        p.end()

    def paintEvent(self, event) -> None:  # type: ignore[override]
        painter = QPainter(self)
        painter.fillRect(self.rect(), QColor(120, 120, 120))
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        painter.scale(self._zoom, self._zoom)
        painter.drawImage(0, 0, self._image)

        if self._tool == Tool.SELECT and self._sel_state == "moving" and self._float_pix is not None:
            painter.drawImage(self._float_tl, self._float_pix)

        pw = max(1, self._brush_size // 2)
        pen = QPen(self._fg, pw, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)

        if self._shape_start is not None and self._shape_end is not None:
            painter.setPen(pen)
            if self._tool == Tool.LINE:
                painter.drawLine(self._shape_start, self._shape_end)
            elif self._tool == Tool.RECT:
                painter.drawRect(QRect(self._shape_start, self._shape_end).normalized())
            elif self._tool == Tool.ROUND_RECT:
                rn = QRect(self._shape_start, self._shape_end).normalized()
                rr = min(self._round_rect_radius, rn.width() // 2, rn.height() // 2)
                painter.drawRoundedRect(rn, rr, rr)
            elif self._tool == Tool.ELLIPSE:
                painter.drawEllipse(QRect(self._shape_start, self._shape_end).normalized())

        if self._tool == Tool.POLYGON and len(self._poly_vertices) >= 1:
            painter.setPen(pen)
            last = self._poly_vertices[0]
            for pt in self._poly_vertices[1:]:
                painter.drawLine(last, pt)
                last = pt
            painter.drawLine(last, self._hover_ip)

        if self._tool == Tool.CURVE:
            painter.setPen(pen)
            if len(self._curve_points) == 2:
                path = QPainterPath()
                path.moveTo(self._curve_points[0])
                path.quadTo(self._curve_points[1], self._hover_ip)
                painter.drawPath(path)
            elif len(self._curve_points) == 3:
                path = QPainterPath()
                path.moveTo(self._curve_points[0])
                path.quadTo(self._curve_points[1], self._curve_points[2])
                painter.drawPath(path)

        if self._tool == Tool.SELECT and self._sel_state in ("creating", "selected", "moving"):
            if self._sel_state == "moving" and self._float_pix is not None:
                r = QRect(self._float_tl, self._float_pix.size()).normalized()
            else:
                r = QRect(self._sel_rect).normalized()
            if not r.isEmpty():
                dash = QPen(QColor(255, 255, 255), 1, Qt.PenStyle.CustomDashLine)
                dash.setDashPattern([4, 4])
                dash.setDashOffset(self._ants_phase)
                painter.setPen(dash)
                painter.setBrush(Qt.BrushStyle.NoBrush)
                painter.drawRect(r)

        painter.end()
