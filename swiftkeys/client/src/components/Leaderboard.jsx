import { motion } from "framer-motion";
import SettingsBar from "./SettingsBar.jsx";

function Leaderboard({ filters, onFiltersChange, leaderboard, username }) {
  return (
    <section className="rounded-[2rem] border border-neutral-800 bg-[#111111] p-5">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-2xl text-[#e2b714]">leaderboard</h2>
            <p className="text-sm text-neutral-600">
              {leaderboard.isBackendAvailable ? "global PostgreSQL scores" : "demo/local scores"}
            </p>
          </div>
          {leaderboard.isLoading && <p className="font-mono text-sm text-neutral-600">loading...</p>}
        </div>
        <SettingsBar settings={filters} onChange={onFiltersChange} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left font-mono text-sm">
          <thead className="text-neutral-600">
            <tr>
              <th className="px-3 py-2">rank</th>
              <th className="px-3 py-2">username</th>
              <th className="px-3 py-2">wpm</th>
              <th className="px-3 py-2">acc</th>
              <th className="px-3 py-2">difficulty</th>
              <th className="px-3 py-2">date</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.scores.map((score, index) => {
              const isCurrentUser = username && score.username === username;

              return (
                <motion.tr
                  key={`${score.username}-${score.created_at}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={isCurrentUser ? "bg-[#e2b714]/10 text-[#e2b714]" : "bg-[#1a1a1a] text-neutral-300"}
                >
                  <td className="rounded-l-2xl px-3 py-3">#{score.rank}</td>
                  <td className="px-3 py-3">{score.username}</td>
                  <td className="px-3 py-3">{score.wpm}</td>
                  <td className="px-3 py-3">{Number(score.accuracy).toFixed(1)}%</td>
                  <td className="px-3 py-3">{score.difficulty}</td>
                  <td className="rounded-r-2xl px-3 py-3">{new Date(score.created_at).toLocaleDateString()}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Leaderboard;
