import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePassage } from "../utils/text.js";
import { useTimer } from "./useTimer.js";

const ignoredKeys = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function calculateCorrectCharacters(words, completedInputs, currentInput, currentWordIndex) {
  let correct = 0;
  let incorrect = 0;

  completedInputs.forEach((input, wordIndex) => {
    const word = words[wordIndex] ?? "";

    input.split("").forEach((character, characterIndex) => {
      if (character === word[characterIndex]) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    });
  });

  const currentWord = words[currentWordIndex] ?? "";
  currentInput.split("").forEach((character, characterIndex) => {
    if (character === currentWord[characterIndex]) {
      correct += 1;
    } else {
      incorrect += 1;
    }
  });

  return { correct, incorrect };
}

function buildMetrics({ words, completedInputs, currentInput, currentWordIndex, keyStats, elapsedMs }) {
  const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
  const typedCharacters = completedInputs.reduce((total, input) => total + input.length, 0) + currentInput.length;
  const { correct, incorrect } = calculateCorrectCharacters(words, completedInputs, currentInput, currentWordIndex);
  const rawWpm = Math.round(typedCharacters / 5 / minutes);
  const netWpm = Math.round(correct / 5 / minutes);
  const accuracy = keyStats.totalKeystrokes
    ? Math.max(0, Math.min(100, (keyStats.correctKeystrokes / keyStats.totalKeystrokes) * 100))
    : 100;

  return {
    rawWpm,
    netWpm,
    accuracy,
    typedCharacters,
    correctCharacters: correct,
    incorrectCharacters: incorrect,
    totalKeystrokes: keyStats.totalKeystrokes,
    backspaces: keyStats.backspaces,
    elapsedMs,
  };
}

/**
 * Owns the full typing-test lifecycle: passage generation, key handling, WPM, accuracy, history, and reset.
 * @param {{difficulty: string, mode: string, duration: number, punctuation: boolean, numbers: boolean}} settings
 * @returns {object} typing test state, metrics, event handlers, and reset helpers
 */
export function useTypingEngine(settings) {
  const [words, setWords] = useState(() => generatePassage(settings));
  const [completedInputs, setCompletedInputs] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [keyStats, setKeyStats] = useState({
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    backspaces: 0,
  });
  const [wpmHistory, setWpmHistory] = useState([]);
  const lastSampleSecondRef = useRef(-1);
  const metricsRef = useRef(null);

  const finishTest = useCallback(() => {
    setStatus((currentStatus) => {
      if (currentStatus === "complete") {
        return currentStatus;
      }

      return "complete";
    });
    setEndTime((currentEndTime) => currentEndTime ?? Date.now());
  }, []);

  const { elapsedMs, remainingMs, elapsedSeconds, remainingSeconds } = useTimer({
    status,
    startTime,
    endTime,
    mode: settings.mode,
    duration: settings.duration,
    onExpire: finishTest,
  });

  const metrics = useMemo(
    () =>
      buildMetrics({
        words,
        completedInputs,
        currentInput,
        currentWordIndex,
        keyStats,
        elapsedMs,
      }),
    [completedInputs, currentInput, currentWordIndex, elapsedMs, keyStats, words],
  );

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const resetTest = useCallback(
    ({ keepWords = false } = {}) => {
      setWords((currentWords) => (keepWords ? currentWords : generatePassage(settings)));
      setCompletedInputs([]);
      setCurrentInput("");
      setCurrentWordIndex(0);
      setStatus("idle");
      setStartTime(null);
      setEndTime(null);
      setKeyStats({
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        incorrectKeystrokes: 0,
        backspaces: 0,
      });
      setWpmHistory([]);
      lastSampleSecondRef.current = -1;
    },
    [settings],
  );

  useEffect(() => {
    resetTest();
  }, [settings.difficulty, settings.duration, settings.mode, settings.numbers, settings.punctuation, resetTest]);

  useEffect(() => {
    if (status !== "running" || elapsedSeconds <= 0 || lastSampleSecondRef.current === elapsedSeconds) {
      return;
    }

    lastSampleSecondRef.current = elapsedSeconds;
    setWpmHistory((history) => [
      ...history,
      {
        second: elapsedSeconds,
        netWpm: metricsRef.current?.netWpm ?? 0,
        rawWpm: metricsRef.current?.rawWpm ?? 0,
      },
    ]);
  }, [elapsedSeconds, status]);

  function startIfNeeded() {
    if (status === "idle") {
      setStatus("running");
      setStartTime(Date.now());
    }
  }

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resetTest();
        return;
      }

      if (status === "complete" || ignoredKeys.has(event.key) || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();

        if (!currentInput && status === "idle") {
          return;
        }

        startIfNeeded();
        setCompletedInputs((inputs) => [...inputs, currentInput]);
        setCurrentInput("");

        setCurrentWordIndex((wordIndex) => {
          const nextIndex = wordIndex + 1;

          if (settings.mode === "words" && nextIndex >= words.length) {
            finishTest();
          }

          return nextIndex;
        });
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        startIfNeeded();
        setCurrentInput((input) => input.slice(0, -1));
        setKeyStats((stats) => ({
          ...stats,
          totalKeystrokes: stats.totalKeystrokes + 1,
          backspaces: stats.backspaces + 1,
        }));
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();
      startIfNeeded();

      const targetWord = words[currentWordIndex] ?? "";
      const expectedCharacter = targetWord[currentInput.length];
      const isCorrect = event.key === expectedCharacter;
      const nextInput = `${currentInput}${event.key}`;

      setCurrentInput(nextInput);
      setKeyStats((stats) => ({
        ...stats,
        totalKeystrokes: stats.totalKeystrokes + 1,
        correctKeystrokes: stats.correctKeystrokes + (isCorrect ? 1 : 0),
        incorrectKeystrokes: stats.incorrectKeystrokes + (isCorrect ? 0 : 1),
      }));

      if (settings.mode === "words" && currentWordIndex === words.length - 1 && nextInput === targetWord) {
        finishTest();
      }
    },
    [currentInput, currentWordIndex, finishTest, resetTest, settings.mode, status, words],
  );

  const wordStates = useMemo(
    () =>
      words.map((word, wordIndex) => ({
        word,
        input: wordIndex < currentWordIndex ? completedInputs[wordIndex] ?? "" : wordIndex === currentWordIndex ? currentInput : "",
        isCurrent: wordIndex === currentWordIndex,
        isComplete: wordIndex < currentWordIndex,
      })),
    [completedInputs, currentInput, currentWordIndex, words],
  );

  return {
    words,
    wordStates,
    currentInput,
    currentWordIndex,
    status,
    timer: {
      elapsedMs,
      remainingMs,
      elapsedSeconds,
      remainingSeconds,
    },
    metrics,
    keyStats,
    wpmHistory,
    handleKeyDown,
    resetTest,
    retrySameSettings: () => resetTest({ keepWords: true }),
    finishTest,
  };
}
