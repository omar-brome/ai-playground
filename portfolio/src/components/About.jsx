import { motion } from "framer-motion";
import { useCounterAnimation } from "../hooks/useCounterAnimation.js";

const stats = [
  { label: "Years Experience", target: 9, suffix: "+" },
  { label: "Companies", target: 4, suffix: "" },
  { label: "Side Projects", target: 16, suffix: "+" },
  { label: "ACPC Qualifier", target: 2, suffix: "x" },
];

function StatCard({ stat }) {
  const { ref, value } = useCounterAnimation(stat.target);
  const display = stat.suffix === "x" ? `${value}x` : `${value}${stat.suffix}`;

  return (
    <div ref={ref} className="glass-card rounded-3xl p-5">
      <p className="text-3xl font-black tracking-tight text-white">{display}</p>
      <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="section-shell">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6 }}
        className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div>
          <p className="section-label">// 02 about</p>
          <h2 className="section-title">Systems focus. Product instinct. AI-assisted velocity.</h2>
          <p className="section-copy">
            Omar is a software developer based in Saida, Lebanon with 9+ years of professional experience.
            He specializes in C++/Qt desktop application development and Linux build environments, while also
            building full-stack web apps and AI-powered tools on the side. He has a competitive programming
            background through LCPC/ACPC and a passion for clean, well-structured code.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default About;
