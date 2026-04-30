const display = document.getElementById("display");
const miniDisplay = document.getElementById("miniDisplay");
const buttons = document.querySelectorAll(".btn");

let expression = "";
let lastAnswer = 0;
let inDegrees = true;

function updateDisplay() {
  display.value = expression || "0";
  miniDisplay.textContent = inDegrees ? "Mode: DEG" : "Mode: RAD";
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error("Factorial only supports non-negative integers");
  }
  if (n > 170) {
    throw new Error("Value too large");
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

function sin(x) {
  return Math.sin(inDegrees ? (x * Math.PI) / 180 : x);
}

function cos(x) {
  return Math.cos(inDegrees ? (x * Math.PI) / 180 : x);
}

function tan(x) {
  return Math.tan(inDegrees ? (x * Math.PI) / 180 : x);
}

function ln(x) {
  return Math.log(x);
}

function log10(x) {
  return Math.log10(x);
}

function sqrt(x) {
  return Math.sqrt(x);
}

function pow(a, b) {
  return Math.pow(a, b);
}

function appendToken(token) {
  if (token === "pow2") {
    expression += "**2";
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
  display.value = "0";
}

function backspace() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
  } else {
    expression = `(-1)*(${expression})`;
  }
  updateDisplay();
}

function evaluateExpression() {
  if (!expression.trim()) {
    return;
  }

  try {
    const safeExpr = expression.replace(/\^/g, "**");
    const result = Function(
      '"use strict"; return (' +
        safeExpr +
        ");"
    )();

    if (!Number.isFinite(result)) {
      throw new Error("Invalid result");
    }

    miniDisplay.textContent = `${expression} =`;
    expression = String(Number(result.toFixed(12)));
    lastAnswer = Number(expression);
    display.value = expression;
  } catch (error) {
    display.value = "Error";
    expression = "";
    window.setTimeout(updateDisplay, 850);
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
      updateDisplay();
      return;
    }

    appendToken(fn);
  });
});

document.addEventListener("keydown", (event) => {
  const allowed = "0123456789+-*/().";
  if (allowed.includes(event.key)) {
    appendToken(event.key);
    return;
  }

  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    evaluateExpression();
    return;
  }

  if (event.key === "Backspace") {
    backspace();
    return;
  }

  if (event.key === "Escape") {
    clearAll();
  }
});

updateDisplay();
