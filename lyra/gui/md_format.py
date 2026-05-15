"""Minimal markdown-to-HTML for transcript (fenced code, inline code, bold)."""

from __future__ import annotations

import html


def simple_markdown_to_html(text: str) -> str:
    """Fenced ``` blocks, **bold**, `inline code`; HTML-safe."""
    if not text:
        return ""
    return _render_fenced_and_inline(text)


def _render_fenced_and_inline(text: str) -> str:
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        start = text.find("```", i)
        if start == -1:
            out.append(_inline_md(html.escape(text[i:])))
            break
        if start > i:
            out.append(_inline_md(html.escape(text[i:start])))
        nl = text.find("\n", start)
        if nl == -1:
            out.append(html.escape(text[start:]))
            break
        lang = text[start + 3 : nl].strip()
        body_start = nl + 1
        close = text.find("```", body_start)
        if close == -1:
            code = html.escape(text[body_start:])
            lang_attr = f' class="language-{html.escape(lang)}"' if lang else ""
            out.append(f'<pre style="background:#1e1e1e;color:#e5e5e5;padding:8px;border-radius:6px;"><code{lang_attr}>{code}</code></pre>')
            break
        code = html.escape(text[body_start:close])
        lang_attr = f' class="language-{html.escape(lang)}"' if lang else ""
        out.append(f'<pre style="background:#1e1e1e;color:#e5e5e5;padding:8px;border-radius:6px;"><code{lang_attr}>{code}</code></pre>')
        i = close + 3
    return "".join(out)


def _inline_md(escaped_segment: str) -> str:
    """escaped_segment is HTML-safe; apply bold/code on raw-like patterns is wrong.
    We only have escaped text — ** for bold: split by ** pairs."""
    # After html.escape, ** stays as ** — good
    parts = escaped_segment.split("**")
    if len(parts) < 3:
        return _backticks_in_escaped(escaped_segment)
    buf: list[str] = []
    for idx, p in enumerate(parts):
        if idx % 2 == 1:
            buf.append(f"<b>{p}</b>")
        else:
            buf.append(_backticks_in_escaped(p))
    return "".join(buf)


def _backticks_in_escaped(s: str) -> str:
    """Single backticks for inline code (escaped content)."""
    out: list[str] = []
    i = 0
    while True:
        a = s.find("`", i)
        if a == -1:
            out.append(s[i:])
            break
        out.append(s[i:a])
        b = s.find("`", a + 1)
        if b == -1:
            out.append(s[a:])
            break
        inner = s[a + 1 : b]
        out.append(f'<code style="background:#2a2a2a;padding:2px 4px;border-radius:3px;">{inner}</code>')
        i = b + 1
    return "".join(out)
