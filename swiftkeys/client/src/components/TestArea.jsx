import { useEffect, useRef } from "react";
import Timer from "./Timer.jsx";
import WordDisplay from "./WordDisplay.jsx";

function TestArea({ engine, settings }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <section
      className="relative cursor-text rounded-[2rem] border border-neutral-800 bg-[#111111] p-4 shadow-2xl shadow-black/30"
      onClick={focusInput}
    >
      <input
        ref={inputRef}
        className="absolute h-0 w-0 opacity-0"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={engine.handleKeyDown}
        aria-label="Typing test input"
      />

      <div className="mb-4 flex items-center justify-between gap-4 px-2">
        <p className="font-mono text-sm text-neutral-600">
          {engine.status === "idle" ? "start typing to begin · esc resets" : engine.status}
        </p>
        <Timer
          mode={settings.mode}
          remainingSeconds={engine.timer.remainingSeconds}
          elapsedSeconds={engine.timer.elapsedSeconds}
          status={engine.status}
        />
      </div>

      <WordDisplay wordStates={engine.wordStates} />
    </section>
  );
}

export default TestArea;
