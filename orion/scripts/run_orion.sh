#!/usr/bin/env bash
# Prefer python.org's Python (bundled Tk works well). Falls back to PATH python3.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pick_python() {
  if [[ -n "${PYTHON:-}" && -x "${PYTHON}" ]]; then
    echo "${PYTHON}"
    return 0
  fi
  local p
  for p in \
    "/Library/Frameworks/Python.framework/Versions/Current/bin/python3" \
    "/usr/local/bin/python3"; do
    if [[ -x "${p}" ]]; then
      echo "${p}"
      return 0
    fi
  done
  command -v python3
}

PY="$(pick_python)"
exec "${PY}" main.py "$@"
