function LiveStats({ metrics }) {
  const stats = [
    { label: "net", value: metrics.netWpm },
    { label: "raw", value: metrics.rawWpm },
    { label: "acc", value: `${metrics.accuracy.toFixed(1)}%` },
    { label: "chars", value: metrics.typedCharacters },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 text-center font-mono">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-[#1a1a1a] px-3 py-4">
          <p className="text-lg font-semibold text-neutral-200">{stat.value}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-600">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export default LiveStats;
