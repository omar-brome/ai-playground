const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const resetBtn = document.getElementById("resetBtn");
const undoBtn = document.getElementById("undoBtn");
const flipBtn = document.getElementById("flipBtn");
const gameOverBannerEl = document.getElementById("gameOverBanner");
const promotionBackdrop = document.getElementById("promotionBackdrop");
const promotionOptions = document.getElementById("promotionOptions");
const promotionCancelBtn = document.getElementById("promotionCancelBtn");
const fileLabelsTop = document.getElementById("fileLabelsTop");
const fileLabelsBottom = document.getElementById("fileLabelsBottom");
const rankLabelsLeft = document.getElementById("rankLabelsLeft");
const rankLabelsRight = document.getElementById("rankLabelsRight");

const PIECES = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
};

const PIECE_NAMES = {
  k: "King", q: "Queen", r: "Rook", b: "Bishop", n: "Knight", p: "Pawn"
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

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

function initialCastling() {
  return { w: { k: true, q: true }, b: { k: true, q: true } };
}

let board = [];
let turn = "w";
let castling = initialCastling();
let enPassantTarget = null;
let halfmoveClock = 0;
/** @type {Map<string, number>} */
let positionCounts = new Map();

let selected = null;
/** @type {Array<{ r: number, c: number, capture: boolean, promotion?: string, castle?: string, enPassant?: boolean, doublePush?: boolean }>} */
let legalMoves = [];
let gameOver = false;
let boardFlipped = false;

/** @type {{ board: string[][], turn: string, castling: ReturnType<typeof initialCastling>, enPassantTarget: { r: number, c: number } | null, halfmoveClock: number, positionCounts: Map<string, number>, gameOver: boolean }[]} */
let history = [];

let pendingPromotion = null;

/** @type {{ r: number, c: number } | null} */
let focusSquare = { r: 7, c: 4 };

function cloneCastling(c) {
  return { w: { ...c.w }, b: { ...c.b } };
}

function clonePositionCounts(map) {
  return new Map(map);
}

function resetGame() {
  board = START_BOARD.map((row) => [...row]);
  turn = "w";
  castling = initialCastling();
  enPassantTarget = null;
  halfmoveClock = 0;
  positionCounts = new Map();
  selected = null;
  legalMoves = [];
  gameOver = false;
  history = [];
  pendingPromotion = null;
  focusSquare = { r: 7, c: 4 };
  gameOverBannerEl.hidden = true;
  gameOverBannerEl.textContent = "";
  promotionBackdrop.hidden = true;
  promotionOptions.innerHTML = "";
  pendingPromotion = null;
  seedInitialPositionCount();
  drawBoard();
  updateTurnText();
}

function seedInitialPositionCount() {
  const key = positionSignature(board, "w", castling, enPassantTarget);
  positionCounts.set(key, 1);
}

function updateTurnText() {
  if (gameOver) return;
  const checkSuffix = isKingInCheck(turn, board) ? " — Check" : "";
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

function pawnMoves(r, c, color, state = board, epTarget = enPassantTarget) {
  const moves = [];
  const dir = color === "w" ? -1 : 1;
  const startRow = color === "w" ? 6 : 1;
  const promoRank = color === "w" ? 0 : 7;

  const pushPromotions = (toR, toC, capture) => {
    if (toR === promoRank) {
      ["q", "r", "b", "n"].forEach((promotion) => {
        moves.push({ r: toR, c: toC, capture, promotion });
      });
    } else {
      moves.push({ r: toR, c: toC, capture });
    }
  };

  const oneAhead = r + dir;
  if (inBounds(oneAhead, c) && !state[oneAhead][c]) {
    pushPromotions(oneAhead, c, false);
    const twoAhead = r + 2 * dir;
    if (r === startRow && inBounds(twoAhead, c) && !state[twoAhead][c]) {
      moves.push({ r: twoAhead, c, capture: false, doublePush: true });
    }
  }

  [-1, 1].forEach((dc) => {
    const nr = r + dir;
    const nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = state[nr][nc];
    if (target && getColor(target) !== color && target[1] !== "k") {
      pushPromotions(nr, nc, true);
      return;
    }
    if (
      epTarget &&
      epTarget.r === nr &&
      epTarget.c === nc &&
      !target
    ) {
      moves.push({ r: nr, c: nc, capture: true, enPassant: true });
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

function kingMoves(r, c, color, state = board, castleRights = castling) {
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

  const piece = state[r][c];
  if (!piece || piece[1] !== "k") return moves;

  const homeRank = color === "w" ? 7 : 0;
  if (r !== homeRank || c !== 4) return moves;

  if (!isKingInCheck(color, state)) {
    if (castleRights[color].k) {
      if (
        !state[r][5] &&
        !state[r][6] &&
        state[r][7] === `${color}r` &&
        !isSquareAttacked(r, 5, color, state) &&
        !isSquareAttacked(r, 6, color, state)
      ) {
        moves.push({ r, c: 6, capture: false, castle: "k" });
      }
    }
    if (castleRights[color].q) {
      if (
        !state[r][3] &&
        !state[r][2] &&
        !state[r][1] &&
        state[r][0] === `${color}r` &&
        !isSquareAttacked(r, 3, color, state) &&
        !isSquareAttacked(r, 2, color, state)
      ) {
        moves.push({ r, c: 2, capture: false, castle: "q" });
      }
    }
  }

  return moves;
}

function pieceMoves(r, c, state = board, opts = {}) {
  const castleRights = opts.castling ?? castling;
  const epTarget = opts.enPassantTarget !== undefined ? opts.enPassantTarget : enPassantTarget;

  const piece = state[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];

  if (type === "p") return pawnMoves(r, c, color, state, epTarget);
  if (type === "r") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1]], state);
  if (type === "b") return lineMoves(r, c, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]], state);
  if (type === "q") return lineMoves(r, c, color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], state);
  if (type === "n") return knightMoves(r, c, color, state);
  if (type === "k") return kingMoves(r, c, color, state, castleRights);
  return [];
}

function cloneBoard(state) {
  return state.map((row) => [...row]);
}

function applyMoveToBoard(state, fromR, fromC, move) {
  const next = cloneBoard(state);
  const piece = next[fromR][fromC];
  if (!piece) return next;

  if (move.castle === "k") {
    next[fromR][fromC] = "";
    next[fromR][6] = piece;
    next[fromR][5] = next[fromR][7];
    next[fromR][7] = "";
    return next;
  }

  if (move.castle === "q") {
    next[fromR][fromC] = "";
    next[fromR][2] = piece;
    next[fromR][3] = next[fromR][0];
    next[fromR][0] = "";
    return next;
  }

  let placed = piece;
  if (move.promotion) {
    placed = `${piece[0]}${move.promotion}`;
  }

  next[fromR][fromC] = "";

  if (move.enPassant) {
    const dir = piece[0] === "w" ? 1 : -1;
    const capR = move.r + dir;
    next[capR][move.c] = "";
  }

  next[move.r][move.c] = placed;
  return next;
}

function simulateMove(state, fromR, fromC, move) {
  return applyMoveToBoard(state, fromR, fromC, move);
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

function legalMovesForPiece(r, c, state = board, opts = {}) {
  const piece = state[r][c];
  if (!piece) return [];
  const color = piece[0];
  const pseudo = pieceMoves(r, c, state, opts);
  return pseudo.filter((move) => {
    const next = simulateMove(state, r, c, move);
    return !isKingInCheck(color, next);
  });
}

function hasAnyLegalMove(color, state = board, opts = {}) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = state[r][c];
      if (piece && piece[0] === color && legalMovesForPiece(r, c, state, opts).length > 0) {
        return true;
      }
    }
  }
  return false;
}

function squareColorIndex(r, c) {
  return (r + c) % 2 === 0 ? "light" : "dark";
}

function bishopSquareHue(r, c) {
  return squareColorIndex(r, c);
}

function hasInsufficientMaterial(state) {
  const coords = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = state[r][c];
      if (p && p[1] !== "k") coords.push({ r, c, p });
    }
  }

  if (coords.length === 0) return true;

  if (coords.length === 1) {
    const t = coords[0].p[1];
    return t === "n" || t === "b";
  }

  if (coords.length === 2) {
    const [a, b] = coords;
    if (a.p[0] !== b.p[0]) {
      const types = [a.p[1], b.p[1]].sort().join("");
      if (types === "nn") return true;
      if (types === "bb") {
        return bishopSquareHue(a.r, a.c) === bishopSquareHue(b.r, b.c);
      }
    }
  }

  return false;
}

function positionSignature(state, sideToMove, castle, ep) {
  let flat = "";
  for (let r = 0; r < 8; r += 1) {
    flat += state[r].join("") + "/";
  }
  const ck = `w${castle.w.k ? "K" : ""}${castle.w.q ? "Q" : ""}b${castle.b.k ? "k" : ""}${castle.b.q ? "q" : ""}`;
  const epk = ep ? `${ep.r}${ep.c}` : "-";
  return `${flat}|${sideToMove}|${ck}|${epk}`;
}

function peekCapturedPiece(state, fromR, fromC, move) {
  if (move.enPassant) {
    const dir = state[fromR][fromC][0] === "w" ? 1 : -1;
    return state[move.r + dir][move.c] || "";
  }
  return state[move.r][move.c] || "";
}

function updateCastlingRightsFromMove(fromR, fromC, move, captured, nextCastling) {
  const piece = board[fromR][fromC];
  const color = piece[0];

  if (piece[1] === "k") {
    nextCastling[color].k = false;
    nextCastling[color].q = false;
  }

  if (piece[1] === "r") {
    if (fromR === 7 && fromC === 0) nextCastling.w.q = false;
    if (fromR === 7 && fromC === 7) nextCastling.w.k = false;
    if (fromR === 0 && fromC === 0) nextCastling.b.q = false;
    if (fromR === 0 && fromC === 7) nextCastling.b.k = false;
  }

  if (captured === "wr") {
    if (move.r === 7 && move.c === 0) nextCastling.w.q = false;
    if (move.r === 7 && move.c === 7) nextCastling.w.k = false;
  }
  if (captured === "br") {
    if (move.r === 0 && move.c === 0) nextCastling.b.q = false;
    if (move.r === 0 && move.c === 7) nextCastling.b.k = false;
  }
}

function nextEnPassantTarget(fromR, fromC, piece, move) {
  if (piece[1] === "p" && move.doublePush) {
    const dir = piece[0] === "w" ? -1 : 1;
    return { r: fromR + dir, c: fromC };
  }
  return null;
}

function advanceHalfmoveClock(piece, captured, move) {
  const reset = piece[1] === "p" || !!captured || move.enPassant;
  return reset ? 0 : halfmoveClock + 1;
}

function registerPosition(key) {
  positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
}

function unregisterPosition(key) {
  const n = (positionCounts.get(key) || 0) - 1;
  if (n <= 0) positionCounts.delete(key);
  else positionCounts.set(key, n);
}

function finishGame(message) {
  gameOver = true;
  selected = null;
  legalMoves = [];
  turnText.textContent = message;
  gameOverBannerEl.textContent = `Game Over — ${message}`;
  gameOverBannerEl.hidden = false;
  drawBoard();
}

function movesMatchingDestination(toR, toC) {
  return legalMoves.filter((m) => m.r === toR && m.c === toC);
}

function hidePromotionUI() {
  promotionBackdrop.hidden = true;
  promotionOptions.innerHTML = "";
  pendingPromotion = null;
  drawBoard();
}

function openPromotionPicker(fromR, fromC, toR, toC, candidates) {
  pendingPromotion = { fromR, fromC, toR, toC, candidates };
  promotionBackdrop.hidden = false;
  promotionOptions.innerHTML = "";
  const color = board[fromR][fromC][0];
  candidates.forEach((move) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "promotion-btn";
    const code = `${color}${move.promotion}`;
    btn.textContent = PIECES[code];
    btn.setAttribute("aria-label", `Promote to ${PIECE_NAMES[move.promotion]}`);
    btn.addEventListener("click", () => {
      executeMove(fromR, fromC, move);
      hidePromotionUI();
    });
    promotionOptions.appendChild(btn);
  });
  requestAnimationFrame(() => {
    const first = promotionOptions.querySelector(".promotion-btn");
    if (first) first.focus();
    else promotionCancelBtn.focus();
  });
  drawBoard();
}

function pushHistorySnapshot() {
  history.push({
    board: cloneBoard(board),
    turn,
    castling: cloneCastling(castling),
    enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
    halfmoveClock,
    positionCounts: clonePositionCounts(positionCounts),
    gameOver
  });
}

function undoLastMove() {
  if (history.length === 0 || pendingPromotion) return;
  const snap = history.pop();
  board = snap.board.map((row) => [...row]);
  turn = snap.turn;
  castling = cloneCastling(snap.castling);
  enPassantTarget = snap.enPassantTarget ? { ...snap.enPassantTarget } : null;
  halfmoveClock = snap.halfmoveClock;
  positionCounts = clonePositionCounts(snap.positionCounts);
  gameOver = snap.gameOver;
  selected = null;
  legalMoves = [];
  pendingPromotion = null;
  promotionBackdrop.hidden = true;
  promotionOptions.innerHTML = "";
  if (!gameOver) {
    gameOverBannerEl.hidden = true;
    gameOverBannerEl.textContent = "";
  }
  drawBoard();
  updateTurnText();
  focusSquareFromDOM();
}

function executeMove(fromR, fromC, chosenMove) {
  pushHistorySnapshot();

  const piece = board[fromR][fromC];
  const captured = peekCapturedPiece(board, fromR, fromC, chosenMove);

  const nextCastling = cloneCastling(castling);
  updateCastlingRightsFromMove(fromR, fromC, chosenMove, captured, nextCastling);
  castling = nextCastling;

  board = applyMoveToBoard(board, fromR, fromC, chosenMove);

  const nextEp = nextEnPassantTarget(fromR, fromC, piece, chosenMove);
  enPassantTarget = nextEp;

  halfmoveClock = advanceHalfmoveClock(piece, captured, chosenMove);

  const prevKey = positionSignature(history[history.length - 1].board, history[history.length - 1].turn, history[history.length - 1].castling, history[history.length - 1].enPassantTarget);
  unregisterPosition(prevKey);

  turn = turn === "w" ? "b" : "w";

  const newKey = positionSignature(board, turn, castling, enPassantTarget);
  registerPosition(newKey);

  selected = null;
  legalMoves = [];

  if (halfmoveClock >= 100) {
    finishGame("Draw — 50-move rule.");
    return;
  }

  const reps = positionCounts.get(newKey) || 0;
  if (reps >= 3) {
    finishGame("Draw — threefold repetition.");
    return;
  }

  if (hasInsufficientMaterial(board)) {
    finishGame("Draw — insufficient material.");
    return;
  }

  const inCheck = isKingInCheck(turn, board);
  const hasMove = hasAnyLegalMove(turn, board, { castling, enPassantTarget });

  if (inCheck && !hasMove) {
    const winner = turn === "w" ? "Black" : "White";
    finishGame(`Checkmate — ${winner} wins.`);
    return;
  }

  if (!inCheck && !hasMove) {
    finishGame("Stalemate — draw.");
    return;
  }

  drawBoard();
  updateTurnText();
}

function tryPlayMove(fromR, fromC, toR, toC) {
  const candidates = movesMatchingDestination(toR, toC);
  if (candidates.length === 0) return false;
  const needsPromotion = candidates.some((m) => m.promotion);
  if (needsPromotion) {
    openPromotionPicker(fromR, fromC, toR, toC, candidates);
    return true;
  }
  executeMove(fromR, fromC, candidates[0]);
  return true;
}

function handleSquareClick(r, c) {
  if (gameOver || pendingPromotion) return;
  const clickedPiece = board[r][c];

  if (selected) {
    if (tryPlayMove(selected.r, selected.c, r, c)) {
      return;
    }
  }

  if (clickedPiece && getColor(clickedPiece) === turn) {
    selected = { r, c };
    legalMoves = legalMovesForPiece(r, c, board, { castling, enPassantTarget });
    focusSquare = { r, c };
  } else {
    selected = null;
    legalMoves = [];
    focusSquare = { r, c };
  }
  drawBoard();
}

function squareLabel(r, c) {
  return `${FILES[c]}${8 - r}`;
}

function ariaPiecePhrase(piece, r, c) {
  if (!piece) return `Empty square ${squareLabel(r, c)}`;
  const colorWord = piece[0] === "w" ? "White" : "Black";
  return `${colorWord} ${PIECE_NAMES[piece[1]]}, ${squareLabel(r, c)}`;
}

function renderEdgeLabels() {
  const renderFiles = (container) => {
    container.innerHTML = "";
    for (let vc = 0; vc < 8; vc += 1) {
      const internalC = boardFlipped ? 7 - vc : vc;
      const span = document.createElement("span");
      span.className = "coord-label";
      span.textContent = FILES[internalC];
      container.appendChild(span);
    }
  };

  const renderRanks = (container) => {
    container.innerHTML = "";
    for (let vr = 0; vr < 8; vr += 1) {
      const internalR = boardFlipped ? 7 - vr : vr;
      const span = document.createElement("span");
      span.className = "coord-label";
      span.textContent = String(8 - internalR);
      container.appendChild(span);
    }
  };

  renderFiles(fileLabelsTop);
  renderFiles(fileLabelsBottom);
  renderRanks(rankLabelsLeft);
  renderRanks(rankLabelsRight);
}

function drawBoard() {
  boardEl.classList.toggle("game-over", gameOver);
  boardEl.innerHTML = "";
  renderEdgeLabels();
  boardEl.setAttribute("role", "grid");
  const checkedKingPos = !gameOver && isKingInCheck(turn, board) ? findKing(turn, board) : null;

  boardEl.setAttribute("aria-rowcount", "8");
  boardEl.setAttribute("aria-colcount", "8");

  for (let vr = 0; vr < 8; vr += 1) {
    for (let vc = 0; vc < 8; vc += 1) {
      const internalR = boardFlipped ? 7 - vr : vr;
      const internalC = boardFlipped ? 7 - vc : vc;
      const r = internalR;
      const c = internalC;

      const square = document.createElement("button");
      square.className = `square ${squareColorIndex(r, c) === "light" ? "light" : "dark"}`;
      square.type = "button";
      square.setAttribute("role", "gridcell");
      square.setAttribute("aria-rowindex", String(vr + 1));
      square.setAttribute("aria-colindex", String(vc + 1));
      square.tabIndex = 0;
      square.dataset.r = String(r);
      square.dataset.c = String(c);

      const piece = board[r][c];
      square.setAttribute("aria-label", ariaPiecePhrase(piece, r, c));

      if (samePos(checkedKingPos, { r, c })) {
        square.classList.add("checked-king");
      }

      if (samePos(selected, { r, c })) {
        square.classList.add("selected");
      }

      if (!pendingPromotion && focusSquare && focusSquare.r === r && focusSquare.c === c) {
        square.classList.add("focused");
      }

      const move = legalMoves.find((m) => m.r === r && m.c === c && !m.promotion)
        || legalMoves.find((m) => m.r === r && m.c === c);
      if (move && selected) {
        square.classList.add("possible");
        if (move.capture) square.classList.add("capture");
      }

      if (piece) {
        square.classList.add(piece[0] === "w" ? "piece-white" : "piece-black");
      }
      square.textContent = piece ? PIECES[piece] : "";
      square.addEventListener("click", () => handleSquareClick(r, c));
      boardEl.appendChild(square);
    }
  }
}

function focusSquareFromDOM() {
  const el = boardEl.querySelector(`button[data-r="${focusSquare.r}"][data-c="${focusSquare.c}"]`);
  if (el) el.focus();
}

function moveFocus(dr, dc) {
  if (gameOver || pendingPromotion || !focusSquare) return;
  const nr = focusSquare.r + dr;
  const nc = focusSquare.c + dc;
  if (!inBounds(nr, nc)) return;
  focusSquare = { r: nr, c: nc };
  drawBoard();
  focusSquareFromDOM();
}

function activateFocusedSquare() {
  if (gameOver || pendingPromotion || !focusSquare) return;
  handleSquareClick(focusSquare.r, focusSquare.c);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pendingPromotion) {
    e.preventDefault();
    hidePromotionUI();
    return;
  }
  if (pendingPromotion) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      moveFocus(boardFlipped ? 1 : -1, 0);
      break;
    case "ArrowDown":
      e.preventDefault();
      moveFocus(boardFlipped ? -1 : 1, 0);
      break;
    case "ArrowLeft":
      e.preventDefault();
      moveFocus(0, boardFlipped ? 1 : -1);
      break;
    case "ArrowRight":
      e.preventDefault();
      moveFocus(0, boardFlipped ? -1 : 1);
      break;
    case "Enter":
    case " ":
      if (gameOver) break;
      e.preventDefault();
      activateFocusedSquare();
      break;
    default:
      break;
  }
});

resetBtn.addEventListener("click", resetGame);
undoBtn.addEventListener("click", undoLastMove);
flipBtn.addEventListener("click", () => {
  boardFlipped = !boardFlipped;
  drawBoard();
  focusSquareFromDOM();
});

promotionCancelBtn.addEventListener("click", () => hidePromotionUI());

promotionBackdrop.addEventListener("click", (e) => {
  if (e.target === promotionBackdrop) hidePromotionUI();
});

resetGame();
