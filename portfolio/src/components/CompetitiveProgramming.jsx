import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";

const achievements = [
  {
    title: "LCPC 2015 -> ACPC 2015",
    team: "Team ENIAC",
    school: "Beirut Arab University",
    link: "https://icpc.global/regionals/finder/LCPC-2016/standings",
  },
  {
    title: "LCPC 2016 -> ACPC 2016",
    team: "Team NOR",
    school: "Beirut Arab University",
    link: "https://icpc.global/regionals/finder/LCPC-2017/standings",
  },
];

function CompetitiveProgramming() {
  return (
    <section id="competitive" className="section-shell">
      <p className="section-label">// 06 competitive programming</p>
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <h2 className="section-title">Algorithmic roots</h2>
          <p className="section-copy">
            Competed in regional collegiate programming contests, solving algorithmic problems under time
            pressure in C++ and qualifying twice from LCPC to ACPC.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {achievements.map((achievement, index) => (
            <motion.a
              key={achievement.title}
              href={achievement.link}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="glass-card group block rounded-3xl p-6 transition hover:-translate-y-1 hover:border-amber-300/30 hover:shadow-2xl hover:shadow-amber-950/20"
            >
              <div className="mb-5 inline-flex rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-300">
                <FaTrophy />
              </div>
              <h3 className="text-xl font-bold">{achievement.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{achievement.team}</p>
              <p className="text-sm text-slate-500">{achievement.school}</p>
              <p className="mt-4 font-mono text-xs text-amber-300/80 transition group-hover:text-amber-200">
                View ICPC standings
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CompetitiveProgramming;
