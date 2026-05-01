const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const resetBtn = document.getElementById("resetBtn");
const gameOverBannerEl = document.getElementById("gameOverBanner");

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
let gameOver = false;

function resetGame() {
  board = START_BOARD.map((row) => [...row]);
  turn = "w";
  selected = null;
  legalMoves = [];
  gameOver = false;
  gameOverBannerEl.hidden = true;
  gameOverBannerEl.textContent = "";
  drawBoard();
  updateTurnText();
}

function updateTurnText() {
  const checkSuffix = isKingInCheck(turn, board) ? " - Check!" : "";
  turnText.textContent = turn === "w" ? `White to move${checkSuffix}` : `Black to move${checkSuffix}`;
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
  if (getColor(target) !== color && target[1] !== "k") {
    moves.push({ r, c, capture: true });
  }
  return false;
}

function lineMoves(r, c, color, dirs, state = board) {
  const moves = [];
  dirs.forEach(([dr, dc]) => {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const keepGoing = pushIfValidOnBoard(moves, nr, nc, color, state);
      if (!keepGoing) break;
      nr += dr;
      nc += dc;
    }
  });
  return moves;
}

function pushIfValidOnBoard(moves, r, c, color, state) {
  if (!inBounds(r, c)) return false;
  const target = state[r][c];
  if (!target) {
    moves.push({ r, c, capture: false });
    return true;
  }
  if (getColor(target) !== color && target[1] !== "k") {
    moves.push({ r, c, capture: true });
  }
  return false;
}

function pawnMoves(r, c, color, state = board) {
  const moves = [];
  const dir = color === "w" ? -1 : 1;
  const startRow = color === "w" ? 6 : 1;

  if (inBounds(r + dir, c) && !state[r + dir][c]) {
    moves.push({ r: r + dir, c, capture: false });
    if (r === startRow && !state[r + 2 * dir][c]) {
      moves.push({ r: r + 2 * dir, c, capture: false });
    }
  }

  [-1, 1].forEach((dc) => {
    const nr = r + dir;
    const nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = state[nr][nc];
    if (target && getColor(target) !== color && target[1] !== "k") {
      moves.push({ r: nr, c: nc, capture: true });
    }
  });

  return moves;
}

function knightMoves(r, c, color, state = board) {
  const moves = [];
  const steps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  steps.forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = state[nr][nc];
    if (!target || (getColor(target) !== color && target[1] !== "k")) {
      moves.push({ r: nr, c: nc, capture: !!target });
    }
  });
  return moves;
}

function kingMoves(r, c, color, state = board) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = state[nr][nc];
      if (!target || (getColor(target) !== color && target[1] !== "k")) {
        moves.push({ r: nr, c: nc, capture: !!target });
      }
    }
  }
  return moves;
}

function pieceMoves(r, c, state = board) {
  const piece = state[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];

  if (type === "p") return pawnMoves(r, c, color, state);
  if (type === "r") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1]], state);
  if (type === "b") return lineMoves(r, c, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]], state);
  if (type === "q") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], state);
  if (type === "n") return knightMoves(r, c, color, state);
  if (type === "k") return kingMoves(r, c, color, state);
  return [];
}

function cloneBoard(state) {
  return state.map((row) => [...row]);
}

function simulateMove(state, fromR, fromC, toR, toC) {
  const next = cloneBoard(state);
  next[toR][toC] = next[fromR][fromC];
  next[fromR][fromC] = "";
  const movedPiece = next[toR][toC];
  if (movedPiece && movedPiece[1] === "p" && ((movedPiece[0] === "w" && toR === 0) || (movedPiece[0] === "b" && toR === 7))) {
    next[toR][toC] = `${movedPiece[0]}q`;
  }
  return next;
}

function findKing(color, state) {
  const king = `${color}k`;
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (state[r][c] === king) return { r, c };
    }
  }
  return null;
}

function isSquareAttacked(targetR, targetC, defenderColor, state) {
  const attackerColor = defenderColor === "w" ? "b" : "w";
  const pawnDir = attackerColor === "w" ? -1 : 1;

  const pawnAttackRows = targetR - pawnDir;
  [-1, 1].forEach(() => {});
  for (const dc of [-1, 1]) {
    const r = pawnAttackRows;
    const c = targetC + dc;
    if (inBounds(r, c) && state[r][c] === `${attackerColor}p`) return true;
  }

  const knightSteps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightSteps) {
    const r = targetR + dr;
    const c = targetC + dc;
    if (inBounds(r, c) && state[r][c] === `${attackerColor}n`) return true;
  }

  const rookDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dr, dc] of rookDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const piece = state[r][c];
      if (piece) {
        if (piece[0] === attackerColor && (piece[1] === "r" || piece[1] === "q")) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  const bishopDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [dr, dc] of bishopDirs) {
    let r = targetR + dr;
    let c = targetC + dc;
    while (inBounds(r, c)) {
      const piece = state[r][c];
      if (piece) {
        if (piece[0] === attackerColor && (piece[1] === "b" || piece[1] === "q")) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = targetR + dr;
      const c = targetC + dc;
      if (inBounds(r, c) && state[r][c] === `${attackerColor}k`) return true;
    }
  }

  return false;
}

function isKingInCheck(color, state) {
  const kingPos = findKing(color, state);
  if (!kingPos) return false;
  return isSquareAttacked(kingPos.r, kingPos.c, color, state);
}

function legalMovesForPiece(r, c, state = board) {
  const piece = state[r][c];
  if (!piece) return [];
  const color = piece[0];
  const pseudoMoves = pieceMoves(r, c, state);
  return pseudoMoves.filter((move) => {
    const next = simulateMove(state, r, c, move.r, move.c);
    return !isKingInCheck(color, next);
  });
}

function hasAnyLegalMove(color, state = board) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = state[r][c];
      if (piece && piece[0] === color && legalMovesForPiece(r, c, state).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function finishGame(message) {
  gameOver = true;
  selected = null;
  legalMoves = [];
  turnText.textContent = message;
  gameOverBannerEl.textContent = `Game Over - ${message}`;
  gameOverBannerEl.hidden = false;
  drawBoard();
}

function handleSquareClick(r, c) {
  if (gameOver) return;
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
    legalMoves = legalMovesForPiece(r, c);
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
  selected = null;
  legalMoves = [];

  turn = turn === "w" ? "b" : "w";

  const inCheck = isKingInCheck(turn, board);
  const hasMove = hasAnyLegalMove(turn, board);

  if (inCheck && !hasMove) {
    const winner = turn === "w" ? "Black" : "White";
    finishGame(`Checkmate! ${winner} wins!`);
    return;
  }

  if (!inCheck && !hasMove) {
    finishGame("Stalemate! Draw.");
    return;
  }

  drawBoard();
  updateTurnText();
}

function drawBoard() {
  boardEl.classList.toggle("game-over", gameOver);
  boardEl.innerHTML = "";
  const checkedKingPos = isKingInCheck(turn, board) ? findKing(turn, board) : null;

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement("button");
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.type = "button";

      if (samePos(checkedKingPos, { r, c })) {
        square.classList.add("checked-king");
      }

      if (samePos(selected, { r, c })) {
        square.classList.add("selected");
      }

      const move = legalMoves.find((m) => m.r === r && m.c === c);
      if (move) {
        square.classList.add("possible");
        if (move.capture) square.classList.add("capture");
      }

      const piece = board[r][c];
      if (piece) {
        square.classList.add(piece[0] === "w" ? "piece-white" : "piece-black");
      }
      square.textContent = piece ? PIECES[piece] : "";
      square.addEventListener("click", () => handleSquareClick(r, c));
      boardEl.appendChild(square);
    }
  }
}

resetBtn.addEventListener("click", resetGame);
resetGame();
