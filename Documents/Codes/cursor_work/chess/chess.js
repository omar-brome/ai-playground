const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const resetBtn = document.getElementById("resetBtn");

const PIECES = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
};

const START_BOARD = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
];

let board = [];
let turn = "w";
let selected = null;
let legalMoves = [];

function resetGame() {
  board = START_BOARD.map((row) => [...row]);
  turn = "w";
  selected = null;
  legalMoves = [];
  drawBoard();
  updateTurnText();
}

function updateTurnText() {
  turnText.textContent = turn === "w" ? "White to move" : "Black to move";
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getColor(piece) {
  if (!piece) return null;
  return piece[0];
}

function samePos(a, b) {
  return a && b && a.r === b.r && a.c === b.c;
}

function pushIfValid(moves, r, c, color) {
  if (!inBounds(r, c)) return false;
  const target = board[r][c];
  if (!target) {
    moves.push({ r, c, capture: false });
    return true;
  }
  if (getColor(target) !== color) {
    moves.push({ r, c, capture: true });
  }
  return false;
}

function lineMoves(r, c, color, dirs) {
  const moves = [];
  dirs.forEach(([dr, dc]) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const keepGoing = pushIfValid(moves, nr, nc, color);
      if (!keepGoing) break;
      nr += dr;
      nc += dc;
    }
  });
  return moves;
}

function pawnMoves(r, c, color) {
  const moves = [];
  const dir = color === "w" ? -1 : 1;
  const startRow = color === "w" ? 6 : 1;

  if (inBounds(r + dir, c) && !board[r + dir][c]) {
    moves.push({ r: r + dir, c, capture: false });
    if (r === startRow && !board[r + 2 * dir][c]) {
      moves.push({ r: r + 2 * dir, c, capture: false });
    }
  }

  [-1, 1].forEach((dc) => {
    const nr = r + dir;
    const nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = board[nr][nc];
    if (target && getColor(target) !== color) {
      moves.push({ r: nr, c: nc, capture: true });
    }
  });

  return moves;
}

function knightMoves(r, c, color) {
  const moves = [];
  const steps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  steps.forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = board[nr][nc];
    if (!target || getColor(target) !== color) {
      moves.push({ r: nr, c: nc, capture: !!target });
    }
  });
  return moves;
}

function kingMoves(r, c, color) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = board[nr][nc];
      if (!target || getColor(target) !== color) {
        moves.push({ r: nr, c: nc, capture: !!target });
      }
    }
  }
  return moves;
}

function pieceMoves(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];

  if (type === "p") return pawnMoves(r, c, color);
  if (type === "r") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  if (type === "b") return lineMoves(r, c, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  if (type === "q") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  if (type === "n") return knightMoves(r, c, color);
  if (type === "k") return kingMoves(r, c, color);
  return [];
}

function handleSquareClick(r, c) {
  const clickedPiece = board[r][c];

  if (selected) {
    const move = legalMoves.find((m) => m.r === r && m.c === c);
    if (move) {
      makeMove(selected.r, selected.c, r, c);
      return;
    }
  }

  if (clickedPiece && getColor(clickedPiece) === turn) {
    selected = { r, c };
    legalMoves = pieceMoves(r, c);
  } else {
    selected = null;
    legalMoves = [];
  }
  drawBoard();
}

function promoteIfNeeded(r, c) {
  const piece = board[r][c];
  if (!piece || piece[1] !== "p") return;
  if ((piece[0] === "w" && r === 0) || (piece[0] === "b" && r === 7)) {
    board[r][c] = `${piece[0]}q`;
  }
}

function makeMove(fromR, fromC, toR, toC) {
  board[toR][toC] = board[fromR][fromC];
  board[fromR][fromC] = "";
  promoteIfNeeded(toR, toC);
  turn = turn === "w" ? "b" : "w";
  selected = null;
  legalMoves = [];
  drawBoard();
  updateTurnText();
}

function drawBoard() {
  boardEl.innerHTML = "";

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement("button");
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.type = "button";

      if (samePos(selected, { r, c })) {
        square.classList.add("selected");
      }

      const move = legalMoves.find((m) => m.r === r && m.c === c);
      if (move) {
        square.classList.add("possible");
        if (move.capture) square.classList.add("capture");
      }

      const piece = board[r][c];
      square.textContent = piece ? PIECES[piece] : "";
      square.addEventListener("click", () => handleSquareClick(r, c));
      boardEl.appendChild(square);
    }
  }
}

resetBtn.addEventListener("click", resetGame);
resetGame();
