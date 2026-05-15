# Chess

A browser-only chess game (HTML, CSS, JavaScript). Open [`chess.html`](chess.html) in a browser (double-click or serve the folder with any static server).

## How to play

- Select your side’s piece, then click a highlighted square to move.
- **Promotion**: after a pawn reaches the last rank, pick queen, rook, bishop, or knight in the dialog (or press **Escape** / **Cancel** to close without moving—your selection step is cancelled).
- **Undo** reverts the last move (including after checkmate or draw outcomes).
- **Flip board** swaps viewing orientation (coordinates update with the flip).

## Keyboard

- **Arrow keys** move focus across squares (orientation respects flip).
- **Enter** or **Space** activates the focused square (same as click).
- **Escape** closes the promotion dialog.

## Rules implemented

- Legal moves only (king may not move into check; pinned pieces respected).
- Castling (kingside and queenside), with correct loss of rights when king or rook moves or a rook is captured on its home square.
- En passant when the last move was a double pawn push.
- Promotion with piece choice (not queen-only).
- Check, checkmate, and stalemate.
- Draws: **50-move rule**, **threefold repetition** (board + side to move + castling rights + en passant square), and **insufficient material** (standard automatic cases such as bare kings, king vs king + single minor, knight vs knight, same-colored bishops).

## Accessibility

- Board uses `role="grid"`; squares use `role="gridcell"`, row/column indices, and descriptive `aria-label`s.

## Files

| File        | Role                                      |
| ----------- | ----------------------------------------- |
| `chess.html`| Structure, promotion dialog, controls     |
| `chess.css` | Layout, board themes, modal styling       |
| `chess.js`  | Rules engine and UI logic                 |

There is no build step or package manager for this folder.
