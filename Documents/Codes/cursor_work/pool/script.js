class Ball {
  constructor(id, number, type, color, x, y, radius) {
    this.id = id;
    this.number = number;
    this.type = type;
    this.color = color;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.pocketed = false;
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }

  update(dt, friction) {
    if (this.pocketed) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const drag = Math.max(0, 1 - friction * dt);
    this.vx *= drag;
    this.vy *= drag;
    if (this.speed() < 4) {
      this.vx = 0;
      this.vy = 0;
    }
  }

  draw(ctx) {
    if (this.pocketed) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (this.type === "solid" || this.type === "eight") {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = this.type === "eight" ? "#111111" : this.color;
      ctx.fill();
    } else if (this.type === "stripe") {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.rect(this.x - this.radius * 0.95, this.y - this.radius * 0.48, this.radius * 1.9, this.radius * 0.96);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    if (this.number > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.font = `bold ${Math.floor(this.radius * 0.7)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(this.number), this.x, this.y + 0.5);
    }

    ctx.restore();
  }
}

class Table {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.rail = 38;
    this.playX = this.rail;
    this.playY = this.rail;
    this.playWidth = this.width - this.rail * 2;
    this.playHeight = this.height - this.rail * 2;
    this.pocketRadius = 22;
    this.pockets = this.createPockets();
  }

  createPockets() {
    const x = this.playX;
    const y = this.playY;
    const w = this.playWidth;
    const h = this.playHeight;
    return [
      { x, y },
      { x: x + w / 2, y },
      { x: x + w, y },
      { x, y: y + h },
      { x: x + w / 2, y: y + h },
      { x: x + w, y: y + h }
    ];
  }

  drawSurface() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = "#3d2614";
    ctx.fillRect(0, 0, this.width, this.height);

    const feltGradient = ctx.createLinearGradient(this.playX, this.playY, this.playX + this.playWidth, this.playY + this.playHeight);
    feltGradient.addColorStop(0, "#188956");
    feltGradient.addColorStop(1, "#0f6f42");
    ctx.fillStyle = feltGradient;
    ctx.fillRect(this.playX, this.playY, this.playWidth, this.playHeight);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.playX + this.playWidth * 0.25, this.playY + this.playHeight / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    for (const pocket of this.pockets) {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, this.pocketRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
    }
  }
}

class GameController {
  constructor(canvas, dom) {
    this.table = new Table(canvas);
    this.canvas = canvas;
    this.ctx = this.table.ctx;
    this.dom = dom;
    this.ballRadius = 12;
    this.maxPower = 1050;
    this.friction = 0.85;
    this.running = false;
    this.lastTime = 0;
    this.dragging = false;
    this.gameOver = false;
    this.balls = [];
    this.currentPlayer = 1;
    this.players = {
      1: { group: null, pocketed: 0 },
      2: { group: null, pocketed: 0 }
    };
    this.turnPocketed = [];
    this.firstHit = null;
    this.shotInProgress = false;
    this.cueBallInHand = false;

    this.initBalls();
    this.bindEvents();
    this.updateUI("Player 1's turn", "Break shot: pocket a ball to claim solids/stripes.");
    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  initBalls() {
    this.balls = [];
    const cueX = this.table.playX + this.table.playWidth * 0.25;
    const cueY = this.table.playY + this.table.playHeight * 0.5;
    this.cueBall = new Ball("cue", 0, "cue", "#ffffff", cueX, cueY, this.ballRadius);
    this.balls.push(this.cueBall);

    const colorMap = {
      1: "#f5d10d", 2: "#2a4bd7", 3: "#d4372c", 4: "#6b34a6", 5: "#f1861a", 6: "#1f9a49", 7: "#7a2a15",
      9: "#f5d10d", 10: "#2a4bd7", 11: "#d4372c", 12: "#6b34a6", 13: "#f1861a", 14: "#1f9a49", 15: "#7a2a15"
    };
    const rackPattern = [1, 10, 11, 8, 6, 14, 2, 15, 13, 3, 5, 12, 9, 4, 7];
    const startX = this.table.playX + this.table.playWidth * 0.75;
    const startY = this.table.playY + this.table.playHeight * 0.5;
    let idx = 0;

    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const n = rackPattern[idx];
        const x = startX + row * (this.ballRadius * 1.9);
        const y = startY - row * this.ballRadius + col * (this.ballRadius * 2);
        const type = n === 8 ? "eight" : (n <= 7 ? "solid" : "stripe");
        this.balls.push(new Ball(`b${n}`, n, type, colorMap[n], x, y, this.ballRadius));
        idx += 1;
      }
    }
  }

  bindEvents() {
    $(this.canvas).on("mousedown", (e) => this.onPointerDown(e));
    $(window).on("mousemove", (e) => this.onPointerMove(e));
    $(window).on("mouseup", (e) => this.onPointerUp(e));
    $("#restartBtn").on("click", () => this.restart());
  }

  getPointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy
    };
  }

  onPointerDown(e) {
    if (this.gameOver || this.isAnyBallMoving()) return;
    const p = this.getPointer(e);
    const d = Math.hypot(p.x - this.cueBall.x, p.y - this.cueBall.y);

    if (this.cueBallInHand) {
      this.placeCueBall(p.x, p.y);
      return;
    }

    if (d <= this.ballRadius * 2.5 && !this.cueBall.pocketed) {
      this.dragging = true;
      this.dragStart = { x: p.x, y: p.y };
      this.dragCurrent = { x: p.x, y: p.y };
      this.setPowerBar(0);
    }
  }

  onPointerMove(e) {
    if (!this.dragging) return;
    this.dragCurrent = this.getPointer(e);
    const pull = Math.min(150, Math.hypot(this.dragCurrent.x - this.cueBall.x, this.dragCurrent.y - this.cueBall.y));
    this.setPowerBar((pull / 150) * 100);
  }

  onPointerUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.getPointer(e);
    const dx = this.cueBall.x - p.x;
    const dy = this.cueBall.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      this.setPowerBar(0);
      return;
    }
    const power = Math.min(this.maxPower, dist * 8);
    this.cueBall.vx = (dx / dist) * power;
    this.cueBall.vy = (dy / dist) * power;
    this.shotInProgress = true;
    this.firstHit = null;
    this.turnPocketed = [];
  }

  placeCueBall(x, y) {
    const margin = this.table.rail + this.ballRadius + 2;
    const minX = margin;
    const maxX = this.table.width / 2 - this.ballRadius;
    const minY = margin;
    const maxY = this.table.height - margin;
    this.cueBall.x = Math.min(maxX, Math.max(minX, x));
    this.cueBall.y = Math.min(maxY, Math.max(minY, y));
    this.cueBall.pocketed = false;
    this.cueBall.vx = 0;
    this.cueBall.vy = 0;
    this.cueBallInHand = false;
    this.updateUI(this.turnTitle(), "Cue ball placed. Take your shot.");
  }

  restart() {
    this.currentPlayer = 1;
    this.players = {
      1: { group: null, pocketed: 0 },
      2: { group: null, pocketed: 0 }
    };
    this.turnPocketed = [];
    this.firstHit = null;
    this.shotInProgress = false;
    this.gameOver = false;
    this.cueBallInHand = false;
    this.dragging = false;
    this.setPowerBar(0);
    this.initBalls();
    this.updateUI("Player 1's turn", "Break shot: pocket a ball to claim solids/stripes.");
  }

  loop(ts) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min(0.033, (ts - this.lastTime) / 1000) : 0.016;
    this.lastTime = ts;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    for (const ball of this.balls) {
      ball.update(dt, this.friction);
      this.handleWallCollision(ball);
    }
    this.resolveBallCollisions();
    this.checkPockets();

    if (this.shotInProgress && !this.isAnyBallMoving()) {
      this.shotInProgress = false;
      this.resolveTurn();
      this.setPowerBar(0);
    }
  }

  render() {
    this.table.drawSurface();
    for (const ball of this.balls) {
      ball.draw(this.ctx);
    }
    if (this.dragging && !this.gameOver) {
      this.drawAimLine();
    }
  }

  drawAimLine() {
    const ctx = this.ctx;
    const dx = this.cueBall.x - this.dragCurrent.x;
    const dy = this.cueBall.y - this.dragCurrent.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.cueBall.x, this.cueBall.y);
    ctx.lineTo(this.cueBall.x + nx * 250, this.cueBall.y + ny * 250);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(220,190,120,0.8)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.cueBall.x - nx * 8, this.cueBall.y - ny * 8);
    ctx.lineTo(this.cueBall.x - nx * 70, this.cueBall.y - ny * 70);
    ctx.stroke();
    ctx.restore();
  }

  handleWallCollision(ball) {
    if (ball.pocketed) return;
    const left = this.table.playX + ball.radius;
    const right = this.table.playX + this.table.playWidth - ball.radius;
    const top = this.table.playY + ball.radius;
    const bottom = this.table.playY + this.table.playHeight - ball.radius;

    if (ball.x < left) {
      ball.x = left;
      ball.vx *= -0.95;
    } else if (ball.x > right) {
      ball.x = right;
      ball.vx *= -0.95;
    }
    if (ball.y < top) {
      ball.y = top;
      ball.vy *= -0.95;
    } else if (ball.y > bottom) {
      ball.y = bottom;
      ball.vy *= -0.95;
    }
  }

  resolveBallCollisions() {
    for (let i = 0; i < this.balls.length; i += 1) {
      for (let j = i + 1; j < this.balls.length; j += 1) {
        const a = this.balls[i];
        const b = this.balls[j];
        if (a.pocketed || b.pocketed) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist === 0 || dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        a.x -= nx * (overlap / 2);
        a.y -= ny * (overlap / 2);
        b.x += nx * (overlap / 2);
        b.y += ny * (overlap / 2);

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal > 0) continue;

        const restitution = 0.96;
        const impulse = -(1 + restitution) * velAlongNormal / 2;
        const ix = impulse * nx;
        const iy = impulse * ny;
        a.vx -= ix;
        a.vy -= iy;
        b.vx += ix;
        b.vy += iy;

        if (!this.firstHit && this.shotInProgress && (a.id === "cue" || b.id === "cue")) {
          const objectBall = a.id === "cue" ? b : a;
          this.firstHit = objectBall;
        }
      }
    }
  }

  checkPockets() {
    for (const ball of this.balls) {
      if (ball.pocketed) continue;
      for (const pocket of this.table.pockets) {
        const d = Math.hypot(ball.x - pocket.x, ball.y - pocket.y);
        if (d <= this.table.pocketRadius - 2) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;
          if (ball.id !== "cue") this.turnPocketed.push(ball);
          if (ball.id === "cue") this.cueBallInHand = true;
          break;
        }
      }
    }
  }

  isAnyBallMoving() {
    return this.balls.some((b) => !b.pocketed && b.speed() > 0);
  }

  resolveTurn() {
    if (this.gameOver) return;
    const player = this.currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    const current = this.players[player];
    const other = this.players[opponent];
    let foul = false;
    let message = "";

    if (!this.firstHit) {
      foul = true;
      message = "Foul! You did not hit any object ball.";
    } else if (current.group) {
      if (this.firstHit.type !== current.group && this.firstHit.type !== "eight") {
        foul = true;
        message = "Foul! Wrong first ball hit.";
      }
      if (this.firstHit.type === "eight" && this.remainingFor(player) > 0) {
        foul = true;
        message = "Foul! 8-ball hit too early.";
      }
    }

    const pocketedEight = this.turnPocketed.some((b) => b.type === "eight");
    const pocketedSolids = this.turnPocketed.filter((b) => b.type === "solid").length;
    const pocketedStripes = this.turnPocketed.filter((b) => b.type === "stripe").length;

    if (!current.group && (pocketedSolids + pocketedStripes > 0)) {
      if (pocketedSolids > pocketedStripes) {
        current.group = "solid";
        other.group = "stripe";
      } else if (pocketedStripes > pocketedSolids) {
        current.group = "stripe";
        other.group = "solid";
      } else {
        const firstType = this.turnPocketed.find((b) => b.type === "solid" || b.type === "stripe");
        if (firstType) {
          current.group = firstType.type;
          other.group = firstType.type === "solid" ? "stripe" : "solid";
        }
      }
    }

    current.pocketed += this.turnPocketed.filter((b) => current.group && b.type === current.group).length;
    other.pocketed += this.turnPocketed.filter((b) => other.group && b.type === other.group).length;

    if (pocketedEight) {
      if (!foul && current.group && this.remainingFor(player) === 0) {
        this.endGame(`Player ${player} wins by pocketing the 8-ball!`);
        return;
      }
      this.endGame(`Player ${opponent} wins! Player ${player} lost on 8-ball.`);
      return;
    }

    if (this.cueBallInHand) {
      foul = true;
      message = "Foul! Cue ball scratched. Ball in hand for opponent.";
      this.resetCueBallForNextTurn();
    }

    const pocketedOwn = current.group
      ? this.turnPocketed.some((b) => b.type === current.group)
      : (pocketedSolids + pocketedStripes > 0);

    if (foul || !pocketedOwn) {
      this.currentPlayer = opponent;
    }

    if (!message) {
      if (pocketedOwn && !foul) {
        message = `Good shot! Player ${this.currentPlayer} continues.`;
      } else {
        message = `Turn switches to Player ${this.currentPlayer}.`;
      }
    }
    this.updateUI(this.turnTitle(), message);
    this.turnPocketed = [];
    this.firstHit = null;
  }

  resetCueBallForNextTurn() {
    this.cueBall.pocketed = false;
    this.cueBall.vx = 0;
    this.cueBall.vy = 0;
    this.cueBall.x = this.table.playX + this.table.playWidth * 0.25;
    this.cueBall.y = this.table.playY + this.table.playHeight * 0.5;
  }

  remainingFor(playerNum) {
    const group = this.players[playerNum].group;
    if (!group) return 7;
    return this.balls.filter((b) => !b.pocketed && b.type === group).length;
  }

  turnTitle() {
    return `Player ${this.currentPlayer}'s turn`;
  }

  setPowerBar(percent) {
    $("#powerBar").css("width", `${Math.max(0, Math.min(100, percent))}%`);
  }

  updateUI(turnText, statusText) {
    $("#turnIndicator").text(turnText);
    $("#statusMessage").text(statusText);
    $("#p1Pocketed").text(this.players[1].pocketed);
    $("#p2Pocketed").text(this.players[2].pocketed);
    $("#p1Group").text(this.players[1].group ? this.players[1].group : "Unassigned");
    $("#p2Group").text(this.players[2].group ? this.players[2].group : "Unassigned");
    $("#player1Card").toggleClass("active-player", this.currentPlayer === 1);
    $("#player2Card").toggleClass("active-player", this.currentPlayer === 2);
  }

  endGame(message) {
    this.gameOver = true;
    this.setPowerBar(0);
    this.updateUI("Game Over", message);
  }
}

$(function init() {
  const canvas = document.getElementById("poolCanvas");
  new GameController(canvas, {});
});
