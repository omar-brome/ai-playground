import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#1a1a1a] px-4 py-3 text-sm text-neutral-200 shadow-xl shadow-black/30">
      <p className="font-mono text-neutral-500">{label}s</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className={`font-mono ${entry.dataKey === "netWpm" ? "text-[#e2b714]" : "text-neutral-400"}`}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function WpmChart({ data }) {
  const chartData = data.length ? data : [{ second: 0, netWpm: 0, rawWpm: 0 }];

  return (
    <div className="h-56 rounded-3xl bg-[#111111] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
          <XAxis dataKey="second" stroke="#6b7280" tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="netWpm" stroke="#e2b714" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="rawWpm" stroke="#6b7280" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WpmChart;
