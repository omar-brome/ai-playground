/**
 * Pure math evaluation for SciCalc Pro — no DOM.
 * Uses injected identifiers only (no global lookup inside Function body).
 */
(function attachCalculatorEval(global) {
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

  function assertSafeExpression(expr) {
    if (!expr.trim()) throw new Error("Empty expression");
    const allowedCharset = /^[0-9+\-*/().%\s^a-zA-Z_,]+$/;
    if (!allowedCharset.test(expr)) {
      throw new Error("Invalid characters in expression");
    }
    const deny =
      /(constructor|__proto__|prototype|\beval\b|\bFunction\b|\bimport\b|;|\\|`|\[|\])/i;
    if (deny.test(expr)) {
      throw new Error("Invalid expression");
    }
  }

  function evaluateMathExpression(rawExpr, inDegrees) {
    const expr = rawExpr.replace(/\^/g, "**").trim();
    assertSafeExpression(expr);

    const rad = (x) => (inDegrees ? (x * Math.PI) / 180 : x);
    const sin = (x) => Math.sin(rad(x));
    const cos = (x) => Math.cos(rad(x));
    const tan = (x) => Math.tan(rad(x));
    const asin = (x) =>
      inDegrees ? Math.asin(x) * (180 / Math.PI) : Math.asin(x);
    const acos = (x) =>
      inDegrees ? Math.acos(x) * (180 / Math.PI) : Math.acos(x);
    const atan = (x) =>
      inDegrees ? Math.atan(x) * (180 / Math.PI) : Math.atan(x);
    const ln = Math.log;
    const log10 = Math.log10;
    const sqrt = Math.sqrt;
    const pow = Math.pow;
    const exp = Math.exp;

    const fn = new Function(
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "ln",
      "log10",
      "sqrt",
      "pow",
      "exp",
      "factorial",
      "Math",
      `"use strict"; return (${expr});`
    );

    return fn(
      sin,
      cos,
      tan,
      asin,
      acos,
      atan,
      ln,
      log10,
      sqrt,
      pow,
      exp,
      factorial,
      Math
    );
  }

  function parenBalanced(s) {
    let n = 0;
    for (let i = 0; i < s.length; i += 1) {
      const c = s[i];
      if (c === "(") n += 1;
      else if (c === ")") {
        n -= 1;
        if (n < 0) return false;
      }
    }
    return n === 0;
  }

  /**
   * Toggle sign of trailing numeric literal, constants, or balanced (...).
   */
  function toggleSignExpression(expression) {
    const s = expression.trimEnd();
    if (!s) return "-";

    const numRe = /(-?)(?:\d+\.\d*|\d+\.|\.\d+|\d+)$/;
    const nm = s.match(numRe);
    if (nm && nm.index !== undefined) {
      const i = nm.index;
      const full = nm[0];
      const neg = full.startsWith("-") ? full.slice(1) : `-${full}`;
      return s.slice(0, i) + neg;
    }

    if (s.endsWith("Math.PI")) {
      return `${s.slice(0, -7)}(-Math.PI)`;
    }
    if (s.endsWith("Math.E")) {
      return `${s.slice(0, -6)}(-Math.E)`;
    }

    if (s.endsWith(")") && parenBalanced(s)) {
      return `(-1)*(${s})`;
    }

    return s;
  }

  global.CalculatorEval = {
    factorial,
    evaluateMathExpression,
    toggleSignExpression,
    parenBalanced,
  };
})(typeof window !== "undefined" ? window : globalThis);
