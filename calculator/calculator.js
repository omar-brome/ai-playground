const display = document.getElementById("display");
const miniDisplay = document.getElementById("miniDisplay");
const historyTape = document.getElementById("historyTape");
const copyBtn = document.getElementById("copyBtn");
const percentBtn = document.getElementById("percentBtn");
const buttons = document.querySelectorAll(".keypad .btn");

let expression = "";
let lastAnswer = 0;
let inDegrees = true;
/** When set, mini shows last equation until user edits */
let miniEquationLine = "";

const HISTORY_LIMIT = 12;
/** @type {{ expr: string, result: string }[]} */
let historyEntries = [];

function updateDisplay() {
  display.value = expression || "0";
  miniDisplay.textContent =
    miniEquationLine || (inDegrees ? "Mode: DEG" : "Mode: RAD");
}

function pushHistory(expr, result) {
  historyEntries.unshift({ expr, result });
  if (historyEntries.length > HISTORY_LIMIT) {
    historyEntries.pop();
  }
  renderHistory();
}

function renderHistory() {
  historyTape.innerHTML = "";
  historyEntries.forEach((entry) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "history-entry";
    row.setAttribute("role", "listitem");
    row.setAttribute(
      "aria-label",
      `Use result ${entry.result} from ${entry.expr}`
    );
    row.textContent = `${entry.expr} = ${entry.result}`;
    row.addEventListener("click", () => {
      expression = entry.result;
      miniEquationLine = "";
      updateDisplay();
    });
    historyTape.appendChild(row);
  });
}

function appendToken(token) {
  miniEquationLine = "";
  if (token === "pow2") {
    expression += "**2";
  } else if (token === "pow10") {
    expression += "pow(10,";
  } else if (token === "pi") {
    expression += "Math.PI";
  } else if (token === "e") {
    expression += "Math.E";
  } else if (token === "ans") {
    expression += String(lastAnswer);
  } else {
    expression += token;
  }
  updateDisplay();
}

function clearAll() {
  expression = "";
  miniEquationLine = "";
  updateDisplay();
}

function backspace() {
  expression = expression.slice(0, -1);
  miniEquationLine = "";
  updateDisplay();
}

function toggleSign() {
  expression = CalculatorEval.toggleSignExpression(expression);
  miniEquationLine = "";
  updateDisplay();
}

function evaluateExpression() {
  if (!expression.trim()) {
    return;
  }

  const snapshot = expression;

  try {
    const result = CalculatorEval.evaluateMathExpression(expression, inDegrees);

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    miniEquationLine = `${snapshot} =`;
    expression = String(Number(result.toFixed(12)));
    lastAnswer = Number(expression);
    display.value = expression;
    miniDisplay.textContent = miniEquationLine;
    pushHistory(snapshot, expression);
  } catch {
    miniEquationLine = "";
    miniDisplay.textContent = "Error";
    display.value = "Error";
    expression = "";
    window.setTimeout(() => {
      miniDisplay.textContent = inDegrees ? "Mode: DEG" : "Mode: RAD";
      updateDisplay();
    }, 850);
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    const fn = button.dataset.fn;

    if (action === "clear") {
      clearAll();
      return;
    }
    if (action === "back") {
      backspace();
      return;
    }
    if (action === "equals") {
      evaluateExpression();
      return;
    }
    if (action === "sign") {
      toggleSign();
      return;
    }
    if (action === "deg") {
      inDegrees = !inDegrees;
      button.textContent = inDegrees ? "DEG" : "RAD";
      button.setAttribute("aria-pressed", String(inDegrees));
      button.setAttribute(
        "aria-label",
        inDegrees ? "Angle mode degrees, press for radians" : "Angle mode radians, press for degrees"
      );
      miniEquationLine = "";
      updateDisplay();
      return;
    }

    appendToken(fn);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const t = event.target;
  if (t && (t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (t && t.tagName === "INPUT" && t !== display) return;

  const allowed = "0123456789+-*/().%^";
  if (allowed.includes(event.key)) {
    event.preventDefault();
    appendToken(event.key);
    return;
  }

  if (event.key === "." || event.code === "NumpadDecimal") {
    event.preventDefault();
    appendToken(".");
    return;
  }

  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    evaluateExpression();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    backspace();
    return;
  }

  if (event.key === "Delete") {
    event.preventDefault();
    clearAll();
    return;
  }

  if (event.key === "Escape") {
    clearAll();
  }
});

display.addEventListener("paste", (e) => {
  e.preventDefault();
  let text = e.clipboardData.getData("text/plain");
  text = text.replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  const ok = /^[0-9+\-*/().%^a-zA-Z_,]+$/;
  if (!text || !ok.test(text)) return;
  miniEquationLine = "";
  expression += text;
  updateDisplay();
});

copyBtn.addEventListener("click", async () => {
  const text = display.value === "Error" ? "" : expression || display.value;
  if (!text || text === "0") return;
  try {
    await navigator.clipboard.writeText(text);
    const prev = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    window.setTimeout(() => {
      copyBtn.textContent = prev;
    }, 1400);
  } catch {
    copyBtn.textContent = "Copy failed";
    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1400);
  }
});

percentBtn.addEventListener("click", () => appendToken("%"));

const degBtn = document.querySelector('[data-action="deg"]');
if (degBtn) {
  degBtn.setAttribute("aria-pressed", "true");
}

updateDisplay();
renderHistory();
