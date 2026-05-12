import { useEffect, useMemo, useState } from "react";

/**
 * Tracks precise elapsed and remaining time for a typing test.
 * @param {{status: string, startTime: number | null, endTime: number | null, mode: string, duration: number, onExpire: () => void}} options
 * @returns {{elapsedMs: number, remainingMs: number, elapsedSeconds: number, remainingSeconds: number}}
 */
export function useTimer({ status, startTime, endTime, mode, duration, onExpire }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "running") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [status]);

  const elapsedMs = useMemo(() => {
    if (!startTime) {
      return 0;
    }

    return Math.max(0, (endTime ?? now) - startTime);
  }, [endTime, now, startTime]);

  const remainingMs = useMemo(() => {
    if (mode !== "timed") {
      return elapsedMs;
    }

    return Math.max(0, duration * 1000 - elapsedMs);
  }, [duration, elapsedMs, mode]);

  useEffect(() => {
    if (status === "running" && mode === "timed" && remainingMs <= 0) {
      onExpire();
    }
  }, [mode, onExpire, remainingMs, status]);

  return {
    elapsedMs,
    remainingMs,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}
