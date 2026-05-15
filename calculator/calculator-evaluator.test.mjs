import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(__dirname, "calculator-evaluator.js"), "utf8");
const ctx = { window: {}, globalThis: {} };
ctx.window = ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx);
const { evaluateMathExpression, toggleSignExpression } = ctx.CalculatorEval;

test("evaluate addition", () => {
  assert.strictEqual(evaluateMathExpression("2+2", true), 4);
});

test("evaluate sin 90 degrees", () => {
  assert.strictEqual(evaluateMathExpression("sin(90)", true), 1);
});

test("evaluate factorial", () => {
  assert.strictEqual(evaluateMathExpression("factorial(5)", true), 120);
});

test("toggle sign trailing integer", () => {
  assert.strictEqual(toggleSignExpression("5"), "-5");
  assert.strictEqual(toggleSignExpression("5+3"), "5+-3");
});

test("reject dangerous substring", () => {
  assert.throws(() => evaluateMathExpression("__proto__", true));
});
