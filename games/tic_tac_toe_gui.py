#!/usr/bin/env python3

import tkinter as tk
from tkinter import messagebox


class TicTacToeGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Tic-Tac-Toe")
        self.root.geometry("430x560")
        self.root.configure(bg="#0f172a")
        self.root.resizable(False, False)

        self.current_player = "X"
        self.game_over = False
        self.board = [""] * 9
        self.buttons = []
        self.winning_combo = None

        self.title_label = tk.Label(
            root,
            text="Tic-Tac-Toe",
            font=("Helvetica", 28, "bold"),
            fg="#e2e8f0",
            bg="#0f172a",
        )
        self.title_label.pack(pady=(20, 10))

        self.status_label = tk.Label(
            root,
            text="Player X's turn",
            font=("Helvetica", 16, "bold"),
            fg="#38bdf8",
            bg="#0f172a",
        )
        self.status_label.pack(pady=(0, 15))

        self.grid_frame = tk.Frame(root, bg="#0f172a")
        self.grid_frame.pack(pady=10)

        self.create_board_buttons()

        self.reset_btn = tk.Button(
            root,
            text="New Game",
            font=("Helvetica", 14, "bold"),
            bg="#22c55e",
            fg="#052e16",
            activebackground="#16a34a",
            activeforeground="#052e16",
            relief="flat",
            bd=0,
            padx=20,
            pady=10,
            command=self.reset_game,
            cursor="hand2",
        )
        self.reset_btn.pack(pady=28)

    def create_board_buttons(self):
        for idx in range(9):
            btn = tk.Button(
                self.grid_frame,
                text="",
                width=5,
                height=2,
                font=("Helvetica", 30, "bold"),
                bg="#1e293b",
                fg="#f8fafc",
                activebackground="#334155",
                activeforeground="#f8fafc",
                relief="flat",
                bd=0,
                cursor="hand2",
                command=lambda i=idx: self.on_cell_clicked(i),
            )
            row = idx // 3
            col = idx % 3
            btn.grid(row=row, column=col, padx=8, pady=8, ipadx=8, ipady=8)
            self.buttons.append(btn)

    def on_cell_clicked(self, idx):
        if self.game_over or self.board[idx]:
            return

        self.board[idx] = self.current_player
        self.buttons[idx]["text"] = self.current_player
        self.buttons[idx]["fg"] = "#38bdf8" if self.current_player == "X" else "#f472b6"

        winner, combo = self.check_winner()
        if winner:
            self.game_over = True
            self.winning_combo = combo
            self.highlight_winner(combo)
            self.status_label.config(
                text=f"Player {winner} wins!",
                fg="#facc15",
            )
            self.show_end_dialog(f"Player {winner} wins! 🎉")
            return

        if self.is_draw():
            self.game_over = True
            self.status_label.config(text="It's a draw!", fg="#fbbf24")
            self.show_end_dialog("It's a draw! 🤝")
            return

        self.current_player = "O" if self.current_player == "X" else "X"
        turn_color = "#38bdf8" if self.current_player == "X" else "#f472b6"
        self.status_label.config(text=f"Player {self.current_player}'s turn", fg=turn_color)

    def check_winner(self):
        winning_patterns = [
            (0, 1, 2),
            (3, 4, 5),
            (6, 7, 8),
            (0, 3, 6),
            (1, 4, 7),
            (2, 5, 8),
            (0, 4, 8),
            (2, 4, 6),
        ]

        for a, b, c in winning_patterns:
            if self.board[a] and self.board[a] == self.board[b] == self.board[c]:
                return self.board[a], (a, b, c)
        return None, None

    def is_draw(self):
        return all(cell != "" for cell in self.board)

    def highlight_winner(self, combo):
        for i in combo:
            self.buttons[i].config(bg="#facc15", fg="#111827", activebackground="#facc15")

    def show_end_dialog(self, message):
        play_again = messagebox.askyesno("Game Over", f"{message}\n\nPlay again?")
        if play_again:
            self.reset_game()

    def reset_game(self):
        self.current_player = "X"
        self.game_over = False
        self.board = [""] * 9
        self.winning_combo = None
        self.status_label.config(text="Player X's turn", fg="#38bdf8")

        for btn in self.buttons:
            btn.config(
                text="",
                bg="#1e293b",
                fg="#f8fafc",
                activebackground="#334155",
                activeforeground="#f8fafc",
            )


def main():
    root = tk.Tk()
    TicTacToeGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
