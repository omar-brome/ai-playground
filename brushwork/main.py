"""Brushwork — simple Paint-style raster editor (PySide6)."""

from __future__ import annotations

import sys

from PySide6.QtWidgets import QApplication

from gui.main_window import MainWindow


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("Brushwork")
    app.setOrganizationName("ai-playground")
    w = MainWindow()
    w.show()
    raise SystemExit(app.exec())


if __name__ == "__main__":
    main()
