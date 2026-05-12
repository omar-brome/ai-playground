import { useMemo, useState } from "react";
import Leaderboard from "./components/Leaderboard.jsx";
import LiveStats from "./components/LiveStats.jsx";
import Navbar from "./components/Navbar.jsx";
import ResultsCard from "./components/ResultsCard.jsx";
import TestArea from "./components/TestArea.jsx";
import UsernameModal from "./components/UsernameModal.jsx";
import { useLeaderboard } from "./hooks/useLeaderboard.js";
import { useTypingEngine } from "./hooks/useTypingEngine.js";

const usernameKey = "swiftkeys.username";

function App() {
  const [settings, setSettings] = useState({
    difficulty: "medium",
    mode: "timed",
    duration: 60,
    punctuation: false,
    numbers: false,
  });
  const stableSettings = useMemo(() => settings, [settings]);
  const [leaderboardFilters, setLeaderboardFilters] = useState(settings);
  const [username, setUsername] = useState(() => localStorage.getItem(usernameKey) || "");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(() => !localStorage.getItem(usernameKey));
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const engine = useTypingEngine(stableSettings);
  const leaderboard = useLeaderboard(leaderboardFilters, username);
  const result = engine.status === "complete" ? engine.metrics : null;

  function handleUsernameSave(nextUsername) {
    localStorage.setItem(usernameKey, nextUsername);
    setUsername(nextUsername);
    setIsUsernameModalOpen(false);
  }

  async function handleSaveScore(finalResult) {
    setLeaderboardFilters(settings);
    const response = await leaderboard.submitScore(finalResult, settings);
    setIsLeaderboardOpen(true);
    return response;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200">
      <Navbar
        settings={settings}
        onSettingsChange={setSettings}
        username={username}
        onUsernameClick={() => setIsUsernameModalOpen(true)}
      />

      <main className="mx-auto flex w-full max-w-[750px] flex-col gap-6 px-4 pb-16 pt-4">
        <TestArea engine={engine} settings={settings} />
        <LiveStats metrics={engine.metrics} />

        {result && (
          <ResultsCard
            result={result}
            settings={settings}
            history={engine.wpmHistory}
            username={username}
            onRetry={engine.retrySameSettings}
            onNewTest={engine.resetTest}
            onSaveScore={handleSaveScore}
          />
        )}

        <button
          type="button"
          onClick={() => setIsLeaderboardOpen((current) => !current)}
          className="self-center rounded-2xl border border-neutral-800 px-5 py-3 font-mono text-sm text-neutral-500 transition hover:border-[#e2b714] hover:text-[#e2b714]"
        >
          {isLeaderboardOpen ? "hide leaderboard" : "show leaderboard"}
        </button>

        {isLeaderboardOpen && (
          <Leaderboard
            filters={leaderboardFilters}
            onFiltersChange={setLeaderboardFilters}
            leaderboard={leaderboard}
            username={username}
          />
        )}
      </main>

      <UsernameModal
        isOpen={isUsernameModalOpen}
        onSave={handleUsernameSave}
        onSkip={() => setIsUsernameModalOpen(false)}
      />
    </div>
  );
}

export default App;
