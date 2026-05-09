# Pitch

Desktop **football (soccer) video analysis** using Python, CustomTkinter, OpenCV, and YOLOv8. Analyzes match footage with AI overlays: detections, trails, heatmap, simplified offside line, and live stats. Optimized for **Apple Silicon** (PyTorch **MPS**).

## PREREQUISITES

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install ultralytics opencv-python customtkinter pillow numpy torch torchvision scikit-learn
# or: pip install -r requirements.txt

# 3. Verify MPS (Apple Silicon GPU) is available
python -c "import torch; print(torch.backends.mps.is_available())"
# Should print: True

# 4. Download YOLOv8 model (auto-downloads on first run)
# yolov8n.pt  → nano, fastest
# yolov8s.pt  → small, good balance  ← recommended
# yolov8m.pt  → medium, most accurate
```

**First thing to run after setup:**

```bash
python -c "import torch; print(torch.backends.mps.is_available())"
```

Must print `True` on Apple Silicon with a proper PyTorch install; otherwise inference falls back to CPU.

## Quick start

```bash
cd pitch
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py
```

The window appears immediately; **YOLO weights load when you first open a video or webcam** (first launch may download `yolov8*.pt` — watch the terminal for progress).

Optional: `python main.py --model yolov8n.pt` or `--source /path/to/video.mp4`.

## What you get in the app

- Open **video files** or **Mac webcam**, play/pause, speed, scrub timeline (file sources).
- Toggles: **players**, **ball**, **referee** (heuristic third jersey cluster), **trails**, **heatmap**, **offside line**, **possession** bar on frame.
- Model dropdown (**nano / small / medium**) and **confidence** slider.
- **Live stats** panel + **FPS** on video; **Export** / **Save Report** writes a JSON summary.

## Tech stack

- Python 3.11+
- CustomTkinter — UI
- OpenCV — video, drawing
- Ultralytics YOLOv8 — detection (person, sports ball COCO classes)
- PyTorch + MPS/CUDA/CPU
- NumPy, Pillow, scikit-learn (K-means team colors)

## Sample footage

See [`sample_footage/README.md`](sample_footage/README.md). Aerial or broadcast-style clips work best; ground-level phone footage is usable but harder for the generic COCO model.

## Limitations (v1)

- **Teams:** Jersey colors are clustered per frame—labels can flicker under lighting changes.
- **Goals:** Goal zones are heuristic strips at the top/bottom of the frame (broadcast assumption); not pitch-calibrated.
- **Offside line:** Simplified visualization only—not match-official accuracy.
- **Referee:** No COCO “referee” class; with **Referee** enabled, a third cluster heuristics smallest group as officials.

## Troubleshooting

- **Blank / no window for a long time:** Older builds blocked on YOLO before the UI; current code shows the window first. If you changed nothing and still wait forever, check the terminal for download or load messages.
- **Python / Tk on macOS:** Install Python from [python.org](https://www.python.org/downloads/) if the window misbehaves with Command Line Tools Python only.

## Project layout

```
pitch/
├── main.py
├── requirements.txt
├── README.md
├── models/           # optional; YOLO weights often auto-download to cwd
├── app/
├── components/
├── services/
├── assets/
└── sample_footage/
```
