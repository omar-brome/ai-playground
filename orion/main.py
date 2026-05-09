"""Entry point for Orion — local Ollama desktop client."""

from __future__ import annotations

import os
import platform


def main() -> None:
    ui = os.environ.get("ORION_UI", "auto").strip().lower()
    use_ctk = ui == "ctk" or (ui == "auto" and platform.system() != "Darwin")

    if use_ctk:
        import customtkinter as ctk

        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        from app.app import OrionApp

        app = OrionApp()
    else:
        from app.tk_ui import OrionTkApp

        app = OrionTkApp()

    app.mainloop()


if __name__ == "__main__":
    main()
