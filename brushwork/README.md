# Brushwork

A small **Paint-style** raster editor in **Python 3.11+** and **PySide6 (Qt 6)** — not affiliated with Microsoft.

## Features

### Tools

- **Pencil** (1 px), **Brush** / **Airbrush** (size; airbrush sprays one undo per stroke), **Eraser** (paints background)
- **Line**, **Rectangle**, **Rounded rectangle** (corner radius on toolbar), **Ellipse**
- **Polygon** — successive clicks; **Enter**, **double-click**, or **right-click** to close and stroke the outline
- **Curve** — quadratic Bézier: three clicks (start, control, end); live preview to the cursor after the second click
- **Flood fill** with optional **tolerance** (0–32) on the toolbar (0 = exact color match)
- **Eyedropper** — left-click samples into foreground; **Shift+click** samples into background
- **Text** — click opens text + font dialogs; text drawn at the click (one undo per placement)
- **Rectangular selection** — drag a region; **marching-ants** outline; drag inside to move (hole filled white); **Delete** clears the interior; **Image → Crop to selection**

### Colors

- Foreground / background with color dialogs; **right-click on the canvas** swaps them (or closes a polygon when that tool is active)

### File

- **New** (custom size), **Open** (PNG/JPEG/BMP/WebP), **Save** / **Save As**
- **Save As** — optional **JPEG quality** dialog for `.jpg` / `.jpeg`
- **Open recent** — last 8 paths (stored in `QSettings`)
- **Print** — page setup via `QPrintDialog`, image scaled to fit

### Edit / clipboard

- **Undo** / **Redo** (stack capped at 30)
- **Copy** (`Ctrl+C`) — copies the current selection when the Select tool has a region
- **Paste** (`Ctrl+V`) — pastes a **bitmap** from the system clipboard, centered on the last reported canvas pixel (status bar / hover)

### Image

- **Resize image** — width/height; optional **stretch** (full `QImage.scaled`) or top-left crop onto a new white canvas
- **Rotate 90°** CW / CCW, **Flip** horizontal / vertical, **Invert colors**, **Clear** (confirm)

### View

- **Zoom** 25%–800% from the toolbar combo (also **Ctrl++** / **Ctrl+-** and menu)
- **View → Fit to window**
- **Mouse wheel** — zoom toward cursor (scrollbar adjusted to keep the anchor stable)
- **Middle mouse drag** — pan the scroll area

### Help

- **Keyboard shortcuts** summary
- **About** — app name and Python/Qt note

## Quick start

```bash
cd brushwork
python3 -m venv .venv && source .venv/bin/activate   
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Notes

- **Wheel zoom** replaces wheel scrolling; use scrollbars or **middle-drag** to pan when zoomed in.
- Very large flood fills with high tolerance on huge canvases can be slow (BFS over pixels).
- **Deferred / not implemented:** curve beyond quadratic, filled polygons, selection copy to formats other than raster, `Escape` to cancel in-progress shapes.
