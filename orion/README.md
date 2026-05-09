# Orion

Desktop AI chat that runs **fully locally** via **[Ollama](https://ollama.com)**. Your prompts and model weights stay on your machine—no cloud APIs and no API keys. Optimized for everyday use on **macOS** (including Apple Silicon); also runs on Linux and Windows.

---

## Features

| Area | Details |
|------|---------|
| **Inference** | Streams assistant output token-by-token from Ollama |
| **Models** | Chooses from models installed in Ollama (`ollama list` / pull more as needed) |
| **Chats** | Multiple conversations, sidebar list, rename implied by first message title |
| **Controls** | System prompt (header), temperature slider, optional stop while generating |
| **History** | Saves chats as JSON under `~/.orion/chats/` |
| **Settings** | `~/.orion/settings.json` (geometry, defaults, toggles) |
| **UI** | **macOS:** classic **Tkinter** by default (works with Apple’s Tk after theme fixes; best with **python.org** Python). **Linux/Windows:** **CustomTkinter** by default. Override with `ORION_UI` (see below). |

---

## Requirements

- **Python** 3.11 or newer (3.12 / 3.13 / **3.14** from [python.org](https://www.python.org/downloads/) are all fine on macOS).
- **[Ollama](https://ollama.com)** installed and running (default API: `http://127.0.0.1:11434`).
- At least **one model** pulled, e.g. `ollama pull llama3.2`.

Python packages are listed in **`requirements.txt`** (`customtkinter`, `ollama`, `requests`, `pillow`, etc.).

---

## Installation

### 1. Ollama and a model

```bash
# Install Ollama from https://ollama.com/download — then:
ollama pull llama3.2
```

Ollama usually stays running in the background; if needed:

```bash
ollama serve
```

### 2. Python environment (recommended: virtualenv)

Using a **venv** keeps dependencies isolated and ensures you use the same interpreter you installed (especially important on macOS after adding **python.org** Python):

```bash
cd /path/to/orion
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Inside an activated venv you typically use **`python`** and **`pip`**. Outside the venv, many Macs only expose **`python3`** (there may be no `python` on `PATH`).

Global install (not recommended long-term):

```bash
python3 -m pip install -r requirements.txt
```

---

## Run

```bash
cd /path/to/orion
python main.py              # inside venv
# or
python3 main.py             # system / no venv
```

Optional launcher that prefers **python.org’s** interpreter when installed:

```bash
chmod +x scripts/run_orion.sh    # once
./scripts/run_orion.sh
```

You can force a specific interpreter:

```bash
PYTHON=/Library/Frameworks/Python.framework/Versions/Current/bin/python3 ./scripts/run_orion.sh
```

---

## UI modes (`ORION_UI`)

| Value | Behavior |
|-------|----------|
| **`auto`** (default) | **macOS (Darwin):** Tkinter-only UI (`app/tk_ui.py`). **Linux / Windows:** CustomTkinter UI (`app/app.py`). |
| **`tk`** | Always use the Tkinter UI (good fallback if CustomTkinter misbehaves). |
| **`ctk`** | Always use CustomTkinter (needs a healthy Tk; on macOS use **python.org** Python). |

Examples:

```bash
ORION_UI=ctk python3 main.py
ORION_UI=tk  python3 main.py
```

---

## macOS: Python, Tcl/Tk, and “bad” UI

Apple’s **Command Line Tools** Python (`Library/Developer/CommandLineTools/...`) ships with **Apple’s Tcl/Tk**, which is deprecated and often breaks **CustomTkinter** (blank white window) or mis-draws colors on classic widgets.

**Recommended:** install **[Python from python.org](https://www.python.org/downloads/)** and put it **first** on your `PATH` (installer option “Add python.org to PATH”, or add manually in `~/.zshrc`):

```bash
export PATH="/Library/Frameworks/Python.framework/Versions/Current/bin:$PATH"
```

Verify:

```bash
which python3
python3 -c "import sys; print(sys.executable)"
```

You want a path under **`/Library/Frameworks/Python.framework/`**, not **`CommandLineTools`**.

Then **recreate your venv** with that `python3` and reinstall dependencies.

Optional Tk version check:

```bash
python3 -c "import tkinter as tk; r=tk.Tk(); r.withdraw(); print(r.tk.call('info', 'patchlevel')); r.destroy()"
```

Terminal noise such as **urllib / LibreSSL** warnings is unrelated to the GUI.

---

## Using Orion

1. Start **Ollama** (if it is not already running).
2. Open Orion; pick a **model** from the dropdown (populated from `ollama list`).
3. Edit **system prompt** and **temperature** as needed.
4. Type in **Message** and press **Send** (Enter sends; use Shift+Enter if you need a newline depending on platform—same as typical chat apps).
5. Use **+ New chat**, select chats in the sidebar, **Delete chat** to remove the selected conversation.
6. **Settings info** shows where settings live on disk (full modal UI is primarily in the CustomTkinter build).

Data locations:

| Path | Purpose |
|------|---------|
| `~/.orion/chats/*.json` | Per-chat history |
| `~/.orion/settings.json` | App preferences |

---

## Recommended models (examples — Apple Silicon friendly)

| Model | Approx size | Notes |
|-------|-------------|--------|
| `llama3.2:3b` | ~2 GB | Fast |
| `llama3.2` (latest) | ~4 GB | Balanced |
| `gemma3:4b` | ~3 GB | Reasoning |
| `deepseek-r1:7b` | ~5 GB | Heavier reasoning |
| `qwen2.5-coder:7b` | ~5 GB | Code |
| `mistral:7b` | ~4 GB | General |

```bash
ollama pull llama3.2
```

---

## Project layout

```
orion/
├── main.py              # Entry: picks UI by ORION_UI + platform
├── requirements.txt
├── scripts/
│   └── run_orion.sh     # Prefer Frameworks python.org binary
├── app/
│   ├── app.py           # CustomTkinter shell (OrionApp)
│   ├── tk_ui.py         # Pure Tkinter UI (OrionTkApp)
│   ├── theme.py
│   └── state.py
├── components/          # Shared UI pieces (used by CTk app)
├── services/
│   ├── ollama_service.py   # Ollama Client + streaming
│   ├── chat_storage.py
│   └── settings_storage.py
└── assets/
```

The **ollama** Python package connects via **`ollama.Client(host=...)`** and **`client.chat(...)`** (the `host=` argument belongs on the client, not on each `chat()` call).

---

## Troubleshooting

| Symptom | Things to try |
|---------|----------------|
| Blank / white CustomTkinter window | Use **`ORION_UI=tk`** or install **python.org** Python and try **`ORION_UI=ctk`** again |
| Invisible text in inputs | Usually fixed in `tk_ui.py` via Tk option database on Darwin; ensure latest code |
| **`Connection refused` / no reply** | Run **`ollama serve`**, confirm **`ollama list`** in a terminal |
| **No models in dropdown** | `ollama pull <model>`, then restart or wait for the list to refresh |
| **`unexpected keyword argument 'host'`** | Update Orion (uses `Client(host=...)`) and **`pip install -U ollama`** |

---

## License

MIT (adjust as you prefer).
