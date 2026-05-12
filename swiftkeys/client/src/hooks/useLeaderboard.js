import { useCallback, useEffect, useMemo, useState } from "react";

const storageKey = "swiftkeys.demoScores";

const starterScores = [
  { username: "monkey", wpm: 112, accuracy: 97.4, difficulty: "medium", mode: "timed", duration: 60, created_at: new Date(Date.now() - 86400000).toISOString() },
  { username: "cipher", wpm: 104, accuracy: 95.9, difficulty: "medium", mode: "timed", duration: 60, created_at: new Date(Date.now() - 172800000).toISOString() },
  { username: "syntax", wpm: 96, accuracy: 98.1, difficulty: "easy", mode: "timed", duration: 30, created_at: new Date(Date.now() - 259200000).toISOString() },
  { username: "runtime", wpm: 88, accuracy: 93.7, difficulty: "hard", mode: "words", duration: 50, created_at: new Date(Date.now() - 3600000).toISOString() },
];

function loadLocalScores() {
  try {
    const storedScores = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return storedScores.length ? storedScores : starterScores;
  } catch {
    return starterScores;
  }
}

function saveLocalScore(score) {
  const scores = loadLocalScores();
  const nextScores = [{ ...score, created_at: new Date().toISOString() }, ...scores].slice(0, 100);
  localStorage.setItem(storageKey, JSON.stringify(nextScores));
  return nextScores;
}

function rankScores(scores) {
  return [...scores]
    .sort((first, second) => second.wpm - first.wpm || second.accuracy - first.accuracy)
    .map((score, index) => ({ ...score, rank: index + 1 }));
}

function matchesFilters(score, filters) {
  return (
    score.difficulty === filters.difficulty &&
    score.mode === filters.mode &&
    Number(score.duration) === Number(filters.duration)
  );
}

/**
 * Fetches and submits leaderboard data, using PostgreSQL API when available and local demo scores otherwise.
 * @param {{difficulty: string, mode: string, duration: number}} filters
 * @param {string} username
 * @returns {{scores: Array, isBackendAvailable: boolean, isLoading: boolean, error: string, refresh: Function, submitScore: Function}}
 */
export function useLeaderboard(filters, username) {
  const [scores, setScores] = useState([]);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      difficulty: filters.difficulty,
      mode: filters.mode,
      duration: String(filters.duration),
    });

    return params.toString();
  }, [filters.difficulty, filters.duration, filters.mode]);

  const loadFallback = useCallback(() => {
    const localScores = rankScores(loadLocalScores().filter((score) => matchesFilters(score, filters))).slice(0, 20);
    setScores(localScores);
    setIsBackendAvailable(false);
  }, [filters]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/leaderboard?${queryString}`);

      if (!response.ok) {
        throw new Error("Leaderboard API unavailable");
      }

      const data = await response.json();
      setScores(data);
      setIsBackendAvailable(true);
    } catch (fetchError) {
      setError(fetchError.message);
      loadFallback();
    } finally {
      setIsLoading(false);
    }
  }, [loadFallback, queryString]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitScore = useCallback(
    async (result, scoreFilters = filters) => {
      if (!username) {
        return { success: false, error: "Username is required to save scores." };
      }

      const payload = {
        username,
        wpm: result.netWpm,
        accuracy: Number(result.accuracy.toFixed(2)),
        difficulty: scoreFilters.difficulty,
        mode: scoreFilters.mode,
        duration: scoreFilters.duration,
      };

      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Score API unavailable");
        }

        const data = await response.json();
        await refresh();
        return data;
      } catch {
        const localScores = saveLocalScore(payload);
        const rankedScores = rankScores(localScores.filter((score) => matchesFilters(score, scoreFilters)));
        setScores(rankedScores.slice(0, 20));
        setIsBackendAvailable(false);

        return {
          success: true,
          demo: true,
          rank: rankedScores.find((score) => score.created_at === localScores[0].created_at)?.rank ?? 1,
        };
      }
    },
    [filters, refresh, username],
  );

  return {
    scores,
    isBackendAvailable,
    isLoading,
    error,
    refresh,
    submitScore,
  };
}
