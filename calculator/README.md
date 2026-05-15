# SciCalc Pro

Browser scientific calculator: open [`calculator.html`](calculator.html) locally (double-click or any static file server).

## Scripts

| File | Purpose |
|------|---------|
| [`calculator-evaluator.js`](calculator-evaluator.js) | Safe evaluation via **injected** `Function` parameters (`sin`, `cos`, …, `Math`) plus light expression charset checks |
| [`calculator.js`](calculator.js) | UI: keypad, keyboard shortcuts, history, copy, paste sanitization |
| [`calculator.css`](calculator.css) | Layout and styling |

Run evaluator unit tests (requires Node 18+):

```bash
node --test calculator-evaluator.test.mjs
```

## Keyboard

| Key | Action |
|-----|--------|
| `0`–`9`, `+`, `-`, `*`, `/`, `(`, `)`, `%`, `^` | Append ( `%` is JS remainder ) |
| `.` or numpad decimal | Decimal point |
| `Enter` or `=` | Evaluate |
| `Backspace` | Delete last character |
| `Delete` | Clear all (`AC`) |
| `Escape` | Clear all |

Shortcuts apply when focus is not in another text field (the main display is allowed so keys still work).

## Features

- **DEG / RAD** for `sin`, `cos`, `tan`; inverse trig (`asin`, `acos`, `atan`) returns angle in the active mode.
- **Ans** inserts the previous numeric result.
- **±** toggles the trailing numeric literal, `Math.PI` / `Math.E`, or a balanced trailing `(…)` group; otherwise leaves the expression unchanged if ambiguous.
- **History**: last results list; tap an entry to load that result into the expression.
- **Copy** copies the current value; toolbar **%** inserts remainder operator.
- **Paste** into the display accepts sanitized math text (`×` / `÷` normalized).

## Limits

- Expressions are checked for disallowed patterns (e.g. `constructor`, `` ` ``, `[`) but remain arithmetic-oriented; this is not a full symbolic algebra system.
- Results are rounded with `toFixed(12)` for display persistence.
