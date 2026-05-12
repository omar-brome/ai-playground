import { useState } from "react";
import { motion } from "framer-motion";
import WpmChart from "./WpmChart.jsx";

function ResultsCard({ result, settings, history, username, onRetry, onNewTest, onSaveScore }) {
  const [saveState, setSaveState] = useState("");

  if (!result) {
    return null;
  }

  async function handleSave() {
    setSaveState("saving");
    const response = await onSaveScore(result);
    setSaveState(response.success ? `saved · rank #${response.rank}${response.demo ? " demo" : ""}` : response.error);
  }

  const items = [
    { label: "raw", value: result.rawWpm },
    { label: "accuracy", value: `${result.accuracy.toFixed(1)}%` },
    { label: "typed", value: result.typedCharacters },
    { label: "correct", value: result.correctCharacters },
    { label: "incorrect", value: result.incorrectCharacters },
    { label: "elapsed", value: `${(result.elapsedMs / 1000).toFixed(1)}s` },
    { label: "difficulty", value: settings.difficulty },
    { label: "mode", value: `${settings.duration}${settings.mode === "timed" ? "s" : "w"}` },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-neutral-800 bg-[#1a1a1a] p-6 shadow-2xl shadow-black/30"
    >
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-neutral-600">results</p>
      <div className="mt-4 grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-7xl font-bold text-[#e2b714]">{result.netWpm}</p>
          <p className="mt-1 font-mono text-neutral-500">net wpm</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#111111] p-3">
                <p className="font-mono text-lg text-neutral-100">{item.value}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <WpmChart data={history} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRetry} className="rounded-2xl bg-[#e2b714] px-4 py-3 font-semibold text-[#0f0f0f]">
          Retry same settings
        </button>
        <button type="button" onClick={onNewTest} className="rounded-2xl bg-[#111111] px-4 py-3 font-semibold text-neutral-300">
          New test
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!username || saveState === "saving"}
          className="rounded-2xl border border-neutral-800 px-4 py-3 font-semibold text-neutral-300 transition hover:border-[#e2b714] hover:text-[#e2b714] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {username ? "Save to leaderboard" : "Set username to save"}
        </button>
        {saveState && <span className="font-mono text-sm text-neutral-500">{saveState}</span>}
      </div>
    </motion.section>
  );
}

export default ResultsCard;
