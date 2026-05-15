# Lyra

**Lyra** is a desktop chat client for **local [Ollama](https://ollama.com)** inference, built with **Python 3.11+** and **PySide6 (Qt 6)**. It mirrors the behavior of [Orion](../orion): streaming replies, multiple chats, model selection, system prompt, temperature, and JSON chat history.

- **Privacy:** Conversations go to your machine only (Ollama on your chosen host, default `http://localhost:11434`).
- **Data directory:** By default Lyra uses **`~/.orion`** (same as Orion) so chats and `settings.json` are shared. To use a separate directory, set **`LYRA_DATA_DIR`** to an absolute path before launching.
- **Remote Ollama:** Set **Ollama host** in Settings (General), or set env **`OLLAMA_HOST`** (e.g. `http://192.168.1.10:11434`). The env var overrides the saved setting when present.

## Requirements

- Python **3.11+**
- [Ollama](https://ollama.com) installed and running (`ollama serve`)
- At least one model pulled (e.g. `ollama pull llama3.2`)

## Quick start

```bash
cd lyra
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **⌘N** / **Ctrl+N** | New chat |
| **⌘,** / **Ctrl+,** | Settings |
| **⌘F** / **Ctrl+F** | Focus search |
| **Esc** | Stop generation |

## Project layout

- `main.py` — entry; Fusion style + dark palette; high-DPI rounding; optional `assets/icon.png`
- `app/` — `state.py` (session + `LYRA_DATA_DIR`), `theme.py` (tokens)
- `services/` — Ollama client, chat/settings storage (Orion-compatible JSON)
- `gui/` — main window, sidebar, transcript (markdown after send), settings dialog
- `workers/` — `OllamaStreamWorker` (streaming on a `QThread`)

## Packaging (PyInstaller)

Example one-file build (from the `lyra` directory with your venv activated):

```bash
pip install pyinstaller
pyinstaller --name Lyra --windowed --noconfirm \
  --collect-all PySide6 \
  main.py
```

Adjust `--collect-all` / hidden imports if Qt plugins are missing on your platform. Test the bundle on a clean machine.

## License note

PySide6 is **LGPL**. Suitable for personal and open-source use; evaluate Qt licensing for closed-source distribution.
