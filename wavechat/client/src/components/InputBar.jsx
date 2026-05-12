import { useEffect, useRef, useState } from "react";

function InputBar({ disabled, onSendMessage, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        onStopTyping();
      }
    };
  }, [onStopTyping]);

  useEffect(() => {
    if (disabled && isTypingRef.current) {
      onStopTyping();
      isTypingRef.current = false;
    }
  }, [disabled, onStopTyping]);

  function handleChange(event) {
    const nextText = event.target.value;
    setText(nextText);

    if (nextText.trim()) {
      if (!isTypingRef.current) {
        onTyping();
        isTypingRef.current = true;
      }
    } else if (isTypingRef.current) {
      onStopTyping();
      isTypingRef.current = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim() || disabled) {
      return;
    }

    onSendMessage(text);
    setText("");

    if (isTypingRef.current) {
      onStopTyping();
      isTypingRef.current = false;
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSubmit(event);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={disabled ? "Connecting..." : "Message this room"}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
      >
        Send
      </button>
    </form>
  );
}

export default InputBar;
