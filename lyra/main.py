"""Lyra — Qt desktop client for local Ollama."""

from __future__ import annotations

import sys

from PySide6.QtGui import QColor, QPalette
from PySide6.QtWidgets import QApplication

from app.theme import BG, CHAT_BG, SIDEBAR_BG, TEXT
from gui.main_window import MainWindow


def main() -> None:
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    pal = QPalette()
    pal.setColor(QPalette.ColorRole.Window, QColor(BG))
    pal.setColor(QPalette.ColorRole.WindowText, QColor(TEXT))
    pal.setColor(QPalette.ColorRole.Base, QColor(CHAT_BG))
    pal.setColor(QPalette.ColorRole.AlternateBase, QColor(SIDEBAR_BG))
    pal.setColor(QPalette.ColorRole.Text, QColor("#f3f4f6"))
    pal.setColor(QPalette.ColorRole.Button, QColor("#252525"))
    pal.setColor(QPalette.ColorRole.ButtonText, QColor(TEXT))
    app.setPalette(pal)

    w = MainWindow()
    w.show()
    raise SystemExit(app.exec())


if __name__ == "__main__":
    main()
