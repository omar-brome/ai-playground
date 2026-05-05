#!/usr/bin/env python3

import random


def print_board(board):
    print()
    print(f" {board[0]} | {board[1]} | {board[2]} ")
    print("---+---+---")
    print(f" {board[3]} | {board[4]} | {board[5]} ")
    print("---+---+---")
    print(f" {board[6]} | {board[7]} | {board[8]} ")
    print()


def check_winner(board, marker):
    win_patterns = [
        (0, 1, 2),
        (3, 4, 5),
        (6, 7, 8),
        (0, 3, 6),
        (1, 4, 7),
        (2, 5, 8),
        (0, 4, 8),
        (2, 4, 6),
    ]
    return any(board[a] == board[b] == board[c] == marker for a, b, c in win_patterns)


def is_draw(board):
    return all(cell in ("X", "O") for cell in board)


def get_human_move(board):
    while True:
        move = input("Choose a position (1-9): ").strip()
        if not move.isdigit():
            print("Please enter a number from 1 to 9.")
            continue

        idx = int(move) - 1
        if idx < 0 or idx > 8:
            print("Position must be between 1 and 9.")
            continue

        if board[idx] in ("X", "O"):
            print("That position is already taken.")
            continue

        return idx


def get_computer_move(board, computer, human):
    available = [i for i, cell in enumerate(board) if cell not in ("X", "O")]

    # Win if possible.
    for idx in available:
        test = board[:]
        test[idx] = computer
        if check_winner(test, computer):
            return idx

    # Block opponent's win.
    for idx in available:
        test = board[:]
        test[idx] = human
        if check_winner(test, human):
            return idx

    # Prefer center, then corners, then sides.
    preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7]
    for idx in preferred:
        if idx in available:
            return idx

    return random.choice(available)


def play_round():
    board = [str(i) for i in range(1, 10)]
    human = "X"
    computer = "O"
    current = human

    print("\nYou are X. Computer is O.")
    print("Board positions are numbered 1 to 9 like this:")
    print_board(board)

    while True:
        if current == human:
            idx = get_human_move(board)
            board[idx] = human
        else:
            idx = get_computer_move(board, computer, human)
            board[idx] = computer
            print(f"Computer chooses position {idx + 1}.")

        print_board(board)

        if check_winner(board, current):
            if current == human:
                print("You win!")
            else:
                print("Computer wins!")
            return

        if is_draw(board):
            print("It's a draw!")
            return

        current = computer if current == human else human


def main():
    print("=== Tic-Tac-Toe ===")
    while True:
        play_round()
        again = input("Play again? (y/n): ").strip().lower()
        if again not in ("y", "yes"):
            print("Thanks for playing!")
            break


if __name__ == "__main__":
    main()
