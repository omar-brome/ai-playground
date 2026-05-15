# Brushwork

A small **Microsoft Paint–style** raster editor in **Python 3.11+** and **PySide6 (Qt 6)**.

## Features

- **Tools:** pencil (1 px), brush (size), eraser (paints background color), line, rectangle, ellipse, flood fill
- **Colors:** foreground / background with color dialogs; **right-click on the canvas** swaps them
- **File:** New (custom size), Open (PNG/JPEG/BMP/WebP), Save / Save As
- **Edit:** Undo / Redo (per-stroke stack, capped)
- **View:** zoom 25%–800%, scrollable canvas, status bar coordinates

## Quick start

```bash
cd brushwork
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Notes

- Not affiliated with Microsoft. For learning and local use.
- Very large flood fills on huge canvases can be slow (simple BFS).
