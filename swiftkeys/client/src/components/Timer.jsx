function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function Timer({ mode, remainingSeconds, elapsedSeconds, status }) {
  const label = mode === "timed" ? formatSeconds(remainingSeconds) : formatSeconds(elapsedSeconds);

  return (
    <div className="font-mono text-3xl font-semibold text-[#e2b714]">
      {status === "idle" && mode === "timed" ? formatSeconds(remainingSeconds) : label}
    </div>
  );
}

export default Timer;
